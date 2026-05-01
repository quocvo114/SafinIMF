const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true },

  full_name: String,
  
  email: String,

  phone: { type: String, unique: true, required: true },
  
  password: String, // hash (nullable cho Google login)
  
  gender: { type: String, enum: ["Nam", "Nữ", "Khác"], default: "Nam" },

  phone_verified: { type: Boolean, default: false },

  email_verified: { type: Boolean, default: false },

  verification_token: String,

  role: {
    type: String,
    enum: ["citizen", "manager", "maintenance", "admin"],
    default: "citizen",
  },

  area: {
    type: String,
    default: "",
  },

  account_status: {
    type: String,
    enum: ["active", "locked", "banned"],
    default: "active",
  },

  created_at: { type: Date, default: Date.now },
});

// Chỉ áp unique khi email có giá trị thực tế (không rỗng).
UserSchema.index(
  { email: 1 },
  {
    name: "email_1",
    unique: true,
    sparse: true,
  },
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
