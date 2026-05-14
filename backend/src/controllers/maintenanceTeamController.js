const MaintenanceTeamRepository = require("../repositories/MaintenanceTeamRepository");
const Report = require("../models/Report");

class MaintenanceTeamController {
  async getTeams(req, res) {
    try {
      const {
        search = "",
        area = "all",
        status = "all",
        page = 1,
        limit = 10,
      } = req.query;

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
      const {
        id,
        team_id,
        name,
        leader,
        memberCount,
        area,
        status,
        specialty,
      } = req.body;
      const normalizedTeamId = team_id || id;
      const normalizedName = String(name || "").trim();
      const normalizedLeader = String(leader || "").trim();

      if (!normalizedTeamId || !normalizedName || !normalizedLeader || !area || !specialty) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu thông tin bắt buộc: team_id, name, leader, area, specialty",
        });
      }

      const existed =
        await MaintenanceTeamRepository.findByTeamId(normalizedTeamId);
      if (existed) {
        return res.status(400).json({
          success: false,
          message: "Team ID đã tồn tại",
        });
      }

      const existingName = await MaintenanceTeamRepository.findByName(
        normalizedName,
      );
      if (existingName) {
        return res.status(409).json({
          success: false,
          message: "Tên đội đã tồn tại",
        });
      }

      const existingLeader = await MaintenanceTeamRepository.findByLeader(
        normalizedLeader,
      );
      if (existingLeader) {
        return res.status(409).json({
          success: false,
          message: "Trưởng đội đã thuộc một đội xử lý khác",
        });
      }

      const created = await MaintenanceTeamRepository.create({
        team_id: normalizedTeamId,
        name: normalizedName,
        leader: normalizedLeader,
        memberCount: Math.max(parseInt(memberCount, 10) || 1, 1),
        specialty: specialty ?? "",
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
      const { name, leader, memberCount, area, status, specialty } = req.body;

      const target = await MaintenanceTeamRepository.findByTeamId(teamId);
      if (!target) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đội xử lý" });
      }

      const nextName = String(name || target.name || "").trim();
      const nextLeader = String(leader || target.leader || "").trim();

      if (!nextName || !nextLeader) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc: name, leader",
        });
      }

      const existingName = await MaintenanceTeamRepository.findByName(nextName);
      if (existingName && existingName.team_id !== teamId) {
        return res.status(409).json({
          success: false,
          message: "Tên đội đã tồn tại",
        });
      }

      const existingLeader = await MaintenanceTeamRepository.findByLeader(
        nextLeader,
      );
      if (existingLeader && existingLeader.team_id !== teamId) {
        return res.status(409).json({
          success: false,
          message: "Trưởng đội đã thuộc một đội xử lý khác",
        });
      }

      const updated = await MaintenanceTeamRepository.updateByTeamId(teamId, {
        name: nextName,
        leader: nextLeader,
        memberCount: Math.max(
          parseInt(memberCount, 10) || target.memberCount || 1,
          1,
        ),
        specialty: specialty !== undefined ? specialty : target.specialty,
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
        return res
          .status(400)
          .json({ success: false, message: "Trạng thái không hợp lệ" });
      }

      const updated = await MaintenanceTeamRepository.updateStatusByTeamId(
        teamId,
        status,
      );
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đội xử lý" });
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
      const team = await MaintenanceTeamRepository.findByTeamId(teamId);
      if (!team) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đội xử lý" });
      }

      const activeReportCount = await Report.countDocuments({
        $or: [
          { assignedTeamId: String(teamId) },
          { handlingTeamId: String(teamId) },
        ],
        status: "Đang Xử Lý",
      });

      const currentCases = Math.max(parseInt(team.currentCases, 10) || 0, 0);
      if (currentCases > 0 || activeReportCount > 0) {
        return res.status(409).json({
          success: false,
          code: "TEAM_HAS_ACTIVE_REPORTS",
          message: "Không thể xóa đội xử lý khi đội đang xử lý báo cáo",
        });
      }

      const deleted = await MaintenanceTeamRepository.deleteByTeamId(teamId);

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đội xử lý" });
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
