const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Can be user Object ID or generic ID
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["report", "warning", "system"],
      default: "report",
    },
    level: {
      type: String,
      enum: ["low", "normal", "critical"],
      default: "normal",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: String, // e.g. Report ID
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for human-readable time (similar to what frontend expects if needed)
notificationSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return this.createdAt.toLocaleDateString("vi-VN");
});

module.exports = mongoose.model("Notification", notificationSchema);
