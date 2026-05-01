const jwt = require("jsonwebtoken");
const User = require("../services/user/user.model");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gán thông tin user từ token vào request
    req.user = {
      id: decoded.id,
      user_id: decoded.user_id,
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
