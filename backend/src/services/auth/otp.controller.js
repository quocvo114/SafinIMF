/**
 * 🔒 OTP Authentication Controller (Dev Mode - Terminal OTP)
 * Luồng đơn giản: Generate OTP 6 số → Log terminal → Verify
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userRepo = require("../user/user.repository");
const User = require("../user/user.model");

// 🔐 Store OTP tạm thời (phone → {code, expiresAt})
const otpStore = new Map();

// ⏱️ TTL OTP: 5 phút (300 giây)
const OTP_EXPIRY_SECONDS = 300;

/**
 * ✅ Sinh OTP 6 số random
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 📱 API: Gửi OTP
 * POST /auth/request-otp
 * Body: { phoneNumber }
 */
exports.requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validation
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Thiếu số điện thoại",
      });
    }

    // Validate phone format VN (0[3|5|7|8|9]xxxxxxxx)
    const phoneRegex = /^0[3578][0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ (định dạng: 0XXXXXXXXX)",
      });
    }

    // Sinh OTP 6 số
    const otpCode = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000;

    // Lưu vào store
    otpStore.set(phoneNumber, {
      code: otpCode,
      expiresAt,
      attempts: 0,
    });

    // 🎯 In OTP ra terminal backend
    console.log("");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║                   ✅ OTP GENERATED                     ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`║ 📱 Phone: ${phoneNumber.padEnd(50)} ║`);
    console.log(`║ 🔐 OTP Code: ${otpCode.padEnd(45)} ║`);
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log("");

    return res.json({
      success: true,
      message: "✅ OTP đã được gửi. Kiểm tra terminal backend để xem mã OTP",
      phoneNumber: phoneNumber.replace(/(\d{2})(\d{3})(\d{4})/, "$1****$3"), // Ẩn 3 số giữa
      expiresIn: OTP_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("❌ requestOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

/**
 * ✅ Xác thực OTP
 * POST /auth/verify-otp
 * Body: { phoneNumber, otpCode }
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otpCode } = req.body;

    // Validation
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu số điện thoại hoặc mã OTP",
      });
    }

    // Kiểm tra OTP có trong store không
    if (!otpStore.has(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "❌ Không tìm thấy OTP. Vui lòng yêu cầu OTP mới",
      });
    }

    const otpData = otpStore.get(phoneNumber);

    // Kiểm tra hết hạn
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(phoneNumber);
      console.log(`⏰ OTP hết hạn cho: ${phoneNumber}`);
      return res.status(400).json({
        success: false,
        message: "❌ OTP đã hết hạn. Vui lòng yêu cầu OTP mới",
      });
    }

    // Kiểm tra số lần thử (tối đa 5 lần)
    if (otpData.attempts >= 5) {
      otpStore.delete(phoneNumber);
      console.log(`⚠️ Vượt quá số lần thử cho: ${phoneNumber}`);
      return res.status(429).json({
        success: false,
        message: "❌ Vượt quá số lần nhập. Vui lòng yêu cầu OTP mới",
      });
    }

    // So khớp mã OTP
    if (otpCode !== otpData.code) {
      otpData.attempts += 1;
      console.log(
        `❌ OTP sai cho: ${phoneNumber} (Lần ${otpData.attempts}/5)`
      );
      return res.status(400).json({
        success: false,
        message: `❌ Mã OTP sai. Còn ${5 - otpData.attempts} lần thử`,
      });
    }

    // ✅ OTP ĐÚNG - Xóa khỏi store
    otpStore.delete(phoneNumber);
    console.log(
      `✅ OTP xác thực thành công cho: ${phoneNumber}`
    );

    // Tìm hoặc tạo user
    let user = await userRepo.findByPhone(phoneNumber);
    let isNewUser = false;

    if (!user) {
      // Tạo user mới nếu chưa tồn tại
      const userId = await userRepo.getNextUserId();
      user = await userRepo.create({
        user_id: userId,
        phone: phoneNumber,
        phone_verified: true,
        role: "user",
        account_status: "active",
      });
      isNewUser = true;
      console.log(`✅ Tạo user mới từ OTP: ${phoneNumber}`);
    } else {
      console.log(`✅ Login user hiện tại: ${phoneNumber}`);
    }

    // LẤY USER MỚI NHẤT TỪ DB ĐỂ ĐẢM BẢO token_version
    const freshUser = await User.findOne({ phone: phoneNumber }).lean();
    
    console.log(`🔓 [OTP] User ${freshUser.user_id} authenticated`);
    console.log(`🔓 [OTP] Fresh token_version from DB: ${freshUser.token_version}`);

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: freshUser.user_id, 
        role: freshUser.role,
        token_version: freshUser.token_version || 0
      },
      process.env.JWT_SECRET || "your-secret-key-dev",
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    console.log(`🔓 [OTP] JWT created with token_version: ${freshUser.token_version || 0}`);

    return res.json({
      success: true,
      message: "✅ Xác thực OTP thành công!",
      token,
      user: {
        user_id: freshUser.user_id,
        phone: freshUser.phone,
        full_name: freshUser.full_name || "User",
        role: freshUser.role,
        isNewUser,
      },
    });
  } catch (error) {
    console.error("❌ verifyOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

/**
 * 🧹 Xóa OTP cũ (cleanup)
 * Chạy định kỳ để xóa OTP hết hạn
 */
exports.cleanupExpiredOtps = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Đã xóa ${cleaned} OTP hết hạn`);
  }
};

// Cleanup OTP mỗi 1 phút
setInterval(exports.cleanupExpiredOtps, 60 * 1000);
