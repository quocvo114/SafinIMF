const mongoose = require("mongoose");

const IncidentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    nameKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    iconKey: {
      type: String,
      default: "public",
      trim: true,
    },
    color: {
      type: String,
      default: "#f97316",
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("IncidentType", IncidentTypeSchema);
