const MaintenanceTeam = require("../models/MaintenanceTeam");

class MaintenanceTeamRepository {
  async getList({ search, area, status, page = 1, limit = 10 }) {
    const query = {};

    if (area && area !== "all") {
      query.area = area;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const keyword = search.trim();
      query.$or = [
        { team_id: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } },
        { leader: { $regex: keyword, $options: "i" } },
      ];
    }

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      MaintenanceTeam.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      MaintenanceTeam.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }

  async findByTeamId(team_id) {
    return MaintenanceTeam.findOne({ team_id }).lean();
  }

  async create(data) {
    const doc = await MaintenanceTeam.create(data);
    return doc.toObject();
  }

  async updateByTeamId(team_id, data) {
    return MaintenanceTeam.findOneAndUpdate(
      { team_id },
      {
        name: data.name,
        leader: data.leader,
        memberCount: data.memberCount,
        area: data.area,
        status: data.status,
      },
      { new: true }
    ).lean();
  }

  async updateStatusByTeamId(team_id, status) {
    return MaintenanceTeam.findOneAndUpdate(
      { team_id },
      { status },
      { new: true }
    ).lean();
  }

  async deleteByTeamId(team_id) {
    return MaintenanceTeam.findOneAndDelete({ team_id }).lean();
  }
}

module.exports = new MaintenanceTeamRepository();
