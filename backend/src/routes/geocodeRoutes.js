const express = require("express");
const router = express.Router();
const GeocodeController = require("../controllers/geocodeController");

// GET /api/geocode/reverse?lat=xxx&lon=xxx
router.get("/reverse", GeocodeController.reverseGeocode);

module.exports = router;
