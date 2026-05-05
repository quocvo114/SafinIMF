const jwt = require("jsonwebtoken");
const User = require("../services/user/user.model");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(`\n🔍 [AUTH-MIDDLEWARE] ===== REQUEST RECEIVED =====`);
    console.log(`🔍 [AUTH-MIDDLEWARE] Method: ${req.method} ${req.path}`);
    console.log(`🔍 [AUTH-MIDDLEWARE] Authorization Header: ${authHeader ? authHeader.substring(0, 50) + "..." : "❌ MISSING"}`);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`❌ [AUTH-MIDDLEWARE] NO/INVALID BEARER TOKEN - REJECTED`);
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log(`\n🔍 [AUTH-MIDDLEWARE] ========== TOKEN VERIFICATION START ==========`);
    console.log(`🔍 [AUTH-MIDDLEWARE] User ID: ${decoded.id}`);
    console.log(`🔍 [AUTH-MIDDLEWARE] Token version FROM JWT: ${decoded.token_version}`);
    
    // Lấy user từ database để kiểm tra token_version
    const user = await User.findOne({ user_id: decoded.id }).lean();
    if (!user) {
      console.log(`❌ [AUTH-MIDDLEWARE] User ${decoded.id} NOT FOUND in DB - REJECTED`);
      console.log(`🔍 [AUTH-MIDDLEWARE] ========== TOKEN VERIFICATION END ==========\n`);
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    console.log(`🔍 [AUTH-MIDDLEWARE] Token version FROM DB: ${user.token_version || 0}`);
    console.log(`🔍 [AUTH-MIDDLEWARE] Comparing: JWT(${decoded.token_version}) === DB(${user.token_version || 0})?`);

    // So sánh token_version từ JWT với token_version từ DB
    if (decoded.token_version !== (user.token_version || 0)) {
      console.log(`❌ [AUTH-MIDDLEWARE] MISMATCH! JWT: ${decoded.token_version}, DB: ${user.token_version || 0} - TOKEN INVALIDATED`);
      console.log(`🔍 [AUTH-MIDDLEWARE] ========== TOKEN VERIFICATION END ==========\n`);
      return res.status(401).json({
        success: false,
        message: "Token không còn hợp lệ. Vui lòng đăng nhập lại",
      });
    }
    
    console.log(`✅ [AUTH-MIDDLEWARE] Token version MATCHED - TOKEN VALID`);
    console.log(`🔍 [AUTH-MIDDLEWARE] ========== TOKEN VERIFICATION END ==========\n`);
    req.user = {
      id: decoded.id,
      user_id: decoded.id,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    console.error("Lỗi xác thực token:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

module.exports = requireAuth;
