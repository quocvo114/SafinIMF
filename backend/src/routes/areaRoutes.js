const express = require("express");
const router = express.Router();
const AreaController = require("../controllers/areaController");

router.get("/", AreaController.getAllAreas);

module.exports = router;
