require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./src/services/user/user.model");

const TEST_PHONE = "9999999999";
const TEST_PASSWORD = "password123";

(async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb+srv://trannhatthai04:BcaHfqKc6UqcXhSa@cluster0.plbl2n9.mongodb.net/demo-app-qlkv?retryWrites=true&w=majority";
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB");

    // Delete if exists
    await User.deleteOne({ phone: TEST_PHONE });
    console.log(`🗑️  Deleted old user with phone ${TEST_PHONE}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // Create new user
    const maxUserId = await User.findOne({}, { user_id: 1 }).sort({ user_id: -1 }).lean();
    const nextUserId = (maxUserId?.user_id || 0) + 1;

    const newUser = await User.create({
      user_id: nextUserId,
      full_name: "Test User",
      phone: TEST_PHONE,
      password: hashedPassword,
      phone_verified: true,
      email_verified: false,
      role: "user",
      account_status: "active",
      token_version: 0,
      failed_login_attempts: 0,
    });

    console.log(`\n✅ TEST USER CREATED!`);
    console.log(`   Phone: ${TEST_PHONE}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   User ID: ${newUser.user_id}`);
    console.log(`   Token Version: ${newUser.token_version}`);
    console.log(`\n   Use this in test script!\n`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
