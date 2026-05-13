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
  if (
    distanceKm === null ||
    distanceKm === undefined ||
    !Number.isFinite(Number(distanceKm))
  ) {
    return null; // Không có GPS EXIF → bỏ qua tiêu chí này
  }
  const d = Math.max(0, Number(distanceKm));
  return Math.max(0, 100 - (d / 5) * 100);
}

// ---------------------------------------------------------------------------
// 2. Content Score
// Từ mạnh (+2), từ thường (+1), max theo tổng trọng số → normalized to 100
// ---------------------------------------------------------------------------
const KEYWORD_GROUPS = [
  // --- Nhóm sự cố (mạnh: 2 pts/nhóm) ---
  {
    weight: 2,
    label: "pothole",
    keywords: ["ổ gà", "o ga", "pothole", "hố", "hole"],
  },
  {
    weight: 2,
    label: "crack",
    keywords: ["đường nứt", "duong nut", "nứt", "crack", "gãy", "broken"],
  },
  {
    weight: 2,
    label: "waste",
    keywords: ["rác thải", "rac thai", "trash", "waste", "debris", "rác"],
  },
  {
    weight: 2,
    label: "hazard",
    keywords: ["nguy hiểm", "hazard", "accident", "tai nạn"],
  },
  {
    weight: 2,
    label: "damage",
    keywords: ["damaged", "hư hỏng"],
  },
  // --- Nhóm thường (1 pt/nhóm) ---
  {
    weight: 1,
    label: "infrastructure",
    keywords: ["road", "đường", "asphalt", "nhựa", "pavement", "vỉa hè"],
  },
  {
    weight: 1,
    label: "traffic",
    keywords: ["traffic", "giao thông"],
  },
  {
    weight: 1,
    label: "repair",
    keywords: ["repair", "sửa chữa"],
  },
  {
    weight: 1,
    label: "safety",
    keywords: ["unsafe", "không an toàn", "risk", "rủi ro"],
  },
  {
    weight: 1,
    label: "deteriorated",
    keywords: ["deteriorated", "suy thoái"],
  },
];

