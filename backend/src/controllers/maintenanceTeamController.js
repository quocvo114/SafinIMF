const MaintenanceTeamRepository = require("../repositories/MaintenanceTeamRepository");

class MaintenanceTeamController {
  async getTeams(req, res) {
    try {
      const { search = "", area = "all", status = "all", page = 1, limit = 10 } = req.query;

      const result = await MaintenanceTeamRepository.getList({
        search,
        area,
        status,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createTeam(req, res) {
    try {
      const { id, team_id, name, leader, memberCount, area, status } = req.body;
      const normalizedTeamId = team_id || id;

      if (!normalizedTeamId || !name || !leader || !area) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc: team_id, name, leader, area",
        });
      }

      const existed = await MaintenanceTeamRepository.findByTeamId(normalizedTeamId);
      if (existed) {
        return res.status(400).json({
          success: false,
          message: "Team ID đã tồn tại",
        });
      }

      const created = await MaintenanceTeamRepository.create({
        team_id: normalizedTeamId,
        name,
        leader,
        memberCount: Math.max(parseInt(memberCount, 10) || 1, 1),
        area,
        status: status || "active",
      });

      return res.status(201).json({
        success: true,
        message: "Tạo đội xử lý thành công",
        data: created,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { name, leader, memberCount, area, status } = req.body;

      const target = await MaintenanceTeamRepository.findByTeamId(teamId);
      if (!target) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đội xử lý" });
      }

      const updated = await MaintenanceTeamRepository.updateByTeamId(teamId, {
        name: name || target.name,
        leader: leader || target.leader,
        memberCount: Math.max(parseInt(memberCount, 10) || target.memberCount || 1, 1),
        area: area || target.area,
        status: status || target.status,
      });

      return res.status(200).json({
        success: true,
        message: "Cập nhật đội xử lý thành công",
        data: updated,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTeamStatus(req, res) {
    try {
      const { teamId } = req.params;
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
      }

      const updated = await MaintenanceTeamRepository.updateStatusByTeamId(teamId, status);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đội xử lý" });
      }

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái thành công",
        data: updated,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteTeam(req, res) {
    try {
      const { teamId } = req.params;
      const deleted = await MaintenanceTeamRepository.deleteByTeamId(teamId);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đội xử lý" });
      }

      return res.status(200).json({
        success: true,
        message: "Xóa đội xử lý thành công",
        data: deleted,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MaintenanceTeamController();
