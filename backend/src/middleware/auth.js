const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("❌ Auth: Missing or invalid Authorization header");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { user_id: payload.id, role: payload.role };
    console.log(`🔐 Auth: Success - user_id=${payload.id}, role=${payload.role}`);
    next();
  } catch (err) {
    console.error("❌ Auth: Token verification failed:", err.message);
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

module.exports = requireAuth;
