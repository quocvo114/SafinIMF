const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/role");

// GET /api/reports - Lấy tất cả báo cáo
router.get("/", ReportController.getAllReports);

// GET /api/reports/user/:userId - Lấy báo cáo của 1 user (phải đặt trước /:id)
router.get("/user/:userId", ReportController.getReportsByUserId);

// GET /api/reports/map-markers - Dữ liệu nhẹ cho marker bản đồ
router.get("/map-markers", ReportController.getMapReports);

// GET /api/reports/management - Dữ liệu cho trang quản lý báo cáo
router.get(
	"/management",
	authMiddleware,
	requireRole("admin", "manager", "maintenance"),
	ReportController.getManagementReports
);

// GET /api/reports/reception - Dữ liệu cho trang đơn tiếp nhận
router.get(
	"/reception",
	authMiddleware,
	requireRole("admin", "manager", "maintenance"),
	ReportController.getReceptionReports
);
router.get("/management", ReportController.getManagementReports);

// POST /api/reports - Tạo báo cáo mới
router.post("/", ReportController.createReport);

// PATCH /api/reports/:id/status - Cập nhật trạng thái báo cáo
router.patch(
	"/:id/status",
	authMiddleware,
	requireRole("admin", "manager", "maintenance"),
	ReportController.updateReportStatus
);

// GET /api/reports/:id - Lấy 1 báo cáo (phải đặt sau /user/:userId)
router.get("/:id", ReportController.getReportById);

module.exports = router;
