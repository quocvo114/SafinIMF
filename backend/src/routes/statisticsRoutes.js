const express = require("express");
const StatisticsController = require("../controllers/statisticsController");

const router = express.Router();

router.get("/summary", StatisticsController.getSummary);

module.exports = router;
