const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/reportController");
const requireAuth = require("../middleware/auth");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/role");
const jwt = require("jsonwebtoken");

// Middleware tuùy chọn: gắn req.user nếu có token hợp lệ, không reject nếu không có
const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      req.user = { id: decoded.id, user_id: decoded.id, role: decoded.role };
    } catch (_err) {
      // Token invalid/expired → tiếp tục như không có token
    }
  }
  next();
};

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
  ReportController.getManagementReports,
);

// GET /api/reports/reception - Dữ liệu cho trang đơn tiếp nhận
router.get(
  "/reception",
  authMiddleware,
  requireRole("admin", "manager", "maintenance"),
  ReportController.getReceptionReports,
);

// POST /api/reports - Tạo báo cáo mới
router.post("/", requireAuth, ReportController.createReport);

// PATCH /api/reports/:id/status - Cập nhật trạng thái báo cáo (QLKV, đội, hoặc công dân cho báo cáo của họ)
router.patch(
  "/:id/status",
  authMiddleware,
  ReportController.updateReportStatus,
);

// PATCH /api/reports/:id/assign - Phân công đội xử lý
router.patch(
  "/:id/assign",
  authMiddleware,
  requireRole("admin", "manager"),
  ReportController.assignReport,
);

// PATCH /api/reports/:id/progress - PB14: Cập nhật tiến độ xử lý (Đội xử lý)
router.patch(
  "/:id/progress",
  authMiddleware,
  requireRole("maintenance"),
  ReportController.updateProgress,
);

// GET /api/reports/:id/cluster-peers - Lấy danh sách báo cáo trong cụm
router.get("/:id/cluster-peers", ReportController.getClusterPeers);

// GET /api/reports/:id - Lấy 1 báo cáo (phải đặt sau /user/:userId)
// Dùng optionalAuth để admin/manager/maintenance vẫn thấy afterImg khi có token
router.get("/:id", optionalAuth, ReportController.getReportById);

module.exports = router;
