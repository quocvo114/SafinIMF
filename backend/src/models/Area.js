const mongoose = require("mongoose");

const AreaSchema = new mongoose.Schema(
  {
    area_id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Area", AreaSchema);
