const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    report_id: {
      type: String,
      required: true,
      unique: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
    },
    report_id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    user_id: {
      type: Number,
      index: true,
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    location: {
      type: String,
      required: true,
    },

    lat: {
      type: Number,
      min: -90,
      max: 90,
      default: null,
    },

    lng: {
      type: Number,
      min: -180,
      max: 180,
      default: null,
    },

    status: {
      type: String,
      required: true,
      enum: ["Đang Chờ", "Đang Xử Lý", "Đã Giải Quyết"],
      default: "Đang Chờ",
    },

    time: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    beforeImg: {
      type: String,
      default: "",
    },

    afterImg: {
      type: String,
      default: "",
    },
    aiPercent: {
      type: Number,
      default: null,
    },
    aiVerified: {
      type: Boolean,
      default: false,
    },
    aiLabel: {
      type: String,
      default: "",
    },
    aiTotalObjects: {
      type: Number,
      default: 0,
    },
    aiSource: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Report", ReportSchema);
