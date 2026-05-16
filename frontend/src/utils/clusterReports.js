import {
  CLUSTER_RADIUS_M,
  CLUSTER_TIME_WINDOW_H,
} from "../constants/mapConfig";

const EARTH_RADIUS_M = 6371000;

const toRadians = (value) => (value * Math.PI) / 180;

export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
};

const parseTimeMs = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }

    const matched = value.match(
      /(\d{1,2}):(\d{2}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    );
    if (matched) {
      const [, hour, minute, day, month, year] = matched;
      const reconstructed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
      );
      if (!Number.isNaN(reconstructed.getTime())) {
        return reconstructed.getTime();
      }
    }
  }

  return null;
};

const extractPosition = (report) => {
  if (Array.isArray(report?.position) && report.position.length >= 2) {
    const lat = Number(report.position[0]);
    const lng = Number(report.position[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const lat = Number(report?.lat);
  const lng = Number(report?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return null;
};

const resolveType = (report) => report?.type ?? report?.category ?? null;

const withinTimeWindow = (seedTimeMs, candidateTimeMs, windowMs) => {
  if (seedTimeMs === null || candidateTimeMs === null) {
    return true;
  }

  return candidateTimeMs - seedTimeMs <= windowMs;
};

export const clusterReports = (
  reports,
  radiusMeters = CLUSTER_RADIUS_M,
  timeWindowHours = CLUSTER_TIME_WINDOW_H,
) => {
  if (!Array.isArray(reports) || reports.length === 0) {
    return [];
  }

  const windowMs = Math.max(timeWindowHours, 0) * 60 * 60 * 1000;

  const prepared = reports
    .map((report, index) => {
      const type = resolveType(report);
      const position = extractPosition(report);
      if (!type || !position) {
        return null;
      }

      const timeMs =
        parseTimeMs(report?.createdAtMs) ??
        parseTimeMs(report?.createdAt) ??
        parseTimeMs(report?.created_at) ??
        parseTimeMs(report?.time);

      return {
        report,
        type,
        index,
        timeMs,
        lat: position.lat,
        lng: position.lng,
      };
    })
    .filter(Boolean);

  const grouped = new Map();

  for (const item of prepared) {
    const bucket = grouped.get(item.type) || [];
    bucket.push(item);
    grouped.set(item.type, bucket);
  }

  const clusters = [];

  for (const [type, items] of grouped.entries()) {
    const sorted = [...items].sort((a, b) => {
      const timeA = a.timeMs ?? Number.MAX_SAFE_INTEGER;
      const timeB = b.timeMs ?? Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });

    const used = new Set();

    for (let i = 0; i < sorted.length; i += 1) {
      const seed = sorted[i];
      if (used.has(seed.index)) {
        continue;
      }

      const clusterItems = [seed];
      used.add(seed.index);

      for (let j = i + 1; j < sorted.length; j += 1) {
        const candidate = sorted[j];
        if (used.has(candidate.index)) {
          continue;
        }

        const distance = haversineDistance(
          seed.lat,
          seed.lng,
          candidate.lat,
          candidate.lng,
        );

        if (distance > radiusMeters) {
          continue;
        }

        if (!withinTimeWindow(seed.timeMs, candidate.timeMs, windowMs)) {
          continue;
        }

        clusterItems.push(candidate);
        used.add(candidate.index);
      }

      const centerLat =
        clusterItems.reduce((sum, item) => sum + item.lat, 0) /
        clusterItems.length;
      const centerLng =
        clusterItems.reduce((sum, item) => sum + item.lng, 0) /
        clusterItems.length;

      const seedId = seed.report?.id ?? seed.report?.report_id ?? seed.index;

      clusters.push({
        id: `cluster-${type}-${seedId}`,
        type,
        reports: clusterItems.map((item) => item.report),
        centerLat,
        centerLng,
        count: clusterItems.length,
      });
    }
  }

  return clusters;
};
