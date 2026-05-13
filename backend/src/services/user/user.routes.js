const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const authMiddleware = require("../../middleware/auth");
const requireRole = require("../../middleware/role");

// GET /api/user/profile - Lấy thông tin cá nhân
router.get("/profile", authMiddleware, userController.getProfile);

// PUT /api/user/profile - Cập nhật thông tin cá nhân
router.put("/profile", authMiddleware, userController.updateProfile);

// POST /api/user/change-password - Đổi mật khẩu
router.post("/change-password", authMiddleware, userController.changePassword);

// DELETE /api/user/account - Xóa tài khoản
router.delete("/account", authMiddleware, userController.deleteAccount);

// GET /api/user/all - Lấy danh sách tất cả user (chỉ admin)
router.get("/all", authMiddleware, requireRole("admin"), userController.getAllUsers);

// GET /api/user/management - Danh sách user cho trang quản lý
router.get(
	"/management",
	authMiddleware,
	requireRole("admin", "manager"),
	userController.getManagementUsers
);

// POST /api/user/management - Tạo user từ trang quản lý
router.post(
	"/management",
	authMiddleware,
	requireRole("admin", "manager"),
	userController.createManagementUser
);

// PUT /api/user/management/:userId - Sửa user từ trang quản lý
router.put(
	"/management/:userId",
	authMiddleware,
	requireRole("admin", "manager"),
	userController.updateManagementUser
);

// PATCH /api/user/management/:userId/status - Khóa/mở khóa user
router.patch(
	"/management/:userId/status",
	authMiddleware,
	requireRole("admin", "manager"),
	userController.updateManagementUserStatus
);

// DELETE /api/user/management/:userId - Xóa user
router.delete(
	"/management/:userId",
	authMiddleware,
	requireRole("admin", "manager"),
	userController.deleteManagementUser
);

module.exports = router;
