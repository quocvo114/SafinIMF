require("dotenv").config();
const connectDB = require("./src/config/database");
const authRoutes = require("./src/services/auth/auth.routes");
const userRoutes = require("./src/services/user/user.routes");
const reportRoutes = require("./src/routes/reportRoutes");
const geocodeRoutes = require("./src/routes/geocodeRoutes");
const maintenanceTeamRoutes = require("./src/routes/maintenanceTeamRoutes");

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
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
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        LOCALHOST_REGEX.test(origin) ||
        LOOPBACK_REGEX.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

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

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
