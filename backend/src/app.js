const express = require("express");
const cors = require("cors");
const authRoutes = require("./services/auth/auth.routes");
const userRoutes = require("./services/user/user.routes");
const reportRoutes = require("./routes/reportRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");
const incidentTypeRoutes = require("./routes/incidentTypeRoutes");
const maintenanceTeamRoutes = require("./routes/maintenanceTeamRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

function createApp() {
  const app = express();

  // Use permissive CORS during development and ensure preflight handling
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    }),
  );

  app.options("*", cors());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/geocode", geocodeRoutes);
  app.use("/api/incident-types", incidentTypeRoutes);
  app.use("/api/maintenance-teams", maintenanceTeamRoutes);
  app.use("/api/statistics", statisticsRoutes);
  app.use("/api/notifications", notificationRoutes);

  return app;
}

module.exports = { createApp };
