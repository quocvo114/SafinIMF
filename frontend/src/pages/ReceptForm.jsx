import React, { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Search } from "lucide-react";
import roadImage from "../image/road.png";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportApi } from "../services/api/reportApi";
import ReportDetailQLKV from "../components/ReportDetail-QLKV";

const DISTRICTS = [
  "all",
  "Hải Châu",
  "Sơn Trà",
  "Liên Chiểu",
  "Hoàng Sa",
  "Thanh Khê",
  "Ngũ Hành Sơn",
  "Cẩm Lệ",
  "Hòa Vang",
];

const TYPE_OPTIONS = ["all", "Giao Thông", "Điện", "Cây Xanh", "CTCC"];
const STATUS_OPTIONS = ["all", "Đang Chờ", "Đang Xử Lý", "Đã Giải Quyết"];

const CATEGORY_COLORS = {
  "Giao Thông": "#f97316",
  "Điện": "#fdca00",
  "Cây Xanh": "#16a34a",
  CTCC: "#b78ff2",
};

const STATUS_FLOW = ["Đang Chờ", "Đang Xử Lý", "Đã Giải Quyết"];

function getNextStatus(currentStatus) {
  const index = STATUS_FLOW.indexOf(currentStatus);

  if (index < 0 || index >= STATUS_FLOW.length - 1) {
    return null;
  }

  return STATUS_FLOW[index + 1];
}

