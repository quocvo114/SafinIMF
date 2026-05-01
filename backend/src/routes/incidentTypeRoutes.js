const express = require("express");
const requireAuth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const IncidentTypeController = require("../controllers/incidentTypeController");

const router = express.Router();

router.get("/", IncidentTypeController.getIncidentTypes);
router.get("/:id", IncidentTypeController.getIncidentTypeById);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  IncidentTypeController.createIncidentType,
);
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  IncidentTypeController.updateIncidentType,
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  IncidentTypeController.deleteIncidentType,
);

module.exports = router;
