const Area = require("../models/Area");

class AreaController {
  async getAllAreas(req, res) {
    try {
      const areas = await Area.find({}).sort({ name: 1 });
      res.status(200).json({
        success: true,
        data: areas,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AreaController();
