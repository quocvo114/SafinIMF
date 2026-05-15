const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/notificationController");
const requireAuth = require("../middleware/auth");

const controller = new NotificationController();

router.get("/", requireAuth, controller.getNotifications);
router.patch("/:id/read", requireAuth, controller.markAsRead);
router.patch("/mark-all-read", requireAuth, controller.markAllAsRead);

module.exports = router;
