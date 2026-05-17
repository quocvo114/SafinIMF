const express = require("express");
const cors = require("cors");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const connectDB = require("./src/config/database");
const authRoutes = require("./src/services/auth/auth.routes");
const userRoutes = require("./src/services/user/user.routes");
const reportRoutes = require("./src/routes/reportRoutes");
const geocodeRoutes = require("./src/routes/geocodeRoutes");
const maintenanceTeamRoutes = require("./src/routes/maintenanceTeamRoutes");
const areaRoutes = require("./src/routes/areaRoutes");
const incidentTypeRoutes = require("./src/routes/incidentTypeRoutes");
const statisticsRoutes = require("./src/routes/statisticsRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const ENABLE_MONGO = process.env.ENABLE_MONGO !== "false";
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const LOCALHOST_REGEX = /^http:\/\/localhost:\d+$/;
const LOOPBACK_REGEX = /^http:\/\/127\.0\.0\.1:\d+$/;
// const PORT = process.env.BACKEND_PORT || 5050;
// const ENABLE_MONGO = process.env.ENABLE_MONGO !== "false";

// CORS - Phải đặt trước các middleware khác
// Simpler, more permissive CORS config for local development and to
// ensure preflight OPTIONS requests are handled correctly.
app.use(
  cors({
    origin: true, // reflect request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }),
);

// Ensure preflight OPTIONS are responded to for all routes (removed due to path-to-regexp incompatibility)

// Ensure preflight requests are handled for all routes
// Note: explicit app.options('*', ...) removed due to path-to-regexp incompatibility

// Middleware - Tăng limit cho JSON và URL encoded để nhận ảnh base64
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Kết nối MongoDB
if (ENABLE_MONGO) {
  connectDB();
} else {
  console.log("MongoDB connection is disabled via ENABLE_MONGO=false");
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/maintenance-teams", maintenanceTeamRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/incident-types", incidentTypeRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/notifications", notificationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
