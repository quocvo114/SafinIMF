const mongoose = require("mongoose");

const MaintenanceTeamSchema = new mongoose.Schema(
  {
    team_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    leader: {
      type: String,
      required: true,
      trim: true,
    },
    memberCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    currentCases: {
      type: Number,
      min: 0,
      default: 0,
    },
    specialty: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "handling_teams",
  },
);

module.exports =
  mongoose.models.HandlingTeam ||
  mongoose.model("HandlingTeam", MaintenanceTeamSchema, "handling_teams");
