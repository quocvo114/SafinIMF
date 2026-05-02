const logger = {
  info: (...args) => console.log("[AI]", ...args),
  warn: (...args) => console.warn("[AI]", ...args),
  error: (...args) => console.error("[AI]", ...args),
};

// ---------------------------------------------------------------------------
// URL candidates for the AI Flask service
// ---------------------------------------------------------------------------
function buildModelApiCandidates() {
  const configured = (process.env.MODEL_API_URL || "").trim();
  const defaults = [
    "http://127.0.0.1:5001/predict",
    "http://localhost:5001/predict",
    "http://127.0.0.1:5000/predict",
    "http://localhost:5000/predict",
  ];

  return [configured, ...defaults].filter(
    (url, index, arr) => Boolean(url) && arr.indexOf(url) === index,
  );
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function looksLikeBase64(value) {
  return /^[A-Za-z0-9+/=\r\n\s]+$/.test(value) && value.length % 4 === 0;
}

async function parseImageInput(imageInput) {
  if (typeof imageInput !== "string" || !imageInput.trim()) {
    throw new Error("Ảnh đầu vào không hợp lệ");
  }

  const value = imageInput.trim();

  if (isHttpUrl(value)) {
    const response = await fetch(value);
    if (!response.ok) {
      throw new Error(`Không tải được ảnh từ URL: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      throw new Error("Ảnh URL rỗng hoặc không đọc được");
    }

    const mimeType = String(response.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!mimeType.startsWith("image/")) {
      throw new Error("URL không trả về dữ liệu ảnh");
    }

    const extension = (mimeType.split("/")[1] || "jpg").split("+")[0];
    const fileName = `report-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

    return { buffer, mimeType, fileName };
  }

  const dataUrlMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(
    value,
  );

  const mimeType = dataUrlMatch ? dataUrlMatch[1].toLowerCase() : "image/jpeg";
  const rawBase64 = dataUrlMatch ? dataUrlMatch[2] : value;

  if (!dataUrlMatch && !looksLikeBase64(rawBase64)) {
    throw new Error("Ảnh đầu vào không phải base64 hoặc URL hợp lệ");
  }

  const sanitized = rawBase64.replace(/\s/g, "");
  const buffer = Buffer.from(sanitized, "base64");

  if (!buffer.length) {
    throw new Error("Không đọc được dữ liệu ảnh base64");
  }

  const extension = (mimeType.split("/")[1] || "jpg").split("+")[0];
  const fileName = `report-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;

  return { buffer, mimeType, fileName };
}

// ---------------------------------------------------------------------------
// Call the Flask /predict endpoint with one image
// ---------------------------------------------------------------------------
async function requestModelPrediction(url, image) {
  const form = new FormData();
  const blob = new Blob([image.buffer], { type: image.mimeType });
  form.append("image", blob, image.fileName);

  const timeoutMs = Number(process.env.MODEL_API_TIMEOUT_MS || 10000);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(`Model API timeout sau ${timeoutMs}ms tại ${url}`);
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Model API lỗi ${response.status} tại ${url}: ${text.slice(0, 200)}`);
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Model API không trả JSON hợp lệ tại ${url}`);
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Extract structured AI result from Flask response payload
// ---------------------------------------------------------------------------
function extractAiResult(payload, sourceUrl) {
  const detections = Array.isArray(payload?.detections) ? payload.detections : [];

  if (detections.length === 0) {
    return {
      aiVerified: true,
      aiPercent: 0,
      aiLabel: "No detection",
      aiTotalObjects: 0,
      aiSource: sourceUrl,
    };
  }

  const bestDetection = detections.reduce((best, current) => {
    return Number(current?.confidence || 0) > Number(best?.confidence || 0)
      ? current
      : best;
  }, detections[0]);

  const rawConfidence = Number(bestDetection?.confidence || 0);
  const normalizedPercent =
    rawConfidence > 0 && rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;

  return {
    aiVerified: true,
    aiPercent: Number(normalizedPercent.toFixed(2)),
    aiLabel: String(bestDetection?.class_name || "Unknown"),
    aiTotalObjects: Number(payload?.total_objects || detections.length || 0),
    aiSource: sourceUrl,
  };
}

// ---------------------------------------------------------------------------
// Verify a single image against the AI model
// Returns: { aiVerified, aiPercent, aiLabel, aiTotalObjects, aiSource, aiError?, isTimeout? }
// ---------------------------------------------------------------------------
async function verifyImageWithModel(base64Image) {
  if (!base64Image) {
    return {
      aiVerified: false,
      aiPercent: null,
      aiLabel: "",
      aiTotalObjects: 0,
      aiSource: null,
      aiError: "Không có ảnh để xác thực",
    };
  }

  let parsedImage;
  try {
    parsedImage = await parseImageInput(base64Image);
  } catch (error) {
    return {
      aiVerified: false,
      aiPercent: null,
      aiLabel: "",
      aiTotalObjects: 0,
      aiSource: null,
      aiError: error.message,
    };
  }

  const candidates = buildModelApiCandidates();
  const failures = [];
  let hasTimeout = false;

  for (const url of candidates) {
    try {
      logger.info(`Gọi AI service → ${url} | file: ${parsedImage.fileName}`);
      const payload = await requestModelPrediction(url, parsedImage);
      const result = extractAiResult(payload, url);
      logger.info(
        `AI response ← ${url} | objects: ${result.aiTotalObjects} | label: ${result.aiLabel} | confidence: ${result.aiPercent}%`,
      );
      return result;
    } catch (error) {
      if (error.isTimeout) hasTimeout = true;
      failures.push(error.message);
      logger.warn(`AI service thất bại tại ${url}: ${error.message}`);
    }
  }

  logger.error(`Tất cả AI endpoint đều thất bại. Lỗi đầu tiên: ${failures[0]}`);

  return {
    aiVerified: false,
    aiPercent: null,
    aiLabel: "",
    aiTotalObjects: 0,
    aiSource: null,
    isTimeout: hasTimeout,
    aiError: hasTimeout
      ? "Hệ thống AI tạm thời không khả dụng, vui lòng thử lại sau"
      : failures[0] || "Không gọi được AI model",
  };
}

// ---------------------------------------------------------------------------
// Verify ALL images in a report (spec: tất cả ảnh phải qua AI)
// Returns:
//   { allPassed: true, results: [], summary: { aiPercent, aiLabel, aiSource, aiTotalObjects } }
//   { allPassed: false, failedIndex: number, isTimeout: bool, aiError: string, results: [] }
// ---------------------------------------------------------------------------
async function verifyAllImages(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return {
      allPassed: false,
      failedIndex: 0,
      isTimeout: false,
      aiError: "Không có ảnh để xác thực",
      results: [],
    };
  }

  logger.info(`Bắt đầu xác thực AI cho ${images.length} ảnh...`);

  const results = [];

  for (let i = 0; i < images.length; i++) {
    logger.info(`Xác thực ảnh ${i + 1}/${images.length}...`);
    const result = await verifyImageWithModel(images[i]);
    results.push(result);

    const accepted = isAiAccepted(result);

    if (!accepted) {
      logger.warn(
        `Ảnh ${i + 1} KHÔNG qua xác thực AI | isTimeout: ${result.isTimeout} | error: ${result.aiError}`,
      );
      return {
        allPassed: false,
        failedIndex: i, // 0-based
        isTimeout: Boolean(result.isTimeout),
        aiError: result.aiError || `Ảnh thứ ${i + 1} không liên quan đến sự cố hạ tầng`,
        results,
      };
    }

    logger.info(`Ảnh ${i + 1} ✅ PASSED | label: ${result.aiLabel} | ${result.aiPercent}%`);
  }

  // Tất cả ảnh đã pass → lấy summary từ ảnh đầu tiên để lưu vào DB
  const first = results[0];
  logger.info(
    `✅ Tất cả ${images.length} ảnh đã qua xác thực AI. Summary từ ảnh 1: label=${first.aiLabel}, confidence=${first.aiPercent}%`,
  );

  return {
    allPassed: true,
    results,
    summary: {
      aiPercent: first.aiPercent,
      aiLabel: first.aiLabel,
      aiSource: first.aiSource,
      aiTotalObjects: first.aiTotalObjects,
      aiVerified: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Evaluate a single AI result: is it acceptable?
// Spec: aiVerified=true, có ít nhất 1 object, label hợp lệ
// ---------------------------------------------------------------------------
function isAiAccepted(aiResult) {
  if (!aiResult || aiResult.aiVerified !== true) return false;
  if (!Number(aiResult.aiTotalObjects) || Number(aiResult.aiTotalObjects) <= 0) return false;

  const label = String(aiResult.aiLabel || "").trim().toLowerCase();
  if (!label || label === "no detection" || label === "unknown") return false;

  return true;
}

module.exports = {
  verifyImageWithModel,
  verifyAllImages,
  isAiAccepted,
};
