const Area = require("../models/Area");
const IncidentType = require("../models/IncidentType");
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

function parseDateRange(dateValue, timeFilter) {
  if (!dateValue || !timeFilter || timeFilter === "all") {
    return null;
  }

  const base = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  let end = new Date(start);

  if (timeFilter === "week") {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  } else if (timeFilter === "month") {
    start.setDate(1);
    end = new Date(start);
    end.setMonth(start.getMonth() + 1);
  } else {
    end = new Date(start);
    end.setDate(start.getDate() + 1);
  }

  return { start, end };
}

class StatisticsController {
  async getSummary(req, res) {
    try {
      const { date, timeFilter, status, type } = req.query;
      const matchStage = {};

      if (status && status !== "all") {
        matchStage.status = status;
      }

      if (type && type !== "all") {
        matchStage.type = type;
      }

      const range = parseDateRange(date, timeFilter);
      if (range) {
        matchStage.createdAt = { $gte: range.start, $lt: range.end };
      }

      const [areas, incidentTypes] = await Promise.all([
        Area.find({}).select("name").sort({ name: 1 }).lean(),
        IncidentType.find({ active: true })
          .select("name")
          .sort({ name: 1 })
          .lean(),
      ]);

      const areaBranches = areas.map((area) => ({
        case: {
          $regexMatch: {
            input: "$location",
            regex: buildDistrictRegex(area.name),
          },
        },
        then: area.name,
      }));

      const [summaryResult] = await Report.aggregate([
        { $match: matchStage },
        {
          $facet: {
            totals: [{ $count: "total" }],
            status: [
              { $group: { _id: "$status", total: { $sum: 1 } } },
              { $project: { _id: 0, name: "$_id", total: 1 } },
              { $sort: { total: -1, name: 1 } },
            ],
            incident: [
              { $group: { _id: "$type", total: { $sum: 1 } } },
              { $project: { _id: 0, name: "$_id", total: 1 } },
              { $sort: { total: -1, name: 1 } },
            ],
            area: [
              {
                $addFields: {
                  areaName: {
                    $switch: {
                      branches: areaBranches,
                      default: "Others",
                    },
                  },
                },
              },
              { $group: { _id: "$areaName", total: { $sum: 1 } } },
              { $project: { _id: 0, name: "$_id", total: 1 } },
              { $sort: { total: -1, name: 1 } },
            ],
          },
        },
      ]);

      const totalResult = summaryResult?.totals || [];
      const statusResults = summaryResult?.status || [];
      const incidentResults = summaryResult?.incident || [];
      const areaResults = summaryResult?.area || [];

      const incidentCountMap = new Map(
        incidentResults.map((item) => [item.name, item.total]),
      );
      const byIncidentType = incidentTypes.map((item) => ({
        name: item.name,
        total: incidentCountMap.get(item.name) || 0,
      }));

      const areaCountMap = new Map(
        areaResults.map((item) => [item.name, item.total]),
      );

      const byArea = areas
        .map((area) => ({
          name: area.name,
          total: areaCountMap.get(area.name) || 0,
        }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

      if (areaCountMap.has("Others")) {
        byArea.push({
          name: "Others",
          total: areaCountMap.get("Others"),
        });
      }

      return res.status(200).json({
        totalReports: totalResult[0]?.total || 0,
        byArea,
        byStatus: statusResults,
        byIncidentType,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Cannot load dashboard statistics",
        error: error.message,
      });
    }
  }
}

module.exports = new StatisticsController();
