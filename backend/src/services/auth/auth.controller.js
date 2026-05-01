const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const otpService = require("./otp.service");
const userRepo = require("../user/user.repository");
const LoginHistory = require("./loginHistory.model");

// 1) Gửi OTP đăng ký
async function sendRegisterOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại" });
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
    const { phone, otp, password, full_name, email } = req.body;

    if (!phone || !otp || !password) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
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
      role: "citizen",
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
      return res
        .status(400)
        .json({ message: "Sai số điện thoại hoặc mật khẩu" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "1h" },
    );

    return res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
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
        role: "citizen",
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

    // Tạo JWT token
    const jwtToken = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );


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
        user_id: user.user_id,
        device_hash: deviceHash,
      });
      const isNewDevice = !existingLogin;

      await LoginHistory.create({
        user_id: user.user_id,
        email: user.email,
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
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        email_verified: user.email_verified,
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

module.exports = {
  sendRegisterOtp,
  confirmRegister,
  login,
  googleLogin,
  sendForgotPasswordOtp,
  resetPassword,
};