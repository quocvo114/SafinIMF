const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const otpService = require("./otp.service");
const userRepo = require("../user/user.repository");
const User = require("../user/user.model");
const LoginHistory = require("./loginHistory.model");

const VN_PHONE_PATTERN = /^0(?:3|5|7|8|9)\d{8}$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function normalizePhone(phone) {
  return typeof phone === "string" ? phone.trim() : "";
}

function isStrongPassword(password) {
  return STRONG_PASSWORD_PATTERN.test(String(password || ""));
}

// 1) Gửi OTP đăng ký
async function sendRegisterOtp(req, res) {
  try {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại" });
    }

    if (!VN_PHONE_PATTERN.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không đúng định dạng" });
    }

    const exists = await userRepo.findByPhone(phone);
    if (exists) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }

    const code = otpService.generateOtp(phone);
    console.log(`🔐 OTP cho ${phone}: ${code}`);

    return res.json({
      success: true,
      message: "Đã tạo OTP (demo). Kiểm tra console server.",
      otp_demo: code,
    });
  } catch (err) {
    console.error("sendRegisterOtp error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

// 2) Confirm OTP + tạo user
async function confirmRegister(req, res) {
  try {
    const { otp, password, full_name, email } = req.body;
    const phone = normalizePhone(req.body?.phone);

    if (!phone || !otp || !password) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    if (!VN_PHONE_PATTERN.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không đúng định dạng" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: "mật khẩu không đủ mạnh" });
    }

    const valid = otpService.verifyOtp(phone, otp);
    if (!valid) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    const exists = await userRepo.findByPhone(phone);
    if (exists) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user_id = await userRepo.getNextUserId();

    const normalizedEmail =
      typeof email === "string" && email.trim() !== ""
        ? email.trim().toLowerCase()
        : undefined;

    const user = await userRepo.create({
      user_id,
      full_name: typeof full_name === "string" ? full_name.trim() : full_name,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      phone,
      password: hashed,
      phone_verified: true,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("confirmRegister error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

// 3) Login: phone + password (chỉ user đã verify)
async function login(req, res) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Thiếu số điện thoại hoặc mật khẩu" });
    }

    const user = await userRepo.findByPhone(phone);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Sai số điện thoại hoặc mật khẩu" });
    }

    // Kiểm tra tài khoản có bị khóa tạm thời không
    if (user.lock_until && user.lock_until > Date.now()) {
      const remainingMinutes = Math.ceil((user.lock_until - Date.now()) / 60000);
      return res.status(403).json({
        message: `Tài khoản đã bị khóa tạm thời. Vui lòng thử lại sau ${remainingMinutes} phút.`,
      });
    }

    const isPhoneVerified = user.phone_verified !== false;
    if (!isPhoneVerified) {
      return res
        .status(403)
        .json({ message: "Số điện thoại chưa được xác thực" });
    }

    if (user.account_status && user.account_status !== "active") {
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị khóa hoặc cấm" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      // Đăng nhập sai - tăng counter
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      
      if (newFailedAttempts >= 3) {
        // Khóa tài khoản 15 phút
        const lockTime = new Date(Date.now() + 15 * 60 * 1000);
        await userRepo.updateLoginAttempts(phone, newFailedAttempts, lockTime);
        return res.status(403).json({
          message: "Đã nhập sai mật khẩu 3 lần. Tài khoản bị khóa 15 phút.",
        });
      }
      
      await userRepo.updateLoginAttempts(phone, newFailedAttempts);
      const attemptsLeft = 3 - newFailedAttempts;
      return res.status(400).json({
        message: `Sai số điện thoại hoặc mật khẩu. Còn ${attemptsLeft} lần thử.`,
      });
    }

    // Đăng nhập thành công - reset counter
    await userRepo.updateLoginAttempts(phone, 0, null);

    // LẤY USER MỚI NHẤT TỪ DB ĐỂ ĐẢM BẢO token_version
    const freshUser = await User.findOne({ phone }).lean();
    
    if (!freshUser) {
      console.error(`❌ [LOGIN] Failed to fetch freshUser for phone: ${phone}`);
      return res.status(500).json({ message: "Lỗi lấy dữ liệu người dùng" });
    }
    
    // Ensure token_version exists in DB (set to 0 if undefined)
    if (freshUser.token_version === undefined || freshUser.token_version === null) {
      console.log(`⚠️  [LOGIN] token_version was undefined, updating to 0...`);
      await User.findOneAndUpdate(
        { phone },
        { $set: { token_version: 0 } },
        { new: false }
      );
      freshUser.token_version = 0;
    }
    
    console.log(`🔓 [LOGIN] User ${freshUser.user_id} authenticated`);
    console.log(`🔓 [LOGIN] Fresh token_version from DB: ${freshUser.token_version}`);

    const token = jwt.sign(
      { 
        id: freshUser.user_id, 
        role: freshUser.role,
        token_version: freshUser.token_version || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "1h" },
    );

    console.log(`🔓 [LOGIN] JWT created with token_version: ${freshUser.token_version || 0}`);

    return res.json({
      success: true,
      token,
      user: {
        user_id: freshUser.user_id,
        full_name: freshUser.full_name,
        phone: freshUser.phone,
        role: freshUser.role,
        is_first_login: freshUser.is_first_login || false,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

// 4) Google Login: verify token + gửi email xác thực
async function googleLogin(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Thiếu Google token" });
    }

    // Verify token với Google
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const full_name = payload.name;

    // Tìm user theo email
    let user = await userRepo.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Tạo user mới
      const user_id = await userRepo.getNextUserId();
      const phone = `GG${Date.now()}`.slice(-10);

      user = await userRepo.create({
        user_id,
        full_name,
        email,
        phone,
        password: null,
        phone_verified: true,
        email_verified: true,
        role: "user",
      });

      isNewUser = true;
      console.log(`✅ Tạo user mới từ Google: ${email}`);
    } else {
      console.log(`✅ Login Google cho user hiện tại: ${email}`);
    }

    if (user.account_status && user.account_status !== "active") {
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị khóa hoặc cấm" });
    }

    // LẤY USER MỚI NHẤT TỪ DB ĐỂ ĐẢM BẢO token_version
    const freshUser = await User.findOne({ user_id: user.user_id }).lean();
    
    console.log(`🔓 [GOOGLE] User ${freshUser.user_id} authenticated`);
    console.log(`🔓 [GOOGLE] Fresh token_version from DB: ${freshUser.token_version}`);

    // Tạo JWT token
    const jwtToken = jwt.sign(
      { 
        id: freshUser.user_id, 
        role: freshUser.role,
        token_version: freshUser.token_version || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    console.log(`🔓 [GOOGLE] JWT created with token_version: ${freshUser.token_version || 0}`);


    // Lưu login history
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const deviceHash = crypto
      .createHash("md5")
      .update(ipAddress + userAgent)
      .digest("hex");
    try {
      // Check xem device này đã login trước chưa
      const existingLogin = await LoginHistory.findOne({
        user_id: freshUser.user_id,
        device_hash: deviceHash,
      });
      const isNewDevice = !existingLogin;

      await LoginHistory.create({
        user_id: freshUser.user_id,
        email: freshUser.email,
        ip_address: ipAddress,
        device_info: userAgent,
        device_hash: deviceHash,
        login_time: Date.now(),
        is_new_device: isNewDevice,
      });
    } catch (historyErr) {
      console.error("❌ Lỗi lưu login history:", historyErr.message);
    }

    // Login thẳng - user đã active
    return res.json({
      success: true,
      token: jwtToken,
      user: {
        user_id: freshUser.user_id,
        full_name: freshUser.full_name,
        email: freshUser.email,
        phone: freshUser.phone,
        role: freshUser.role,
        email_verified: freshUser.email_verified,
        is_first_login: freshUser.is_first_login || false,
      },
    });
  } catch (err) {
    console.error("googleLogin error:", err);
    return res.status(401).json({ message: "Token Google không hợp lệ" });
  }
}

// 5) Gửi OTP để reset password
async function sendForgotPasswordOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại" });
    }

    const user = await userRepo.findByPhone(phone);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Số điện thoại không tồn tại trong hệ thống" });
    }

    const code = otpService.generateOtp(phone);
    console.log(`🔐 OTP reset password cho ${phone}: ${code}`);

    return res.json({
      success: true,
      message: "OTP đã được gửi (demo). Kiểm tra console server.",
      otp_demo: code,
    });
  } catch (err) {
    console.error("sendForgotPasswordOtp error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

// 6) Reset password với OTP
async function resetPassword(req, res) {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const valid = otpService.verifyOtp(phone, otp);
    if (!valid) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    const user = await userRepo.findByPhone(phone);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Số điện thoại không tồn tại" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await userRepo.updatePassword(user.user_id, hashed);

    return res.json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

// 7) Logout: Vô hiệu hóa token bằng cách tăng token_version
async function logout(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log(`❌ [LOGOUT] No user ID in request`);
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    console.log(`\n🔄 [LOGOUT] ========== LOGOUT START ==========`);
    console.log(`🔄 [LOGOUT] User ${userId} requesting logout...`);

    // Lấy user trước khi tăng token_version
    const userBefore = await User.findOne({ user_id: userId }).lean();
    console.log(`🔄 [LOGOUT] User token_version BEFORE logout: ${userBefore?.token_version || 0}`);

    // Tăng token_version để vô hiệu hóa tất cả token cũ
    const userAfter = await User.findOneAndUpdate(
      { user_id: userId },
      { $inc: { token_version: 1 } },
      { new: true }
    ).lean();

    if (!userAfter) {
      console.log(`❌ [LOGOUT] User ${userId} NOT FOUND - FAILED`);
      console.log(`🔄 [LOGOUT] ========== LOGOUT END ==========\n`);
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    console.log(`✅ [LOGOUT] User token_version AFTER logout: ${userAfter.token_version}`);
    console.log(`✅ [LOGOUT] Increment successful: ${userBefore?.token_version || 0} → ${userAfter.token_version}`);
    console.log(`🔄 [LOGOUT] ========== LOGOUT END ==========\n`);
    
    return res.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (err) {
    console.error(`❌ [LOGOUT] Error:`, err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

module.exports = {
  sendRegisterOtp,
  confirmRegister,
  login,
  googleLogin,
  sendForgotPasswordOtp,
  resetPassword,
  logout,
};