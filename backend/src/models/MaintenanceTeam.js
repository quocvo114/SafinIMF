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
    specialty: {
      type: String,
      trim: true,
      default: "",
<<<<<<< HEAD
      index: true,
=======
>>>>>>> a1dc2780f221d8def6623488afdbaab840d13174
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
