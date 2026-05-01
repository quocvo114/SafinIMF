const mongoose = require("mongoose");

const AiValidationLogSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    locationMatch: {
      currentLocation: { type: String, default: "" },
      currentLat: { type: Number, default: null },
      currentLng: { type: Number, default: null },
      exifLocation: { type: String, default: "" },
      exifLat: { type: Number, default: null },
      exifLng: { type: Number, default: null },
      distanceKm: { type: Number, default: null },
      score: { type: Number, default: null },
    },
    timeMatch: {
      currentTime: { type: String, default: "" },
      exifTime: { type: String, default: "" },
      hoursDiff: { type: Number, default: null },
      score: { type: Number, default: null },
    },
    contentMatch: {
      description: { type: String, default: "" },
      score: { type: Number, default: null },
    },
    aiVision: {
      detections: { type: [mongoose.Schema.Types.Mixed], default: [] },
      totalObjects: { type: Number, default: 0 },
      damagePercentage: { type: Number, default: 0 },
      score: { type: Number, default: null },
      aiLabel: { type: String, default: "" },
      aiSource: { type: String, default: "" },
    },
    finalConfidenceScore: {
      type: Number,
      default: null,
    },
    finalConfidenceLevel: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "AiValidationLogs",
  },
);

module.exports = mongoose.model("AiValidationLog", AiValidationLogSchema);