const MAX_KEYWORD_SCORE = KEYWORD_GROUPS.reduce(
  (sum, group) => sum + group.weight,
  0,
);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordRegex(keyword) {
  const escaped = escapeRegExp(keyword);
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=[^\\p{L}\\p{N}]|$)`, "gu");
}

function groupMatchesText(text, keywords) {
  // Sắp xếp dài trước để ưu tiên khớp cụm từ dài hơn
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  for (const kw of sorted) {
    const regex = buildKeywordRegex(kw);
    if (regex.test(text)) return true;
  }
  return false;
}

function calcContentScore(description) {
  if (!description || typeof description !== "string") return 0;

  const text = description.toLowerCase();
  let total = 0;

  for (const group of KEYWORD_GROUPS) {
    if (groupMatchesText(text, group.keywords)) {
      total += group.weight;
    }
  }

  return Math.min(100, (total / MAX_KEYWORD_SCORE) * 100);
}


// ---------------------------------------------------------------------------
// 3. Time Score
// score = max(0, 100 - (hoursDiff / 6) × 100)
// ---------------------------------------------------------------------------
function calcTimeScore(hoursDiff) {
  if (
    hoursDiff === null ||
    hoursDiff === undefined ||
    !Number.isFinite(Number(hoursDiff))
  ) {
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
// score = min(score, aiPercent) nếu có aiPercent hợp lệ
// numDetections = 0 → 0 (đã bị từ chối trước ở AI check)
// ---------------------------------------------------------------------------
function normalizeAiPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed;
  return Math.max(0, Math.min(100, normalized));
}

function calcAiVisionScore(numDetections, damagePercentage, aiPercent) {
  const count = Number(numDetections) || 0;
  const damage = Number(damagePercentage) || 0;

  if (count <= 0) return 0;

  // Rollback theo scroring.md: max(damage*5, count*15)
  const amplified = damage * 5;
  const floor = count * 15;
  const baseScore = Math.min(100, Math.max(amplified, floor));
  const cap = normalizeAiPercent(aiPercent);
  if (cap === null) return baseScore;
  return Math.min(baseScore, cap);
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
  // Chỉ có Content và AI (Theo scroring.md mới: 30% / 50%)
  // Tổng trọng số là 80%, giúp hạn chế điểm tối đa nếu thiếu EXIF
  return { location: 0, content: 30, time: 0, ai: 50 };
}

// ---------------------------------------------------------------------------
// Hàm tính damage_percentage từ detections của Flask
// Flask trả bbox { x_min, y_min, x_max, y_max } nhưng không trả kích thước ảnh
// → Dùng heuristic: tổng bbox area / (imageWidth * imageHeight) nếu có
//   Nếu không biết kích thước ảnh → ước tính bằng confidence trung bình × 100
// ---------------------------------------------------------------------------
function calcDamagePercentageFromDetections(
  detections,
  imageWidth,
  imageHeight,
  aiPercent,
) {
  // Thử tính từ bbox nếu có kích thước ảnh và có detections
  if (Array.isArray(detections) && detections.length > 0 && imageWidth > 0 && imageHeight > 0) {
    const totalArea = imageWidth * imageHeight;
    let bboxArea = 0;

    for (const d of detections) {
      const w = Math.max(0, (d?.bbox?.x_max || 0) - (d?.bbox?.x_min || 0));
      const h = Math.max(0, (d?.bbox?.y_max || 0) - (d?.bbox?.y_min || 0));
      bboxArea += w * h;
    }

    const bboxDamage = Math.min(100, (bboxArea / totalArea) * 100);
    if (bboxDamage > 0) return bboxDamage;
  }

  // Fallback: dùng aiPercent (0-100) làm proxy damage severity
  // Chỉnh từ 0.3 xuống 0.05 để sát với thực tế damage percentage (thường < 5%)
  // Giúp điểm tin cậy không bị đẩy lên quá cao chỉ bằng confidence AI
  const rawAiPercent = Number(aiPercent);
  if (Number.isFinite(rawAiPercent) && rawAiPercent > 0) {
    const normalizedAi = rawAiPercent <= 1 ? rawAiPercent * 100 : rawAiPercent;
    return Math.min(100, normalizedAi * 0.05);
  }

  return 0;
}


// ---------------------------------------------------------------------------
// Đánh giá mức độ tin cậy
// ---------------------------------------------------------------------------
function getConfidenceLevel(score) {
  if (score >= 90)
    return { level: "Rất tin cậy", color: "green", action: "Tự động duyệt" };
  if (score >= 80)
    return { level: "Tin cậy cao", color: "green", action: "Kiểm tra nhanh" };
  if (score >= 70)
    return {
      level: "Tin cậy trung bình",
      color: "yellow",
      action: "Xác minh thủ công",
    };
  if (score >= 50)
    return {
      level: "Tin cậy thấp",
      color: "orange",
      action: "Yêu cầu bổ sung thông tin",
    };
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
 * @param {number}  [params.aiPercent]      - Confidence của best detection (0-100), dùng làm proxy damage
 * @param {number}  [params.imageWidth]     - Chiều rộng ảnh (px), tùy chọn
 * @param {number}  [params.imageHeight]    - Chiều cao ảnh (px), tùy chọn
 * @returns {{ confidenceScore: number, scoringDetails: object }}
 */
function calculateConfidenceScore({
  description,
  exifMetadata,
  aiTotalObjects,
  aiDetections = [],
  aiPercent = 0,
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
    aiPercent,
  );
  const aiVisionScore = calcAiVisionScore(
    aiTotalObjects,
    damagePercentage,
    aiPercent,
  );

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
      location: hasLocation
        ? Number(((locationScore * weights.location) / 100).toFixed(2))
        : 0,
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