const ReceptForm = () => {
  const [activeDistrict, setActiveDistrict] = useState("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // const [page, setPage] = useState(2);
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    return reports.filter((item) => {
      const byDistrict = item.district === activeDistrict;
      const byType = typeFilter === "all" || item.category === typeFilter;
      const byStatus = statusFilter === "all" || item.status === statusFilter;
      const byDate =
        dateFilter === "all" ||
        (dateFilter === "recent" && item.date === "24/11/2025") ||
        (dateFilter === "old" && item.date !== "24/11/2025");

      const haystack = `${item.id} ${item.title}`.toLowerCase();
      const bySearch = !searchTerm || haystack.includes(searchTerm);

      return byDistrict && byType && byStatus && byDate && bySearch;
    });
  }, [activeDistrict, query, typeFilter, statusFilter, dateFilter]);

  const pageSize = 6;

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await reportApi.getReceptionReports({
          search: query,
          type: typeFilter,
          status: statusFilter,
          district: activeDistrict,
          date: dateFilter === "old" ? "old" : "recent",
          page,
          limit: pageSize,
        });

        setReports(response?.data || []);
        setTotalPages(response?.pagination?.totalPages || 1);
      } catch (error) {
        setReports([]);
        setTotalPages(1);
        setErrorMessage(
          error?.response?.data?.message || "Không tải được dữ liệu đơn tiếp nhận"
        );
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [activeDistrict, query, typeFilter, statusFilter, dateFilter, page]);

  const safePage = Math.min(page, totalPages);
  const visibleReports = reports;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const adjustedStart = Math.max(1, end - maxVisible + 1);

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, index) => adjustedStart + index,
    );
  }, [safePage, totalPages]);

  const detailData = selectedReport
    ? {
        id: selectedReport.id || selectedReport.report_id || "N/A",
        report_id: selectedReport.report_id || selectedReport.id || "N/A",
        title: selectedReport.title,
        type: selectedReport.type || selectedReport.category,
        status: selectedReport.status || "Đang Chờ",
        time: selectedReport.time || selectedReport.date,
        district: selectedReport.district || "Chưa phân loại",
        team: selectedReport.team || selectedReport.handlerTeam,
        reporter: selectedReport.reporter,
        location: selectedReport.location || "Chưa có vị trí",
        description: selectedReport.description || "Chưa có mô tả cho báo cáo này.",
        lat: selectedReport.lat,
        lng: selectedReport.lng,
        reportLatitude: selectedReport.reportLatitude,
        reportLongitude: selectedReport.reportLongitude,
        confidenceScore: selectedReport.confidenceScore,
        scoringDetails: selectedReport.scoringDetails,
        image: selectedReport.image || selectedReport.images?.[0] || "",
        afterImg: selectedReport.afterImg || "",
        progressNote: selectedReport.progressNote || "",
        images:
          Array.isArray(selectedReport.images) && selectedReport.images.length > 0
            ? selectedReport.images
            : [selectedReport.image || "", selectedReport.afterImg || ""],
      }
    : null;

  const handleCloseDetail = () => setSelectedReport(null);

  const syncReportStatus = (reportId, nextStatus) => {
    setReports((prev) =>
      prev.map((item) => {
        const itemId = item.id || item.report_id;
        return itemId === reportId ? { ...item, status: nextStatus } : item;
      }),
    );

    setSelectedReport((prev) =>
      prev ? { ...prev, status: nextStatus } : prev,
    );
  };

  const handleUpdateStatus = async (report) => {
    const reportId = report?.report_id || report?.id;
    if (!reportId) {
      return;
    }

    const nextStatus = getNextStatus(report?.status);
    if (!nextStatus) {
      return;
    }

    try {
      await reportApi.updateReportStatus(reportId, nextStatus);
      syncReportStatus(reportId, nextStatus);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || "Không thể cập nhật trạng thái báo cáo",
      );
    }
  };

  const handleSendProcess = async (report) => {
    const reportId = report?.report_id || report?.id;
    if (!reportId) {
      return;
    }

    try {
      await reportApi.updateReportStatus(reportId, "Đang Xử Lý");
      syncReportStatus(reportId, "Đang Xử Lý");
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || "Không thể gửi xử lý báo cáo",
      );
    }
  };

  return (
    <div className="min-h-full rounded-[22px] border border-gray-200 bg-white p-3 sm:p-4 flex flex-col">
      <Tabs
        value={activeDistrict}
        onValueChange={(value) => {
          setActiveDistrict(value);
          setPage(1);
        }}
        className="mb-2.5"
      >
        <div className="overflow-x-auto rounded-[16px] border border-[#e9e9e9] bg-[#f1f1f1] p-2 shadow-[0_6px_18px_rgba(0,0,0,0.08)] scrollbar-hide">
          <TabsList
            style={{
              display: "inline-flex",
              width: "max-content",
              justifyContent: "flex-start",
              gap: "40px",
            }}
            className="h-auto min-w-max bg-transparent p-0"
          >
            {DISTRICTS.map((district) => (
              <TabsTrigger
                key={district}
                value={district}
                style={{ flex: "0 0 auto", width: "fit-content" }}
                className="h-[40px] !flex-none !basis-auto w-auto min-w-fit whitespace-nowrap rounded-[14px] border-none px-8 text-[15px] font-medium text-[#9a9a9a] transition-all duration-200 hover:text-[#6f6f6f] data-[state=active]:!bg-[#1243ff] data-[state=active]:!text-white data-[state=active]:!font-semibold data-[state=active]:!shadow-[0_6px_14px_rgba(18,67,255,0.35)]"
              >
                {district === "all" ? "Tất cả" : district}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="mb-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-[541px]">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#969696]" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm theo mã sự cố, tiêu đề sự cố..."
            className="h-[45px] rounded-full border border-[#dfe3e8] bg-[#f5f5f5] pl-12 text-sm text-gray-700 placeholder:text-[#969696] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] focus-visible:border-[#cdd5df] focus-visible:ring-2 focus-visible:ring-[#e8ecf1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-[45px] rounded-[10px] border border-[#dfe3e8] bg-[#f5f5f5] px-[15px] text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] focus-visible:border-[#cdd5df] focus-visible:ring-2 focus-visible:ring-[#e8ecf1]">
              <SelectValue placeholder="Loại sự cố" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Loại sự cố</SelectItem>
              <SelectItem value="Giao Thông">Giao thông</SelectItem>
              <SelectItem value="Điện">Điện</SelectItem>
              <SelectItem value="Cây Xanh">Cây xanh</SelectItem>
              <SelectItem value="CTCC">CTCC</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-[45px] rounded-[10px] border border-[#dfe3e8] bg-[#f5f5f5] px-[15px] text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] focus-visible:border-[#cdd5df] focus-visible:ring-2 focus-visible:ring-[#e8ecf1]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Trạng thái</SelectItem>
              {STATUS_OPTIONS.filter((option) => option !== "all").map(
                (option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Select
            value={dateFilter}
            onValueChange={(value) => {
              setDateFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-[44px] min-w-[146px] rounded-[12px] border border-[#dfe3e8] bg-[#f5f5f5] px-[15px] text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] focus-visible:border-[#cdd5df] focus-visible:ring-2 focus-visible:ring-[#e8ecf1]">
              <SelectValue placeholder="Chọn ngày" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Chọn ngày</SelectItem>
              <SelectItem value="recent">Mới nhất</SelectItem>
              <SelectItem value="old">CÅ© hÆ¡n</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="relative z-10 mb-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full rounded-[20px] border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        )}

        {!loading &&
          visibleReports.map((report, index) => {
            const category = report.category || report.type || "CTCC";
            const imageUrl = report.image || roadImage;
            const date = report.date || report.time || "-";

            return (
          <div
            key={`${report.id || report.report_id}-${report.location}-${index}`}
            className="relative h-[214px] cursor-pointer overflow-hidden rounded-[22px]"
            onClick={() => setSelectedReport(report)}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/65" />

            <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
              <div className="rounded-full bg-white px-4 py-1 text-[11px] font-semibold text-[#424242]">
                {report.id}
              </div>
              <div
                className="rounded-full px-4 py-1 text-[11px] font-medium text-white"
                style={{
                  backgroundColor:
                    CATEGORY_COLORS[category] || "#64748b",
                }}
              >
                {String(category).toLowerCase()}
              </div>
            </div>

            <div className="absolute bottom-[82px] left-1/2 flex -translate-x-1/2 items-center gap-1">
              <span className="h-[6px] w-[6px] rounded-full bg-white" />
              <span className="h-[6px] w-[6px] rounded-full bg-white/50" />
              <span className="h-[6px] w-[6px] rounded-full bg-white/50" />
            </div>

            <div className="absolute bottom-3 left-4 right-4 text-white">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <h3 className="max-w-[210px] text-[14px] font-semibold leading-tight capitalize">
                  {report.title}
                </h3>
                <div className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium lowercase leading-none">
                  {report.status}
                </div>
              </div>

              <div className="space-y-1 text-xs font-medium text-[#d7d7d7]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{report.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{date}</span>
                </div>
              </div>
            </div>
          </div>
            );
          })}
      </div>

      {!loading && visibleReports.length === 0 && (
        <div className="mb-6 rounded-[20px] border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500">
          Không có đơn tiếp nhận phù hợp.
        </div>
      )}

      <div className="mt-auto flex items-center justify-center gap-2 pb-0.5 text-sm font-semibold text-[#4b4b4b]">
        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-[#f5f5f5] hover:text-black"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={safePage === 1}
        >
          Trước
        </button>

        {pageNumbers[0] > 1 && (
          <>
            <button
              type="button"
              className="h-7 min-w-7 rounded-[6px] px-2"
              onClick={() => setPage(1)}
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="px-1">...</span>}
          </>
        )}

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={`h-7 min-w-7 rounded-[6px] px-2 ${
              safePage === pageNumber
                ? "bg-[#f5f5f5] text-black"
                : "hover:bg-[#f5f5f5]"
            }`}
            onClick={() => setPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-1">...</span>
            )}
            <button
              type="button"
              className="h-7 min-w-7 rounded-[6px] px-2"
              onClick={() => setPage(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-[#f5f5f5] hover:text-black"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={safePage === totalPages}
        >
          Sau
        </button>
      </div>

      <ReportDetailQLKV
        data={detailData}
        close={handleCloseDetail}
        onUpdateStatus={handleUpdateStatus}
        onSendProcess={handleSendProcess}
      />
    </div>
  );
};

export default ReceptForm;
