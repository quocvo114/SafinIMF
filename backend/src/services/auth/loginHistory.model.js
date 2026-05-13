const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: Number,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    ip_address: {
      type: String,
      default: "unknown",
    },
    device_info: {
      type: String,
      default: "unknown",
    },
    device_hash: {
      type: String, // Hash của ip + device để dễ compare
      index: true,
    },
    login_time: {
      type: Date,
      default: Date.now,
    },
    is_new_device: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
