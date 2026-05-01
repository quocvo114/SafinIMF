const exifr = require("exifr");

function parseDataUrlToBuffer(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Invalid image data URL");
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(
    input.trim(),
  );
  if (!match) {
    throw new Error("Invalid base64 image format");
  }

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2].replace(/\s/g, "");
  const buffer = Buffer.from(base64Payload, "base64");

  if (!buffer.length) {
    throw new Error("Empty image buffer");
  }

  return { buffer, mimeType };
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pickExifDate(exif) {
  const value =
    exif?.DateTimeOriginal ||
    exif?.CreateDate ||
    exif?.ModifyDate ||
    exif?.DateTimeDigitized ||
    null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  return null;
}

async function extractExifFromImages(
  images,
  {
    reportLatitude = null,
    reportLongitude = null,
    reportTime = new Date(),
  } = {},
) {
  const details = [];

  for (let i = 0; i < (images || []).length; i += 1) {
    try {
      const { buffer, mimeType } = parseDataUrlToBuffer(images[i]);
      const exif = await exifr.parse(buffer, {
        tiff: true,
        exif: true,
        gps: true,
        ifd0: true,
      });

      const latitude = Number(exif?.latitude);
      const longitude = Number(exif?.longitude);
      const capturedAt = pickExifDate(exif);

      details.push({
        index: i,
        mimeType,
        hasExif: Boolean(exif),
        latitude: isFiniteNumber(latitude) ? latitude : null,
        longitude: isFiniteNumber(longitude) ? longitude : null,
        capturedAt: capturedAt ? capturedAt.toISOString() : null,
        make: exif?.Make || null,
        model: exif?.Model || null,
        software: exif?.Software || null,
      });
    } catch (error) {
      details.push({
        index: i,
        hasExif: false,
        latitude: null,
        longitude: null,
        capturedAt: null,
        error: error.message,
      });
    }
  }

  const firstWithGps = details.find(
    (item) => isFiniteNumber(item.latitude) && isFiniteNumber(item.longitude),
  );
  const firstWithTime = details.find((item) => item.capturedAt);

  const distanceKm =
    firstWithGps &&
    isFiniteNumber(reportLatitude) &&
    isFiniteNumber(reportLongitude)
      ? Number(
          haversineKm(
            reportLatitude,
            reportLongitude,
            firstWithGps.latitude,
            firstWithGps.longitude,
          ).toFixed(4),
        )
      : null;

  const hoursDiff = firstWithTime
    ? Number(
        (
          Math.abs(
            new Date(reportTime).getTime() -
              new Date(firstWithTime.capturedAt).getTime(),
          ) /
          (1000 * 60 * 60)
        ).toFixed(2),
      )
    : null;

  return {
    images: details,
    summary: {
      gpsAvailable: Boolean(firstWithGps),
      dateTimeAvailable: Boolean(firstWithTime),
      exifLatitude: firstWithGps?.latitude ?? null,
      exifLongitude: firstWithGps?.longitude ?? null,
      exifDateTime: firstWithTime?.capturedAt ?? null,
      reportLatitude: isFiniteNumber(reportLatitude) ? reportLatitude : null,
      reportLongitude: isFiniteNumber(reportLongitude) ? reportLongitude : null,
      distanceKm,
      hoursDiff,
    },
  };
}

module.exports = {
  extractExifFromImages,
};
