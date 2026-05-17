
const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
     id: {
       type: String,
       required: true,
       unique: true,
       index: true, // Add index for faster lookup
     },
     report_id: {
       // For numeric, sequential ID if applicable, allow it to be optional
       type: Number,
       unique: true,
       sparse: true, // Allow multiple documents to have null or missing report_id, or enforce uniqueness only on non-null values
       default: null,
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
      index: true, // Add index for faster location/district filtering
    },
    reportLatitude: {
      type: Number,
      default: null,
    },
    reportLongitude: {
      type: Number,
      default: null,
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
      enum: ["Đang Chờ", "Đang Xử Lý", "Đã Giải Quyết", "Đã Hoàn Tất"],
      default: "Đang Chờ",
      index: true, // Add index for faster status filtering
    },

    assignedTeamId: {
      type: String,
      default: "",
      trim: true,
    },
    assignedTeamName: {
      type: String,
      default: "",
      trim: true,
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

    progressNote: {
      type: String,
      default: "",
    },

    clusterSourceId: {
      type: String,
      default: null,
      index: true,
    },
    clusterSyncedAt: {
      type: Date,
      default: null,
    },
    clusterSyncNote: {
      type: String,
      default: null,
    },

    handlingTeamId: {
      type: String,
      default: "",
    },
    handlingTeamName: {
      type: String,
      default: "",
    },
    assignedTeamId: {
      type: String,
      default: "",
    },
    assignedTeamName: {
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
    exifMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    confidenceScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    scoringDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ type: 1, createdAt: -1 });
ReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Report", ReportSchema);
