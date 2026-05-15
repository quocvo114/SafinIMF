const Notification = require("../models/Notification");

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông báo",
        });
      }

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });

      res.status(200).json({
        success: true,
        message: "Đã đánh dấu tất cả là đã đọc",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Utility method to be called from other controllers
  static async createNotification({ userId, title, message, type = "report", level = "normal", relatedId = null }) {
    try {
      if (!userId) return null;
      
      const newNotification = new Notification({
        userId: String(userId),
        title,
        message,
        type,
        level,
        relatedId: String(relatedId),
      });
      
      return await newNotification.save();
    } catch (error) {
      console.error("❌ Failed to create notification:", error.message);
      return null;
    }
  }
}

module.exports = NotificationController;
