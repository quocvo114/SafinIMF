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
  // Helper để build query tránh type casting errors
  buildIdQuery(id) {
    const queries = [];
    
    if (typeof id === 'string' && id.startsWith('RPT-')) {
      // ID dạng string "RPT-..."
      queries.push({ id: id });
    } else {
      // Thử convert thành number
      const numId = Number(id);
      if (!isNaN(numId)) {
        // Tìm cả report_id và id (nếu id cũng là number)
        queries.push({ report_id: numId });
        queries.push({ id: String(numId) });
      } else {
        // Nếu không phải number, tìm kiếm theo string ID
        queries.push({ id: String(id) });
      }
    }
    
    // Nếu có nhiều queries, dùng $or để tìm matching document
    if (queries.length > 1) {
      return { $or: queries };
    }
    
    return queries[0] || { id: String(id) };
  }

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
        { $sort: { resolvedOrder: 1, createdAt: sortDirection } },
        { $skip: skip },
        { $limit: safeLimit },
      ];

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
      const query = this.buildIdQuery(id);
      return await Report.findOne(query);
    } catch (error) {
      throw new Error("Lỗi khi lấy báo cáo: " + error.message);
    }
  }

  async getByUserId(userId) {
    try {
      return await Report.find({ userId }).sort({ createdAt: -1 });
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
      console.log(`\n🔄 [REPO-UPDATE-STATUS] Starting update...`);
      console.log(`   Query ID: ${id} (type: ${typeof id})`);
      console.log(`   New Status: ${status}`);
      
      const query = this.buildIdQuery(id);
      console.log(`   Query object: ${JSON.stringify(query)}`);

      const result = await Report.findOneAndUpdate(
        query,
        { status },
        { new: true },
      );

      if (result) {
        console.log(`✅ [REPO-UPDATE-STATUS] Update successful`);
        console.log(`   Matched ID field: ${result.id}`);
        console.log(`   Matched report_id: ${result.report_id}`);
        console.log(`   Updated status: ${result.status}`);
      } else {
        console.log(`❌ [REPO-UPDATE-STATUS] No document found to update`);
        console.log(`   Query used: ${JSON.stringify(query)}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ [REPO-UPDATE-STATUS] Error: ${error.message}`);
      throw new Error("Lỗi khi cập nhật trạng thái báo cáo: " + error.message);
    }
  }
}

module.exports = new ReportRepository();
