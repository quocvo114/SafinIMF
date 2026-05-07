const express = require("express");
const cors = require("cors");
const authRoutes = require("./services/auth/auth.routes");
const userRoutes = require("./services/user/user.routes");
const reportRoutes = require("./routes/reportRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");
const incidentTypeRoutes = require("./routes/incidentTypeRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/geocode", geocodeRoutes);
  app.use("/api/incident-types", incidentTypeRoutes);
  app.use("/api/statistics", statisticsRoutes);

  return app;
}

module.exports = { createApp };
