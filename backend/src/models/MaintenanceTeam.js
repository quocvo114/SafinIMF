const mongoose = require("mongoose");

const MaintenanceTeamSchema = new mongoose.Schema(
  {
    team_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
    area: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "handling_teams",
  }
);

module.exports =
  mongoose.models.HandlingTeam ||
  mongoose.model("HandlingTeam", MaintenanceTeamSchema, "handling_teams");
