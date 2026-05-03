const ReportRepository = require("../repositories/ReportRepository");
const cloudinary = require("../config/cloudinary");
const AiValidationLog = require("../models/AiValidationLog");

const CLOUDINARY_REQUIRED_ENV = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const isHttpUrl = (value) => /^https?:\/\//i.test(value);
const isImageDataUrl = (value) => /^data:image\//i.test(value);

const hasCloudinaryConfig = () =>
  CLOUDINARY_REQUIRED_ENV.every((key) => Boolean(process.env[key]));

const DISTRICT_ALIAS_MAP = {
  "Hải Châu": ["hai chau", "phuong hai chau"],
  "Sơn Trà": ["son tra"],
  "Liên Chiểu": ["lien chieu"],
  "Hoàng Sa": ["hoang sa"],
  "Thanh Khê": ["thanh khe"],
  "Ngũ Hành Sơn": ["ngu hanh son"],
  "Cẩm Lệ": ["cam le", "hoa xuan", "khue trung"],
  "Hòa Vang": ["hoa vang"],
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const RECEPTION_STATUS_OPTIONS = ["Đang Chờ", "Đang Xử Lý", "Đã Giải Quyết"];

function inferDistrict(location = "") {
  const normalizedLocation = normalizeText(location);

  for (const [district, aliases] of Object.entries(DISTRICT_ALIAS_MAP)) {
    if (
      aliases.some((alias) => normalizedLocation.includes(normalizeText(alias)))
    ) {
      return district;
    }
  }

  return "Khác";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function parseCoordinate(value, min, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (numericValue < min || numericValue > max) {
    return null;
  }

  return numericValue;
}

function parseCoordinatesFromLocation(location = "") {
  const match = String(location).match(
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  );
  if (!match) {
    return { lat: null, lng: null };
  }

  const lat = parseCoordinate(match[1], -90, 90);
  const lng = parseCoordinate(match[2], -180, 180);

  if (lat === null || lng === null) {
    return { lat: null, lng: null };
  }

  return { lat, lng };
}

async function geocodeLocationToCoordinates(location = "") {
  const query = String(location || "").trim();

  if (!query) {
    return { lat: null, lng: null };
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&accept-language=vi`,
      {
        headers: {
          "User-Agent": "ReportApp/1.0 (Contact: admin@example.com)",
        },
      },
    );

    if (!response.ok) {
      return { lat: null, lng: null };
    }

    const result = await response.json();
    if (!Array.isArray(result) || result.length === 0) {
      return { lat: null, lng: null };
    }

    const lat = parseCoordinate(result[0]?.lat, -90, 90);
    const lng = parseCoordinate(result[0]?.lon, -180, 180);

    if (lat === null || lng === null) {
      return { lat: null, lng: null };
    }

    return { lat, lng };
  } catch (error) {
    console.warn("⚠️ Forward geocoding failed:", error.message);
    return { lat: null, lng: null };
  }
}

function formatExifLocation(exifMetadata) {
  const summary = exifMetadata?.summary || {};
  const exifLatitude = summary.exifLatitude;
  const exifLongitude = summary.exifLongitude;

  if (!summary.gpsAvailable) {
    return "";
  }

  if (
    Number.isFinite(Number(exifLatitude)) &&
    Number.isFinite(Number(exifLongitude))
  ) {
    return `${Number(exifLatitude).toFixed(6)}, ${Number(exifLongitude).toFixed(6)}`;
  }

  return "";
}

function toReceptionItem(report) {
  return {
    _id: report._id,
    id: report.id || report.report_id,
    report_id: report.report_id || report.id,
    title: report.title,
    category: report.type,
    type: report.type,
    image: report.image || report.images?.[0] || "",
    images: Array.isArray(report.images)
      ? report.images
      : report.image
        ? [report.image]
        : [],
    location: report.location,
    description: report.description || "",
    confidenceScore: report.confidenceScore ?? null,
    scoringDetails: report.scoringDetails ?? null,
    lat: report.lat ?? null,
    lng: report.lng ?? null,
    time: report.time || "",
    date:
      report.time && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(report.time)
        ? report.time.split(",")[0]
        : formatDate(report.createdAt || report.updatedAt),
    status: report.status,
    district: inferDistrict(report.location),
    // AI fields for display
    aiPercent: report.aiPercent ?? null,
    aiVerified: report.aiVerified ?? false,
    aiLabel: report.aiLabel || "",
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

async function uploadImagesToCloudinary(images, userId) {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  const folderRoot =
    process.env.CLOUDINARY_FOLDER || "urbaninfra_reports/reports";

  const uploaded = await Promise.all(
    images.map(async (image, index) => {
      try {
        if (typeof image !== "string" || !image.trim()) {
          return null;
        }

        if (isHttpUrl(image)) {
          return image;
        }

        if (!isImageDataUrl(image)) {
          throw new Error(`Định dạng ảnh không hợp lệ ở vị trí ${index + 1}`);
        }

        const response = await cloudinary.uploader.upload(image, {
          folder: `${folderRoot}/${userId}`,
          resource_type: "image",
        });

        return response.secure_url;
      } catch (error) {
        console.error(`❌ Error uploading image ${index + 1}:`, error.message);
        throw error;
      }
    }),
  );

  return uploaded.filter(Boolean);
}
const Report = require("../models/Report");
const User = require("../services/user/user.model");
const IncidentTypeRepository = require("../repositories/IncidentTypeRepository");
const { verifyAllImages } = require("../services/ai/aiVerification.service");
const { extractExifFromImages } = require("../services/exif/exif.service");
const { validateCreateReportPayload } = require("../utils/reportValidation");
const {
  calculateConfidenceScore,
} = require("../services/scoring/scoring.service");

function parseNumericUserId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue)) {
    return null;
  }

  return numericValue;
}

function getReporterFallbackName(report) {
  if (report?.userId) {
    return `Người dùng #${report.userId}`;
  }

  if (report?.user_id !== undefined && report?.user_id !== null) {
    return `Người dùng #${report.user_id}`;
  }

  return "Người dân phản ánh";
}

async function attachReporterNames(reports = []) {
  if (!Array.isArray(reports) || reports.length === 0) {
    return [];
  }

  const objectIdCandidates = new Set();
  const numericIdCandidates = new Set();

  for (const report of reports) {
    const userIdValue =
      typeof report?.userId === "string" ? report.userId.trim() : "";
    if (/^[a-fA-F0-9]{24}$/.test(userIdValue)) {
      objectIdCandidates.add(userIdValue);
    }

    const numericFromUserId = parseNumericUserId(userIdValue);
    if (numericFromUserId !== null) {
      numericIdCandidates.add(numericFromUserId);
    }

    const numericFromLegacy = parseNumericUserId(report?.user_id);
    if (numericFromLegacy !== null) {
      numericIdCandidates.add(numericFromLegacy);
    }
  }

  const userLookupConditions = [];
  if (objectIdCandidates.size > 0) {
    userLookupConditions.push({ _id: { $in: [...objectIdCandidates] } });
  }
  if (numericIdCandidates.size > 0) {
    userLookupConditions.push({ user_id: { $in: [...numericIdCandidates] } });
  }

  if (userLookupConditions.length === 0) {
    return reports.map((report) => ({
      ...report,
      reporterName: getReporterFallbackName(report),
    }));
  }

  const users = await User.find(
    { $or: userLookupConditions },
    { _id: 1, user_id: 1, full_name: 1 },
  ).lean();

  const usersByObjectId = new Map();
  const usersByNumericId = new Map();

  for (const user of users) {
    const normalizedName = String(user?.full_name || "").trim();
    if (!normalizedName) {
      continue;
    }

    usersByObjectId.set(String(user._id), normalizedName);

    const numericUserId = parseNumericUserId(user?.user_id);
    if (numericUserId !== null) {
      usersByNumericId.set(numericUserId, normalizedName);
    }
  }

  return reports.map((report) => {
    const userIdValue =
      typeof report?.userId === "string" ? report.userId.trim() : "";
    const numericFromUserId = parseNumericUserId(userIdValue);
    const numericFromLegacy = parseNumericUserId(report?.user_id);

    const reporterName =
      usersByObjectId.get(userIdValue) ||
      (numericFromUserId !== null
        ? usersByNumericId.get(numericFromUserId)
        : "") ||
      (numericFromLegacy !== null
        ? usersByNumericId.get(numericFromLegacy)
        : "") ||
      getReporterFallbackName(report);

    return {
      ...report,
      reporterName,
    };
  });
}

class ReportController {
  async getManagementReports(req, res) {
    try {
      const {
        search = "",
        type = "all",
        status = "all",
        page = 1,
        limit = 10,
      } = req.query;

      const result = await ReportRepository.getManagementList({
        search,
        type,
        status,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllReports(req, res) {
    try {
      if (req.query?.view === "map") {
        const reports = await Report.find(
          {},
          {
            _id: 1,
            id: 1,
            report_id: 1,
            title: 1,
            type: 1,
            location: 1,
            lat: 1,
            lng: 1,
            status: 1,
            description: 1,
            image: 1,
            images: 1,
            time: 1,
            userId: 1,
            user_id: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        )
          .sort({ createdAt: -1 })
          .lean();

        const reportsWithReporter = await attachReporterNames(reports);

        return res.status(200).json({
          success: true,
          data: reportsWithReporter,
        });
      }

      const reports = await ReportRepository.getAll();

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMapReports(req, res) {
    try {
      const reports = await Report.find(
        {},
        {
          _id: 1,
          id: 1,
          report_id: 1,
          title: 1,
          type: 1,
          location: 1,
          lat: 1,
          lng: 1,
          status: 1,
          description: 1,
          image: 1,
          images: 1,
          time: 1,
          userId: 1,
          user_id: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      )
        .sort({ createdAt: -1 })
        .lean();

      const reportsWithReporter = await attachReporterNames(reports);

      res.status(200).json({
        success: true,
        data: reportsWithReporter,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getReceptionReports(req, res) {
    try {
      const {
        search = "",
        type = "all",
        status = "all",
        district = "all",
        date = "recent",
        page = 1,
        limit = 10,
      } = req.query;

      const result = await ReportRepository.getReceptionList({
        search,
        type,
        status,
        district,
        sortByDate: date,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.items.map(toReceptionItem),
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await ReportRepository.getById(id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getReportsByUserId(req, res) {
    try {
      const { userId } = req.params;
      console.log("🔍 Getting reports for userId:", userId);

      const reports = await ReportRepository.getByUserId(userId);
      console.log("✅ Found reports:", reports.length);

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error("❌ Error in getReportsByUserId:", error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createReport(req, res) {
    try {
      const validation = validateCreateReportPayload({
        ...req.body,
        latitude: req.body?.latitude ?? req.body?.lat,
        longitude: req.body?.longitude ?? req.body?.lng,
      });

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: validation.message,
        });
      }

      const {
        title,
        type: incomingType,
        location,
        description,
        images,
        userId,
        latitude,
        longitude,
      } = validation.data;

      const authUserId = req.user?.id;
      if (!authUserId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (String(userId) !== String(authUserId)) {
        return res.status(403).json({
          success: false,
          message: "Bạn không thể tạo báo cáo cho người dùng khác",
        });
      }

      await IncidentTypeRepository.ensureDefaults();
      const incidentType =
        await IncidentTypeRepository.findActiveByName(incomingType);

      if (!incidentType) {
        return res.status(400).json({
          success: false,
          code: "INVALID_INCIDENT_TYPE",
          message: "Loại sự cố không hợp lệ hoặc đã bị xóa",
        });
      }

      // Generate IDs
      const reportStringId = `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const lastReport = await Report.findOne({
        report_id: { $ne: null },
      }).sort({ report_id: -1 });
      const nextReportId = lastReport?.report_id
        ? Number(lastReport.report_id) + 1
        : 1;

      // Get current time
      const reportCreatedAt = new Date();
      const currentTime = reportCreatedAt.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });

      // Resolve current coordinates from GPS first, then fallback to the text address
      const parsedLat = parseCoordinate(
        req.body?.lat ?? req.body?.latitude,
        -90,
        90,
      );
      const parsedLng = parseCoordinate(
        req.body?.lng ?? req.body?.longitude,
        -180,
        180,
      );
      const fallbackCoordinates = parseCoordinatesFromLocation(location);
      let resolvedLat = parsedLat ?? fallbackCoordinates.lat;
      let resolvedLng = parsedLng ?? fallbackCoordinates.lng;

      if (resolvedLat === null || resolvedLng === null) {
        const geocodedCoordinates =
          await geocodeLocationToCoordinates(location);
        resolvedLat = resolvedLat ?? geocodedCoordinates.lat;
        resolvedLng = resolvedLng ?? geocodedCoordinates.lng;
      }

      // Bước 1: Trích xuất EXIF metadata (GPS, DateTime)
      let exifMetadata = null;
      try {
        exifMetadata = await extractExifFromImages(images, {
          reportLatitude: resolvedLat,
          reportLongitude: resolvedLng,
          reportTime: reportCreatedAt,
        });
      } catch (exifError) {
        console.warn("EXIF parsing failed:", exifError.message);
      }

      const inputImages = Array.isArray(images) ? images : [];

      // Bước 2: AI xác thực TẤT CẢ ảnh TRƯỚC khi upload (tiết kiệm Cloudinary quota)
      const aiVerification = await verifyAllImages(inputImages);

      if (!aiVerification.allPassed) {
        const failedImageNumber = (aiVerification.failedIndex ?? 0) + 1;

        if (aiVerification.isTimeout) {
          return res.status(422).json({
            success: false,
            code: "AI_SERVICE_UNAVAILABLE",
            message:
              "Hệ thống AI tạm thời không khả dụng, vui lòng thử lại sau",
          });
        }

        return res.status(422).json({
          success: false,
          code: "AI_VALIDATION_FAILED",
          message:
            aiVerification.aiError ||
            `Ảnh thứ ${failedImageNumber} không liên quan đến sự cố hạ tầng đô thị, vui lòng chụp lại`,
        });
      }

      const aiSummary = aiVerification.summary;

      // Bước 3: Tính Confidence Score (4 tiêu chí)
      const { confidenceScore, scoringDetails } = calculateConfidenceScore({
        description,
        exifMetadata,
        aiTotalObjects: aiSummary.aiTotalObjects,
        aiDetections: aiSummary.allDetections || [],
      });

      console.log(
        `📊 Confidence Score: ${confidenceScore}% | Level: ${scoringDetails?.level} | ` +
          `Location: ${scoringDetails?.locationScore ?? "N/A"} | Content: ${scoringDetails?.contentScore} | ` +
          `Time: ${scoringDetails?.timeScore ?? "N/A"} | AI Vision: ${scoringDetails?.aiVisionScore}`,
      );

      // Bước 4: Upload ảnh lên Cloudinary (sau khi AI pass)
      let persistedImages = inputImages;

      if (inputImages.length > 0 && hasCloudinaryConfig()) {
        const uploadedImages = await uploadImagesToCloudinary(
          inputImages,
          userId,
        );
        const cloudinaryUrls = uploadedImages.filter(
          (image) => typeof image === "string" && isHttpUrl(image),
        );

        if (cloudinaryUrls.length === 0) {
          return res.status(500).json({
            success: false,
            message: "Upload ảnh lên Cloudinary thất bại",
          });
        }

        persistedImages = cloudinaryUrls;
      } else if (inputImages.length > 0 && !hasCloudinaryConfig()) {
        console.warn(
          "⚠️ Missing Cloudinary config, fallback to raw image payload",
        );
      }

      // Bước 5: Lưu báo cáo vào DB
      const reportData = {
        id: reportStringId,
        report_id: nextReportId,
        userId: String(authUserId),
        user_id: parseNumericUserId(userId),
        title,
        type: incidentType.name,
        location,
        reportLatitude: resolvedLat,
        reportLongitude: resolvedLng,
        lat: resolvedLat,
        lng: resolvedLng,
        description: description || "",
        images: persistedImages,
        image: persistedImages.length > 0 ? persistedImages[0] : "",
        status: "Đang Chờ",
        time: currentTime,
        // AI fields
        aiPercent: Number(aiSummary.aiPercent) || 0,
        aiVerified: Boolean(aiSummary.aiVerified),
        aiLabel: aiSummary.aiLabel || "",
        aiTotalObjects: Number(aiSummary.aiTotalObjects) || 0,
        aiSource: aiSummary.aiSource || "",
        // Scoring fields
        confidenceScore,
        scoringDetails,
        // EXIF metadata
        exifMetadata,
      };

      const newReport = await ReportRepository.create(reportData);

      try {
        const scoringMeta = scoringDetails?.meta || {};
        const logPayload = {
          reportId: String(
            newReport.id || newReport.report_id || reportStringId,
          ),
          userId: String(authUserId),
          locationMatch: {
            currentLocation: location || "",
            currentLat: resolvedLat ?? null,
            currentLng: resolvedLng ?? null,
            exifLocation: formatExifLocation(exifMetadata),
            exifLat: exifMetadata?.summary?.exifLatitude ?? null,
            exifLng: exifMetadata?.summary?.exifLongitude ?? null,
            distanceKm:
              scoringMeta.distanceKm ??
              exifMetadata?.summary?.distanceKm ??
              null,
            score: scoringDetails?.locationScore ?? null,
          },
          timeMatch: {
            currentTime,
            exifTime: exifMetadata?.summary?.exifDateTime || "",
            hoursDiff:
              scoringMeta.hoursDiff ?? exifMetadata?.summary?.hoursDiff ?? null,
            score: scoringDetails?.timeScore ?? null,
          },
          contentMatch: {
            description: description || "",
            score: scoringDetails?.contentScore ?? null,
          },
          aiVision: {
            detections: aiSummary?.allDetections || [],
            totalObjects: Number(aiSummary?.aiTotalObjects) || 0,
            damagePercentage: scoringDetails?.damagePercentage ?? 0,
            score: scoringDetails?.aiVisionScore ?? null,
            aiLabel: aiSummary?.aiLabel || "",
            aiSource: aiSummary?.aiSource || "",
          },
          finalConfidenceScore: confidenceScore,
          finalConfidenceLevel: scoringDetails?.level || "",
        };

        await AiValidationLog.create(logPayload);
      } catch (logError) {
        console.error("⚠️ Failed to save AI validation log:", logError);
      }

      res.status(201).json({
        success: true,
        message: "Tạo báo cáo thành công",
        data: newReport,
      });
    } catch (error) {
      console.error("❌ Error in createReport:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!RECEPTION_STATUS_OPTIONS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }

      const updated = await ReportRepository.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái thành công",
        data: toReceptionItem(updated),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PB14: Cập nhật tiến độ xử lý (Đội xử lý upload ảnh sau khắc phục)
  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const { afterImg, progressNote } = req.body;

      if (!afterImg) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng upload ảnh sau khi khắc phục",
        });
      }

      // Tìm báo cáo
      const report = await Report.findOne({
        $or: [{ id }, { report_id: id }],
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Upload ảnh sau khắc phục lên Cloudinary
      let afterImgUrl = afterImg;
      if (hasCloudinaryConfig() && isImageDataUrl(afterImg)) {
        try {
          const folderRoot =
            process.env.CLOUDINARY_FOLDER || "urbaninfra_reports/reports";
          const result = await cloudinary.uploader.upload(afterImg, {
            folder: `${folderRoot}/${report.userId}`,
            resource_type: "image",
          });
          afterImgUrl = result.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary upload failed:", uploadError.message);
        }
      }

      // Cập nhật báo cáo
      const updated = await Report.findOneAndUpdate(
        { $or: [{ id }, { report_id: id }] },
        {
          afterImg: afterImgUrl,
          status: "Đã Giải Quyết",
          ...(progressNote ? { progressNote } : {}),
        },
        { new: true },
      );

      console.log(
        `✅ Progress updated: Report ${id} → Đã Giải Quyết (afterImg uploaded)`,
      );

      res.status(200).json({
        success: true,
        message: "Cập nhật tiến độ thành công",
        data: updated,
      });
    } catch (error) {
      console.error("❌ Update progress error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new ReportController();
