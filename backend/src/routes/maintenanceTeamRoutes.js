const express = require("express");
const router = express.Router();
const maintenanceTeamController = require("../controllers/maintenanceTeamController");
const authMiddleware = require("../middleware/auth");
const requireRole = require("../middleware/role");

router.get(
  "/",
  authMiddleware,
  requireRole("admin", "manager", "maintenance"),
  maintenanceTeamController.getTeams
);

router.post(
  "/",
  authMiddleware,
  requireRole("admin", "manager"),
  maintenanceTeamController.createTeam
);

router.put(
  "/:teamId",
  authMiddleware,
  requireRole("admin", "manager"),
  maintenanceTeamController.updateTeam
);

router.patch(
  "/:teamId/status",
  authMiddleware,
  requireRole("admin", "manager"),
  maintenanceTeamController.updateTeamStatus
);

router.delete(
  "/:teamId",
  authMiddleware,
  requireRole("admin", "manager"),
  maintenanceTeamController.deleteTeam
);

module.exports = router;
