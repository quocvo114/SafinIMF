const IncidentTypeRepository = require("../repositories/IncidentTypeRepository");

class IncidentTypeController {
  async getIncidentTypes(req, res) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const includeUsage = req.query.includeUsage === "true";

      await IncidentTypeRepository.ensureDefaults();
      const incidentTypes = await IncidentTypeRepository.getAll({
        includeInactive,
      });

      if (!includeUsage) {
        return res.status(200).json({
          success: true,
          data: incidentTypes,
        });
      }

      const usageMap = await IncidentTypeRepository.getUsageStatsByNames(
        incidentTypes.map((item) => item.name),
      );

      const data = incidentTypes.map((item) => {
        const usage = usageMap.get(item.name) || {
          totalCount: 0,
          processingCount: 0,
        };

        return {
          ...item,
          totalCount: usage.totalCount,
          processingCount: usage.processingCount,
        };
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getIncidentTypeById(req, res) {
    try {
      const { id } = req.params;
      const incidentType = await IncidentTypeRepository.getById(id);

      if (!incidentType) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy loại sự cố",
        });
      }

      return res.status(200).json({
        success: true,
        data: incidentType,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createIncidentType(req, res) {
    try {
      const incidentType = await IncidentTypeRepository.create(req.body);
      return res.status(201).json({
        success: true,
        message: "Tạo loại sự cố thành công",
        data: incidentType,
      });
    } catch (error) {
      if (error.code === "DUPLICATE_INCIDENT_TYPE") {
        return res.status(409).json({
          success: false,
          code: error.code,
          message: error.message,
        });
      }

      if (error.code === "INVALID_NAME") {
        return res.status(400).json({
          success: false,
          code: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateIncidentType(req, res) {
    try {
      const { id } = req.params;
      const incidentType = await IncidentTypeRepository.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Cập nhật loại sự cố thành công",
        data: incidentType,
      });
    } catch (error) {
      if (
        error.code === "DUPLICATE_INCIDENT_TYPE" ||
        error.code === "INVALID_NAME"
      ) {
        return res.status(400).json({
          success: false,
          code: error.code,
          message: error.message,
        });
      }

      if (error.code === "INCIDENT_TYPE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          code: error.code,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteIncidentType(req, res) {
    try {
      const { id } = req.params;
      const incidentType = await IncidentTypeRepository.softDeleteWithGuard(id);

      return res.status(200).json({
        success: true,
        message: "Xóa loại sự cố thành công",
        data: incidentType,
      });
    } catch (error) {
      if (error.code === "INCIDENT_TYPE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          code: error.code,
          message: error.message,
        });
      }

      if (error.code === "INCIDENT_TYPE_IN_PROCESSING_USE") {
        return res.status(409).json({
          success: false,
          code: error.code,
          processingCount: error.processingCount,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new IncidentTypeController();
