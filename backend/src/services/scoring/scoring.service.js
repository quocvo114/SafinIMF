/**
 * Scoring Service — Tính độ tin cậy báo cáo theo 4 tiêu chí
 * Spec: scroring.md
 *
 * Output confidenceScore: 0–100 (rounded integer)
 * AI Vision là BẮT BUỘC — nếu AI từ chối → không gọi hàm này
 */

// ---------------------------------------------------------------------------
// 1. Location Score
// score = max(0, 100 - (distanceKm / 5) × 100)
// ---------------------------------------------------------------------------
function calcLocationScore(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(Number(distanceKm))) {
    return null; // Không có GPS EXIF → bỏ qua tiêu chí này
  }
  const d = Math.max(0, Number(distanceKm));
  return Math.max(0, 100 - (d / 5) * 100);
}

// ---------------------------------------------------------------------------
// 2. Content Score
// Từ mạnh (+2), từ thường (+1), max 18 pts → normalized to 100
// ---------------------------------------------------------------------------
const STRONG_KEYWORDS = [
  "pothole", "hole", "hố", "nứt", "crack", "gãy", "broken",
  "nguy hiểm", "hazard", "accident", "tai nạn", "damaged", "hư hỏng",
];

const REGULAR_KEYWORDS = [
  "road", "đường", "asphalt", "nhựa", "pavement", "vỉa hè",
  "traffic", "giao thông", "repair", "sửa chữa",
  "unsafe", "không an toàn", "risk", "rủi ro",
  "deteriorated", "suy thoái",
];

const MAX_KEYWORD_SCORE = 18; // 9 strong × 2pts (spec: "18 là tổng điểm tối đa")

function calcContentScore(description) {
  if (!description || typeof description !== "string") return 0;

  const text = description.toLowerCase();
  let total = 0;

  for (const kw of STRONG_KEYWORDS) {
    // Word-boundary style: dùng indexOf để tránh partial match sai
    if (text.includes(kw)) {
      total += 2;
    }
  }

  for (const kw of REGULAR_KEYWORDS) {
    if (text.includes(kw)) {
      total += 1;
    }
  }

  return Math.min(100, (total / MAX_KEYWORD_SCORE) * 100);
}

// ---------------------------------------------------------------------------
// 3. Time Score
// score = max(0, 100 - (hoursDiff / 6) × 100)
// ---------------------------------------------------------------------------
function calcTimeScore(hoursDiff) {
  if (hoursDiff === null || hoursDiff === undefined || !Number.isFinite(Number(hoursDiff))) {
    return null; // Không có EXIF DateTime → bỏ qua tiêu chí này
  }
  const h = Math.max(0, Number(hoursDiff));
  return Math.max(0, 100 - (h / 6) * 100);
}

// ---------------------------------------------------------------------------
// 4. AI Vision Score (YOLO)
// damagePercentage = tổng diện tích bbox / diện tích ảnh × 100
// amplified = damagePercentage × 5
// floor = numDetections × 15
// score = min(100, max(amplified, floor))
// numDetections = 0 → 0 (đã bị từ chối trước ở AI check)
// ---------------------------------------------------------------------------
function calcAiVisionScore(numDetections, damagePercentage) {
  const count = Number(numDetections) || 0;
  const damage = Number(damagePercentage) || 0;

  if (count <= 0) return 0;

  const amplified = damage * 5;
  const floor = count * 15;
  return Math.min(100, Math.max(amplified, floor));
}

// ---------------------------------------------------------------------------
// Trọng số động — chia lại khi thiếu Location hoặc Time
// AI Vision là BẮT BUỘC → luôn có mặt trong bảng trọng số
// ---------------------------------------------------------------------------
function resolveWeights(hasLocation, hasTime) {
  if (hasLocation && hasTime) {
    return { location: 28, content: 28, time: 23, ai: 21 };
  }
  if (hasLocation && !hasTime) {
    return { location: 35, content: 35, time: 0, ai: 30 };
  }
  if (!hasLocation && hasTime) {
    return { location: 0, content: 40, time: 30, ai: 30 };
  }
  // Thiếu cả Location lẫn Time
  return { location: 0, content: 50, time: 0, ai: 50 };
}

