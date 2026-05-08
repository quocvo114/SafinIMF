/**
 * 🔒 JWT Authentication Middleware (Thay thế Firebase)
 * Verify JWT token từ Authorization header
 */

const jwt = require("jsonwebtoken");
const User = require("../services/user/user.model");

/**
 * ✅ Middleware xác minh JWT token
 * Header: Authorization: Bearer <token>
 */
const verifyJwt = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "❌ Thiếu token. Vui lòng đăng nhập",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-dev"
    );

    console.log(`🔍 [JWT] Verifying token for user ${decoded.id}, token_version in JWT: ${decoded.token_version}`);

    // Kiểm tra token_version từ database
    const user = await User.findOne({ user_id: decoded.id }).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "❌ Người dùng không tồn tại",
      });
    }

    console.log(`🔍 [JWT] User ${decoded.id} from DB has token_version: ${user.token_version}`);

    // Nếu token_version không khớp, token đã bị vô hiệu hóa
    if (decoded.token_version !== (user.token_version || 0)) {
      console.log(`❌ [JWT] Token version mismatch! JWT: ${decoded.token_version}, DB: ${user.token_version} - REJECTED`);
      return res.status(401).json({
        success: false,
        message: "❌ Token không còn hợp lệ. Vui lòng đăng nhập lại",
      });
    }

    console.log(`✅ [JWT] Token version matched for user ${decoded.id} - ACCEPTED`);
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log(`✅ JWT verified for user: ${decoded.id}`);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "❌ Token đã hết hạn. Vui lòng đăng nhập lại",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "❌ Token không hợp lệ",
      });
    }

    console.error("❌ JWT verification error:", error.message);
    return res.status(401).json({
      success: false,
      message: "❌ Xác thực thất bại",
    });
  }
};

module.exports = {
  verifyJwt,
};
