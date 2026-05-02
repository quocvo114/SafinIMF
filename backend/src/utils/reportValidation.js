const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 100;
const MIN_IMAGES = 3;
const MAX_IMAGES = 5;

const DA_NANG_BOUNDS = {
  minLat: 15.88,
  maxLat: 16.25,
  minLng: 107.95,
  maxLng: 108.35,
};

function stripVietnamese(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function parseCoordinates(location, latitude, longitude) {
  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
    return { latitude: latNum, longitude: lngNum };
  }

  if (typeof location !== "string") {
    return null;
  }

  const match = location.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
  };
}

function isWithinDaNang(latitude, longitude) {
  return (
    latitude >= DA_NANG_BOUNDS.minLat &&
    latitude <= DA_NANG_BOUNDS.maxLat &&
    longitude >= DA_NANG_BOUNDS.minLng &&
    longitude <= DA_NANG_BOUNDS.maxLng
  );
}

function validateImageDataUrl(image, index) {
  if (typeof image !== "string" || !image.trim()) {
    return `Ảnh thứ ${index + 1} không hợp lệ`;
  }

  const match = /^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/i.exec(image.trim());
  if (!match) {
    return `Ảnh thứ ${index + 1} phải ở định dạng base64 data URL`;
  }

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    return `Ảnh thứ ${index + 1} phải là JPG hoặc PNG`;
  }

  const base64Payload = match[2].replace(/\s/g, "");
  const buffer = Buffer.from(base64Payload, "base64");
  if (!buffer.length) {
    return `Ảnh thứ ${index + 1} bị rỗng hoặc không đọc được`;
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    return `Ảnh thứ ${index + 1} vượt quá 5MB`;
  }

  return null;
}

function validateCreateReportPayload(payload) {
  const {
    title,
    type,
    location,
    description,
    images,
    userId,
    latitude,
    longitude,
  } = payload || {};

  const trimmedTitle = String(title || "").trim();
  const trimmedType = String(type || "").trim();
  const trimmedLocation = String(location || "").trim();
  const trimmedDescription = String(description || "").trim();
  const trimmedUserId = String(userId || "").trim();

  if (!trimmedTitle || !trimmedType || !trimmedUserId) {
    return {
      valid: false,
      message: "Thiếu thông tin bắt buộc: title, type, userId",
    };
  }

  if (
    trimmedDescription.length < MIN_DESCRIPTION_LENGTH ||
    trimmedDescription.length > MAX_DESCRIPTION_LENGTH
  ) {
    return {
      valid: false,
      message: `Mô tả phải từ ${MIN_DESCRIPTION_LENGTH} đến ${MAX_DESCRIPTION_LENGTH} ký tự`,
    };
  }

  if (
    !Array.isArray(images) ||
    images.length < MIN_IMAGES ||
    images.length > MAX_IMAGES
  ) {
    return {
      valid: false,
      message: `Cần tải từ ${MIN_IMAGES} đến ${MAX_IMAGES} ảnh`,
    };
  }

  for (let i = 0; i < images.length; i += 1) {
    const imageError = validateImageDataUrl(images[i], i);
    if (imageError) {
      return { valid: false, message: imageError };
    }
  }

  const coords = parseCoordinates(trimmedLocation, latitude, longitude);
  if (coords) {
    if (!isWithinDaNang(coords.latitude, coords.longitude)) {
      return {
        valid: false,
        message: "Vị trí ngoài phạm vi Đà Nẵng",
      };
    }
  } else {
    if (!trimmedLocation) {
      return {
        valid: false,
        message: "Thiếu thông tin vị trí GPS",
      };
    }

    const normalizedLocation = stripVietnamese(trimmedLocation);
    if (!normalizedLocation.includes("da nang")) {
      return {
        valid: false,
        message: "Vị trí ngoài phạm vi Đà Nẵng",
      };
    }
  }

  return {
    valid: true,
    data: {
      title: trimmedTitle,
      type: trimmedType,
      location: trimmedLocation,
      description: trimmedDescription,
      images,
      userId: trimmedUserId,
    },
  };
}

function isAiAccepted(aiResult) {
  if (!aiResult || aiResult.aiVerified !== true) {
    return false;
  }

  if (
    !Number(aiResult.aiTotalObjects) ||
    Number(aiResult.aiTotalObjects) <= 0
  ) {
    return false;
  }

  const label = String(aiResult.aiLabel || "")
    .trim()
    .toLowerCase();
  if (!label || label === "no detection" || label === "unknown") {
    return false;
  }

  return true;
}

module.exports = {
  validateCreateReportPayload,
  isAiAccepted,
};