// ---------------------------------------------------------------------------
// Hàm tính damage_percentage từ detections của Flask
// Flask trả bbox { x_min, y_min, x_max, y_max } nhưng không trả kích thước ảnh
// → Dùng heuristic: tổng bbox area / (imageWidth * imageHeight) nếu có
//   Nếu không biết kích thước ảnh → ước tính bằng confidence trung bình × 100
// ---------------------------------------------------------------------------
function calcDamagePercentageFromDetections(detections, imageWidth, imageHeight) {
  if (!Array.isArray(detections) || detections.length === 0) return 0;

  // Nếu có kích thước ảnh → tính thực
  if (imageWidth > 0 && imageHeight > 0) {
    const totalArea = imageWidth * imageHeight;
    let bboxArea = 0;

    for (const d of detections) {
      const w = Math.max(0, (d?.bbox?.x_max || 0) - (d?.bbox?.x_min || 0));
      const h = Math.max(0, (d?.bbox?.y_max || 0) - (d?.bbox?.y_min || 0));
      bboxArea += w * h;
    }

    return Math.min(100, (bboxArea / totalArea) * 100);
  }

  // Fallback: dùng confidence trung bình × 100 làm damage proxy
  const avgConf = detections.reduce((sum, d) => sum + Number(d?.confidence || 0), 0) / detections.length;
  // confidence là 0–1 → nhân 100 để ra %
  const confPercent = avgConf <= 1 ? avgConf * 100 : avgConf;
  return Math.min(100, confPercent);
}

// ---------------------------------------------------------------------------
// Đánh giá mức độ tin cậy
// ---------------------------------------------------------------------------
function getConfidenceLevel(score) {
  if (score >= 90) return { level: "Rất tin cậy", color: "green", action: "Tự động duyệt" };
  if (score >= 80) return { level: "Tin cậy cao", color: "green", action: "Kiểm tra nhanh" };
  if (score >= 70) return { level: "Tin cậy trung bình", color: "yellow", action: "Xác minh thủ công" };
  if (score >= 50) return { level: "Tin cậy thấp", color: "orange", action: "Yêu cầu bổ sung thông tin" };
  return { level: "Không đủ tin cậy", color: "red", action: "Từ chối" };
}

// ---------------------------------------------------------------------------
// Main: calculateConfidenceScore
// ---------------------------------------------------------------------------
/**
 * @param {object} params
 * @param {string}  params.description      - Mô tả báo cáo
 * @param {object}  params.exifMetadata     - Kết quả từ extractExifFromImages()
 * @param {number}  params.aiTotalObjects   - Số objects AI phát hiện
 * @param {Array}   params.aiDetections     - detections[] raw từ Flask (có bbox)
 * @param {number}  [params.imageWidth]     - Chiều rộng ảnh (px), tùy chọn
 * @param {number}  [params.imageHeight]    - Chiều cao ảnh (px), tùy chọn
 * @returns {{ confidenceScore: number, scoringDetails: object }}
 */
function calculateConfidenceScore({
  description,
  exifMetadata,
  aiTotalObjects,
  aiDetections = [],
  imageWidth = 0,
  imageHeight = 0,
}) {
  const summary = exifMetadata?.summary || {};

  // --- Tính từng tiêu chí ---
  const locationScore = calcLocationScore(summary.distanceKm);
  const contentScore = calcContentScore(description);
  const timeScore = calcTimeScore(summary.hoursDiff);
  const damagePercentage = calcDamagePercentageFromDetections(
    aiDetections,
    imageWidth,
    imageHeight,
  );
  const aiVisionScore = calcAiVisionScore(aiTotalObjects, damagePercentage);

  // --- Xác định trọng số ---
  const hasLocation = locationScore !== null;
  const hasTime = timeScore !== null;
  const weights = resolveWeights(hasLocation, hasTime);

  // --- Tính tổng weighted ---
  let confidenceScore = 0;
  if (hasLocation) confidenceScore += (locationScore * weights.location) / 100;
  confidenceScore += (contentScore * weights.content) / 100;
  if (hasTime) confidenceScore += (timeScore * weights.time) / 100;
  confidenceScore += (aiVisionScore * weights.ai) / 100;

  const roundedScore = Math.round(Math.min(100, Math.max(0, confidenceScore)));
  const levelInfo = getConfidenceLevel(roundedScore);

  const scoringDetails = {
    locationScore: locationScore !== null ? Math.round(locationScore) : null,
    contentScore: Math.round(contentScore),
    timeScore: timeScore !== null ? Math.round(timeScore) : null,
    aiVisionScore: Math.round(aiVisionScore),
    damagePercentage: Number(damagePercentage.toFixed(2)),
    weights,
    breakdown: {
      location: hasLocation ? Number(((locationScore * weights.location) / 100).toFixed(2)) : 0,
      content: Number(((contentScore * weights.content) / 100).toFixed(2)),
      time: hasTime ? Number(((timeScore * weights.time) / 100).toFixed(2)) : 0,
      ai: Number(((aiVisionScore * weights.ai) / 100).toFixed(2)),
    },
    meta: {
      hasLocationExif: hasLocation,
      hasTimeExif: hasTime,
      distanceKm: summary.distanceKm ?? null,
      hoursDiff: summary.hoursDiff ?? null,
    },
    ...levelInfo,
  };

  return { confidenceScore: roundedScore, scoringDetails };
}

module.exports = {
  calculateConfidenceScore,
  calcLocationScore,
  calcContentScore,
  calcTimeScore,
  calcAiVisionScore,
  calcDamagePercentageFromDetections,
  getConfidenceLevel,
};
