const IncidentType = require("../models/IncidentType");
const Report = require("../models/Report");

const DEFAULT_INCIDENT_TYPES = [
  {
    name: "Giao Thông",
    description: "Quản lý các sự cố liên quan đến đường xá và giao thông đô thị.",
    iconKey: "car",
    color: "#f97316",
  },
  {
    name: "Điện",
    description: "Các sự cố liên quan đến điện, đèn tín hiệu và hạ tầng chiếu sáng.",
    iconKey: "electric",
    color: "#fdca00",
  },
  {
    name: "Cây Xanh",
    description: "Các sự cố liên quan đến cây xanh, cành gãy và mảng xanh đô thị.",
    iconKey: "tree",
    color: "#74c365",
  },
  {
    name: "CTCC",
    description: "Các sự cố liên quan đến công trình công cộng và tiện ích đô thị.",
    iconKey: "public",
    color: "#b78ff2",
  },
];

class IncidentTypeRepository {
  normalizeName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  getNameKey(name) {
    return this.normalizeName(name).toLowerCase();
  }

  async ensureDefaults() {
    const total = await IncidentType.countDocuments({});
    if (total > 0) return;

    const seedDocs = DEFAULT_INCIDENT_TYPES.map((item) => ({
      ...item,
      name: this.normalizeName(item.name),
      nameKey: this.getNameKey(item.name),
      active: true,
    }));

    await IncidentType.insertMany(seedDocs, { ordered: false });
  }

  async getAll({ includeInactive = false }) {
    const query = includeInactive ? {} : { active: true };
    return IncidentType.find(query).sort({ createdAt: 1 }).lean();
  }

  async getById(id) {
    return IncidentType.findById(id);
  }

  async findActiveByName(name) {
    const nameKey = this.getNameKey(name);
    if (!nameKey) return null;

    return IncidentType.findOne({ nameKey, active: true });
  }

  async create(payload) {
    const normalizedName = this.normalizeName(payload?.name);
    if (!normalizedName) {
      const error = new Error("Tên loại sự cố không được để trống");
      error.code = "INVALID_NAME";
      throw error;
    }

    const nameKey = this.getNameKey(normalizedName);
    const existing = await IncidentType.findOne({ nameKey });
    if (existing) {
      const error = new Error("Tên loại sự cố đã tồn tại");
      error.code = "DUPLICATE_INCIDENT_TYPE";
      throw error;
    }

    const incidentType = new IncidentType({
      name: normalizedName,
      nameKey,
      description: String(payload?.description || "").trim(),
      iconKey: String(payload?.iconKey || "public").trim() || "public",
      color: String(payload?.color || "#f97316").trim() || "#f97316",
      active: payload?.active !== false,
    });

    return incidentType.save();
  }

  async update(id, payload) {
    const incidentType = await IncidentType.findById(id);
    if (!incidentType) {
      const error = new Error("Không tìm thấy loại sự cố");
      error.code = "INCIDENT_TYPE_NOT_FOUND";
      throw error;
    }

    if (typeof payload?.name === "string") {
      const normalizedName = this.normalizeName(payload.name);
      if (!normalizedName) {
        const error = new Error("Tên loại sự cố không được để trống");
        error.code = "INVALID_NAME";
        throw error;
      }

      const nameKey = this.getNameKey(normalizedName);
      const duplicate = await IncidentType.findOne({
        _id: { $ne: incidentType._id },
        nameKey,
      });

      if (duplicate) {
        const error = new Error("Tên loại sự cố đã tồn tại");
        error.code = "DUPLICATE_INCIDENT_TYPE";
        throw error;
      }

      incidentType.name = normalizedName;
      incidentType.nameKey = nameKey;
    }

    if (typeof payload?.description === "string") {
      incidentType.description = payload.description.trim();
    }

    if (typeof payload?.iconKey === "string" && payload.iconKey.trim()) {
      incidentType.iconKey = payload.iconKey.trim();
    }

    if (typeof payload?.color === "string" && payload.color.trim()) {
      incidentType.color = payload.color.trim();
    }

    if (typeof payload?.active === "boolean") {
      incidentType.active = payload.active;
    }

    return incidentType.save();
  }

  async getUsageStatsByNames(names) {
    const validNames = (names || []).filter(Boolean);
    if (!validNames.length) return new Map();

    const stats = await Report.aggregate([
      {
        $match: {
          type: { $in: validNames },
        },
      },
      {
        $group: {
          _id: "$type",
          totalCount: { $sum: 1 },
          processingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Đang Xử Lý"] }, 1, 0],
            },
          },
        },
      },
    ]);

    return new Map(
      stats.map((item) => [item._id, {
        totalCount: item.totalCount,
        processingCount: item.processingCount,
      }]),
    );
  }

  async softDeleteWithGuard(id) {
    const incidentType = await IncidentType.findById(id);
    if (!incidentType) {
      const error = new Error("Không tìm thấy loại sự cố");
      error.code = "INCIDENT_TYPE_NOT_FOUND";
      throw error;
    }

    if (!incidentType.active) {
      return incidentType;
    }

    const processingCount = await Report.countDocuments({
      type: incidentType.name,
      status: "Đang Xử Lý",
    });

    if (processingCount > 0) {
      const error = new Error(
        "Không thể xóa loại sự cố vì đang có báo cáo ở trạng thái Đang Xử Lý",
      );
      error.code = "INCIDENT_TYPE_IN_PROCESSING_USE";
      error.processingCount = processingCount;
      throw error;
    }

    incidentType.active = false;
    await incidentType.save();
    return incidentType;
  }
}

module.exports = new IncidentTypeRepository();
