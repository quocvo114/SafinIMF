const Report = require("../models/Report");

const DISTRICT_ALIAS_MAP = {
  "hai chau": ["hai chau", "phuong hai chau"],
  "son tra": ["son tra"],
  "lien chieu": ["lien chieu"],
  "hoang sa": ["hoang sa"],
  "thanh khe": ["thanh khe"],
  "ngu hanh son": ["ngu hanh son"],
  "cam le": ["cam le", "hoa xuan", "khue trung"],
  "hoa vang": ["hoa vang"],
};

const VIETNAMESE_CHAR_CLASS_MAP = {
  a: "[aàáạảãâầấậẩẫăằắặẳẵ]",
  d: "[dđ]",
  e: "[eèéẹẻẽêềếệểễ]",
  i: "[iìíịỉĩ]",
  o: "[oòóọỏõôồốộổỗơờớợởỡ]",
  u: "[uùúụủũưừứựửữ]",
  y: "[yỳýỵỷỹ]",
};

const LIST_PROJECTION = {
  _id: 1,
  id: 1,
  report_id: 1,
  title: 1,
  type: 1,
  location: 1,
  status: 1,
  time: 1,
  aiPercent: 1,
  aiVerified: 1,
  userId: 1,
  user_id: 1,
  createdAt: 1,
  updatedAt: 1,
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const NORMALIZED_DISTRICT_ALIAS_MAP = Object.entries(DISTRICT_ALIAS_MAP).reduce(
  (acc, [district, aliases]) => {
    acc[normalizeText(district)] = aliases.map((alias) => normalizeText(alias));
    return acc;
  },
  {},
);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildVietnameseRegexPattern(value = "") {
  const normalized = normalizeText(value);

  return normalized
    .split("")
    .map((char) => {
      if (char === " ") return "\\s+";
      if (VIETNAMESE_CHAR_CLASS_MAP[char]) {
        return VIETNAMESE_CHAR_CLASS_MAP[char];
      }
      return escapeRegex(char);
    })
    .join("");
}

function buildDistrictRegex(district) {
  const normalizedDistrict = normalizeText(district);
  const aliases = NORMALIZED_DISTRICT_ALIAS_MAP[normalizedDistrict] || [
    normalizedDistrict,
  ];

  const pattern = Array.from(new Set(aliases))
    .map((alias) => buildVietnameseRegexPattern(alias))
    .filter(Boolean)
    .join("|");

  return new RegExp(pattern, "iu");
}

class ReportRepository {
  buildFilterQuery({ search, type, status, district }) {
    const query = {};

    if (type && type !== "all") {
      query.type = type;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (district && district !== "all") {
      query.location = { $regex: buildDistrictRegex(district) };
    }

    if (search) {
      const keyword = search.trim();

      const orQuery = [
        { id: { $regex: keyword, $options: "i" } },
        { title: { $regex: keyword, $options: "i" } },
      ];

      const numKeyword = Number(keyword);
      if (!isNaN(numKeyword)) {
        orQuery.push({ report_id: numKeyword });
      }

      query.$or = orQuery;
    }

    return query;
  }

  /**
   * Trang quản lý (admin)
   */
  async getManagementList({
    search,
    type,
    status,
    page = 1,
    limit = 10,
    view,
  }) {
    try {
      const query = this.buildFilterQuery({ search, type, status });
      const projection = view === "list" ? LIST_PROJECTION : undefined;

      const safePage = Math.max(parseInt(page, 10) || 1, 1);
      const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
      const skip = (safePage - 1) * safeLimit;

      const [items, total] = await Promise.all([
        Report.find(query, projection)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(safeLimit)
          .lean(),
        Report.countDocuments(query),
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
    } catch (error) {
      throw new Error(
        "Lỗi khi lấy danh sách quản lý báo cáo: " + error.message,
      );
    }
  }

  /**
   * Trang đơn tiếp nhận (theo quận)
   */
  async getReceptionList({
    search,
    type,
    status,
    district,
    sortByDate = "recent",
    page = 1,
    limit = 10,
    view,
  }) {
    try {
      const query = this.buildFilterQuery({
        search,
        type,
        status,
        district,
      });

      const safePage = Math.max(parseInt(page, 10) || 1, 1);
      const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
      const skip = (safePage - 1) * safeLimit;
      const sortDirection = sortByDate === "old" ? 1 : -1;

      const pipeline = [
        { $match: query },
        {
          $addFields: {
            resolvedOrder: {
              $cond: {
                if: { $eq: ["$status", "Đã Giải Quyết"] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      ];

      pipeline.push({ $sort: { resolvedOrder: 1, createdAt: sortDirection } });

      if (view === "list") {
        pipeline.push({
          $project: {
            _id: 1,
            id: 1,
            report_id: 1,
            title: 1,
            type: 1,
            location: 1,
            status: 1,
            time: 1,
            image: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        });
      }

      pipeline.push({ $skip: skip }, { $limit: safeLimit });

      const [items, total] = await Promise.all([
        Report.aggregate(pipeline),
        Report.countDocuments(query),
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
    } catch (error) {
      throw new Error("Lỗi khi lấy danh sách đơn tiếp nhận: " + error.message);
    }
  }

  async getAll() {
    try {
      return await Report.find({}).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error("Lỗi khi lấy danh sách báo cáo: " + error.message);
    }
  }

  async getById(id) {
    try {
      const queryConditions = [{ id }, { report_id: id }];
      const numericId = Number(id);
      if (!Number.isNaN(numericId)) {
        queryConditions.push({ report_id: numericId });
      }

      if (typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id)) {
        queryConditions.push({ _id: id });
      }

      return await Report.findOne({ $or: queryConditions }).lean();
    } catch (error) {
      throw new Error("Lỗi khi lấy báo cáo: " + error.message);
    }
  }

  async getByUserId(userId, view) {
    try {
      const projection = view === "list" ? LIST_PROJECTION : undefined;
      const normalizedUserId = userId !== undefined ? String(userId) : "";
      const numericUserId = Number(userId);
      const queryConditions = [];

      if (normalizedUserId) {
        queryConditions.push({ userId: normalizedUserId });
      }

      if (Number.isInteger(numericUserId)) {
        queryConditions.push({ user_id: numericUserId });
      }

      const query = queryConditions.length > 0 ? { $or: queryConditions } : {};

      return await Report.find(query, projection)
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      throw new Error("Lỗi khi lấy báo cáo của user: " + error.message);
    }
  }

  async create(reportData) {
    try {
      const report = new Report(reportData);
      return await report.save();
    } catch (error) {
      throw new Error("Lỗi khi tạo báo cáo: " + error.message);
    }
  }

  async updateStatus(id, status) {
    try {
      return await Report.findOneAndUpdate(
        { $or: [{ id }, { report_id: id }] },
        { status },
        { new: true },
      );
    } catch (error) {
      throw new Error("Lỗi khi cập nhật trạng thái báo cáo: " + error.message);
    }
  }
}

module.exports = new ReportRepository();
