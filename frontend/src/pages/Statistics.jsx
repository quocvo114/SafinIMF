import React, { useEffect, useState } from "react";
import { Calendar, Download } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import statisticsApi from "../services/api/statisticsApi";

const Statistics = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [summary, setSummary] = useState({
    totalReports: 0,
    byArea: [],
    byStatus: [],
    byIncidentType: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const CHART_COLORS = [
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#ef4444",
    "#84cc16",
    "#0ea5e9",
  ];
  const TOP_AREA_LIMIT = 4;
  const STATUS_MAP = {
    waiting: "Đang Chờ",
    processing: "Đang Xử Lý",
    resolved: "Đã Giải Quyết",
  };
  const CATEGORY_MAP = {
    traffic: "Giao Thông",
    electric: "Điện",
    tree: "Cây Xanh",
    public: "Công Trình Công Cộng",
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    let isActive = true;

    const params = {
      timeFilter,
      status:
        statusFilter === "all"
          ? "all"
          : STATUS_MAP[statusFilter] || statusFilter,
      type:
        categoryFilter === "all"
          ? "all"
          : CATEGORY_MAP[categoryFilter] || categoryFilter,
    };

    if (timeFilter !== "all") {
      params.date = selectedDate.toISOString().split("T")[0];
    }

    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        setShowAllAreas(false);
        const data = await statisticsApi.getSummary(params);
        if (isActive) {
          setSummary(data);
        }
      } catch (error) {
        if (isActive) {
          setLoadError("Cannot load statistics data.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchSummary();
    return () => {
      isActive = false;
    };
  }, [selectedDate, timeFilter, statusFilter, categoryFilter]);

  const areaData = summary.byArea
    .filter((area) => area.name !== "Others" && area.name !== "Other areas")
    .map((area, index) => ({
      name: area.name,
      value: area.total,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const sortedAreaData = [...areaData].sort(
    (a, b) => b.value - a.value || a.name.localeCompare(b.name)
  );

  const limitedAreaData = showAllAreas
    ? sortedAreaData
    : sortedAreaData.slice(0, TOP_AREA_LIMIT);

  const otherAreaTotal = showAllAreas
    ? 0
    : sortedAreaData
        .slice(TOP_AREA_LIMIT)
        .reduce((sum, item) => sum + item.value, 0);

  const displayedAreaData =
    !showAllAreas && otherAreaTotal > 0
      ? [
          ...limitedAreaData,
          { name: "Other areas", value: otherAreaTotal, color: "#94a3b8" },
        ]
      : limitedAreaData;

  const statusData = summary.byStatus.map((status, index) => ({
    name: status.name,
    value: status.total,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const incidentData = summary.byIncidentType.map((incident, index) => ({
    name: incident.name,
    value: incident.total,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const totalReports = summary.totalReports || 0;

  const handleExportFile = () => {
    const exportData = {
      date: formatDate(selectedDate),
      timeFilter:
        timeFilter === "day"
          ? "Ngày"
          : timeFilter === "week"
            ? "Tuần"
            : "Tháng",
      totalReports,
      areaData,
      statusData,
      incidentData,
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `statistics-${selectedDate.toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─── Shared trigger class (khớp ReceptForm) ──────────────────────────────
  const selectTriggerBase =
    "flex !h-[45px] shrink-0 items-center justify-between rounded-[10px] border border-[#dfe3e8] bg-[#f5f5f5] px-[15px] py-0 text-sm font-normal text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:bg-white focus-visible:border-[#cdd5df] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors data-[state=open]:bg-white [&>span]:whitespace-nowrap [&>svg]:opacity-50 [&>svg]:shrink-0 [&>svg]:ml-2";

  const selectTriggerStatus = `${selectTriggerBase} w-auto min-w-[160px]`;
  const selectTriggerCategory = `${selectTriggerBase} w-auto min-w-[160px]`;

  const selectContentClass =
    "bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden";

  const selectItemClass =
    "cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto";

  return (
    <div className="h-full w-full bg-gray-100 px-2 py-2 sm:px-4 sm:py-2">
      <div className="h-full w-full rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col">

        {/* ── Header Controls ── */}
        <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

            {/* Left: Date picker + Time-filter tabs */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

              {/* Date picker — khớp style date trigger của ReceptForm */}
              <div className="relative">
                <div
                  className="flex items-center gap-2 !h-[45px] px-[15px] border border-[#dfe3e8] rounded-[10px] cursor-pointer hover:bg-gray-50 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-colors"
                  onClick={() => document.getElementById("datePicker").showPicker()}
                >
                  <Calendar size={18} className="text-gray-500 opacity-50" />
                  <span className="text-sm text-gray-700">{formatDate(selectedDate)}</span>
                </div>
                <input
                  id="datePicker"
                  type="date"
                  className="absolute opacity-0 pointer-events-none"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>

              {/* Time-filter tabs — giữ nguyên logic, đồng bộ height 45px + border style */}
              <div className="flex gap-2">
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "day", label: "Ngày" },
                  { value: "week", label: "Tuần" },
                  { value: "month", label: "Tháng" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTimeFilter(value)}
                    className={`!h-[45px] px-4 rounded-[10px] text-sm font-medium border transition-colors ${
                      timeFilter === value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-[#f5f5f5] text-gray-600 border-[#dfe3e8] hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Select filters + Export */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className={selectTriggerStatus}>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className={selectContentClass}>
                  <SelectItem value="all" className={selectItemClass}>
                    Tất cả trạng thái
                  </SelectItem>
                  <SelectItem value="waiting" className={selectItemClass}>
                    Đang Chờ
                  </SelectItem>
                  <SelectItem value="processing" className={selectItemClass}>
                    Đang Xử Lý
                  </SelectItem>
                  <SelectItem value="resolved" className={selectItemClass}>
                    Đã Giải Quyết
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Category filter */}
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className={selectTriggerCategory}>
                  <SelectValue placeholder="Tất Cả Các Loại" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className={selectContentClass}>
                  <SelectItem value="all" className={selectItemClass}>
                    Tất Cả Các Loại
                  </SelectItem>
                  <SelectItem value="traffic" className={selectItemClass}>
                    Giao Thông
                  </SelectItem>
                  <SelectItem value="electric" className={selectItemClass}>
                    Điện
                  </SelectItem>
                  <SelectItem value="tree" className={selectItemClass}>
                    Cây Xanh
                  </SelectItem>
                  <SelectItem value="public" className={selectItemClass}>
                    Công Trình Công Cộng
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Export button — khớp style button của ReceptForm */}
              <button
                onClick={handleExportFile}
                className="flex items-center justify-center gap-2 !h-[45px] px-[15px] border border-[#dfe3e8] rounded-[10px] hover:bg-gray-50 transition-colors text-sm font-medium bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] text-gray-700"
              >
                <span>Xuất File</span>
                <Download size={18} className="opacity-50" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Statistics Grid (không thay đổi) ── */}
        <div className="flex-1 min-h-0 px-3 sm:px-6 py-5">
          <div className="grid h-full grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
            {/* Số Lượng Đơn */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Số Lượng Đơn</h3>
              <p className="text-5xl font-bold text-gray-800">
                {isLoading ? "..." : totalReports}
              </p>
              {loadError ? (
                <p className="mt-2 text-sm text-red-500">{loadError}</p>
              ) : null}
            </div>

            {/* Khu Vực */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col min-h-0">
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Khu Vực</h3>
              <div className={`space-y-3 ${showAllAreas ? "max-h-44 overflow-y-auto pr-2" : ""}`}>
                {displayedAreaData.map((area, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-700 truncate">{area.name}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${area.name === "Other areas" ? "opacity-70" : ""}`}
                        style={{
                          width: `${(area.value / Math.max(...displayedAreaData.map((i) => i.value), 1)) * 100}%`,
                          backgroundColor: area.color,
                        }}
                      />
                    </div>
                    {area.name === "Other areas" ? (
                      <span className="text-xs text-gray-400">Grouped</span>
                    ) : null}
                  </div>
                ))}
              </div>
              {sortedAreaData.length > TOP_AREA_LIMIT ? (
                <button
                  type="button"
                  onClick={() => setShowAllAreas((prev) => !prev)}
                  className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 self-start"
                >
                  {showAllAreas ? "Show less" : "Show all"}
                </button>
              ) : null}
            </div>

            {/* Loại Trạng Thái */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Loại Trạng Thái</h3>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 min-h-0">
                <div className="w-full sm:w-1/2 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Loại Sự Cố */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-400 mb-4">Loại Sự Cố</h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={false} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                {incidentData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs text-gray-600 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;