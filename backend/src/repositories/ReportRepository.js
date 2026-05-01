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
  a: "[a\\u00e0\\u00e1\\u1ea1\\u1ea3\\u00e3\\u00e2\\u1ea7\\u1ea5\\u1ead\\u1ea9\\u1eab\\u0103\\u1eb1\\u1eaf\\u1eb7\\u1eb3\\u1eb5]",
  d: "[d\\u0111]",
  e: "[e\\u00e8\\u00e9\\u1eb9\\u1ebb\\u1ebd\\u00ea\\u1ec1\\u1ebf\\u1ec7\\u1ec3\\u1ec5]",
  i: "[i\\u00ec\\u00ed\\u1ecb\\u1ec9\\u0129]",
  o: "[o\\u00f2\\u00f3\\u1ecd\\u1ecf\\u00f5\\u00f4\\u1ed3\\u1ed1\\u1ed9\\u1ed5\\u1ed7\\u01a1\\u1edd\\u1edb\\u1ee3\\u1edf\\u1ee1]",
  u: "[u\\u00f9\\u00fa\\u1ee5\\u1ee7\\u0169\\u01b0\\u1eeb\\u1ee9\\u1ef1\\u1eed\\u1eef]",
  y: "[y\\u1ef3\\u00fd\\u1ef5\\u1ef7\\u1ef9]",
};

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const NORMALIZED_DISTRICT_ALIAS_MAP = Object.entries(DISTRICT_ALIAS_MAP).reduce(
  (accumulator, [district, aliases]) => {
    accumulator[normalizeText(district)] = aliases.map((alias) => normalizeText(alias));
    return accumulator;
  },
  {}
);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildVietnameseRegexPattern(value = "") {
  const normalized = normalizeText(value);

  return normalized
    .split("")
    .map((character) => {
      if (character === " ") {
        return "\\s+";
      }

      if (VIETNAMESE_CHAR_CLASS_MAP[character]) {
        return VIETNAMESE_CHAR_CLASS_MAP[character];
      }

      return escapeRegex(character);
    })
    .join("");
}

function buildDistrictRegex(district) {
  const normalizedDistrict = normalizeText(district);
  const aliases = NORMALIZED_DISTRICT_ALIAS_MAP[normalizedDistrict] || [normalizedDistrict];
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
      query.$or = [
        { id: { $regex: keyword, $options: "i" } },
        { report_id: { $regex: keyword, $options: "i" } },
        { title: { $regex: keyword, $options: "i" } },
      ];
    }

    return query;
  }

  /**
   * Lấy báo cáo cho trang quản lý (có lọc + phân trang)
   */
  async getManagementList({ search, type, status, page = 1, limit = 10 }) {
    try {
      const query = this.buildFilterQuery({ search, type, status });

      const safePage = Math.max(parseInt(page, 10) || 1, 1);
      const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
      const skip = (safePage - 1) * safeLimit;

      const [items, total] = await Promise.all([
        Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
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
      throw new Error("Lỗi khi lấy danh sách quản lý báo cáo: " + error.message);
    }
  }

  /**
   * Lấy báo cáo cho trang đơn tiếp nhận (lọc theo quận/huyện + phân trang)
   */
  async getReceptionList({
    search,
    type,
    status,
    district,
    sortByDate = "recent",
    page = 1,
    limit = 10,
  }) {
    try {
      const query = this.buildFilterQuery({ search, type, status, district });

      const safePage = Math.max(parseInt(page, 10) || 1, 1);
      const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
      const skip = (safePage - 1) * safeLimit;
      const sortDirection = sortByDate === "old" ? 1 : -1;

      const [items, total] = await Promise.all([
        Report.find(query)
          .sort({ createdAt: sortDirection })
          .skip(skip)
          .limit(safeLimit),
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

  /**
   * Lấy tất cả báo cáo
   */
  async getAll() {
    try {
      return await Report.find({}).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error("Lỗi khi lấy danh sách báo cáo: " + error.message);
    }
  }
  async getById(id) {
    try {
      return await Report.findOne({ $or: [{ id }, { report_id: id }] });
    } catch (error) {
      throw new Error("Lỗi khi lấy báo cáo: " + error.message);
    }
  }

  /**
   * Lấy tất cả báo cáo của một user
   */
  async getByUserId(userId) {
    try {
      return await Report.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error("Lỗi khi lấy báo cáo của user: " + error.message);
    }
  }

  /**
   * Tạo báo cáo mới
   */
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
        { new: true }
      );
    } catch (error) {
      throw new Error("Lỗi khi cập nhật trạng thái báo cáo: " + error.message);
    }
  }
}

module.exports = new ReportRepository();
