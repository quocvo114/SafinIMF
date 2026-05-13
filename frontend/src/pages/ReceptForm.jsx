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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { reportApi } from "../services/api/reportApi";
import { areaApi } from "../services/api/areaApi";
import { maintenanceTeamApi } from "../services/api/maintenanceTeamApi";
import ReportDetailQLKV from "../components/ReportDetail-QLKV";
import AssignMaintenanceTeam from "../components/AssignMaintenanceTeam";
import Update_Status from "../components/Update_Status";
import incidentApi from "../services/api/incidentApi";
import { toast } from "sonner";

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
  Điện: "#fdca00",
  "Cây Xanh": "#16a34a",
  CTCC: "#b78ff2",
};

const getStatusConfig = (status) => {
  switch (status) {
    case "Đang Chờ":
      return {
        bg: "bg-amber-500/30",
        border: "border-amber-500/50",
        color: "text-amber-300",
        dot: "bg-amber-400",
      };
    case "Đang Xử Lý":
      return {
        bg: "bg-blue-500/30",
        border: "border-blue-500/50",
        color: "text-blue-300",
        dot: "bg-blue-400",
      };
    case "Đã Giải Quyết":
      return {
        bg: "bg-emerald-500/30",
        border: "border-emerald-500/50",
        color: "text-emerald-300",
        dot: "bg-emerald-400",
      };
    default:
      return {
        bg: "bg-gray-500/30",
        border: "border-gray-500/50",
        color: "text-gray-300",
        dot: "bg-gray-400",
      };
  }
};

const getCategoryConfig = (category) => {
  switch (category) {
    case "Giao Thông":
      return {
        bg: "bg-orange-500/30",
        border: "border-orange-500/50",
        color: "text-orange-300",
        dot: "bg-orange-400",
      };
    case "Điện":
      return {
        bg: "bg-yellow-500/30",
        border: "border-yellow-500/50",
        color: "text-yellow-300",
        dot: "bg-yellow-400",
      };
    case "Cây Xanh":
      return {
        bg: "bg-green-500/30",
        border: "border-green-500/50",
        color: "text-green-300",
        dot: "bg-green-400",
      };
    case "CTCC":
      return {
        bg: "bg-purple-500/30",
        border: "border-purple-500/50",
        color: "text-purple-300",
        dot: "bg-purple-400",
      };
    default:
      return {
        bg: "bg-slate-500/30",
        border: "border-slate-500/50",
        color: "text-slate-300",
        dot: "bg-slate-400",
      };
  }
};

const STATUS_FLOW = ["Đang Chờ", "Đang Xử Lý", "Đã Giải Quyết"];

function mapMaintenanceTeamsToAssignOptions(teams = []) {
  return teams
    .map((team) => {
      const teamId = team?.team_id || team?.id;
      if (!teamId) return null;

      const rawCases =
        team?.cases ??
        team?.caseCount ??
        team?.currentCases ??
        team?.assignedCount ??
        0;
      const rawMaxCases =
        team?.maxCases ?? team?.capacity ?? team?.max_cases ?? 5;

      const cases = Number.isFinite(Number(rawCases)) ? Number(rawCases) : 0;
      const maxCases = Number.isFinite(Number(rawMaxCases))
        ? Number(rawMaxCases)
        : 5;

      return {
        id: teamId,
        name: team?.name || "Đội xử lý",
        status: team?.status || "active",
        specialty:
          team?.specialty ||
          team?.field ||
          team?.domain ||
          team?.area ||
          "Chưa rõ lĩnh vực",
        distance: team?.distance || "--",
        cases,
        maxCases: Math.max(maxCases, 1),
      };
    })
    .filter(Boolean);
}

function getNextStatus(currentStatus) {
  const index = STATUS_FLOW.indexOf(currentStatus);

  if (index < 0 || index >= STATUS_FLOW.length - 1) {
    return null;
  }

  return STATUS_FLOW[index + 1];
}

const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/c_fill,w_500,h_400,q_auto,f_auto/");
};

const ReceptForm = () => {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [assigningReport, setAssigningReport] = useState(null);
  const [assignTeams, setAssignTeams] = useState(null);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [assigningError, setAssigningError] = useState("");

  // State cho modal cập nhật trạng thái
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [updateReportData, setUpdateReportData] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("all");
  const [searchAreaQuery, setSearchAreaQuery] = useState("");
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState([]);

  useEffect(() => {
    const fetchIncidentTypes = async () => {
      try {
        const response = await incidentApi.getIncidentTypes();
        if (response?.success && Array.isArray(response.data)) {
          setIncidentTypes(response.data);
        }
      } catch (error) {
        console.error("Failed to load incident types", error);
      }
    };
    fetchIncidentTypes();
  }, []);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await areaApi.getAllAreas();
        if (response.data?.success) {
          setAreas(response.data.data || []);
        }
      } catch (error) {
        // ✅ Cleanup: Error handling silenced
      }
    };
    fetchAreas();
  }, []);

  const pageSize = 6;

  useEffect(() => {
    const fetchReceptionReports = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await reportApi.getReceptionReports({
          search: query,
          type: typeFilter,
          status: statusFilter,
          district: selectedArea,
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
          error?.response?.data?.message ||
            "Không tải được dữ liệu đơn tiếp nhận",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReceptionReports();
  }, [query, typeFilter, statusFilter, dateFilter, page, selectedArea]);

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
        description:
          selectedReport.description || "Chưa có mô tả cho báo cáo này.",
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
          Array.isArray(selectedReport.images) &&
          selectedReport.images.length > 0
            ? selectedReport.images
            : [selectedReport.image || "", selectedReport.afterImg || ""],
      }
    : null;

  const handleCloseDetail = () => setSelectedReport(null);

  const syncReportStatus = (reportId, nextStatus, assignedTeamName) => {
    const teamPatch = assignedTeamName
      ? { team: assignedTeamName, handlerTeam: assignedTeamName }
      : {};

    setReports((prev) =>
      prev.map((item) => {
        const itemId = item.id || item.report_id;
        return itemId === reportId
          ? { ...item, status: nextStatus, ...teamPatch }
          : item;
      }),
    );

    setSelectedReport((prev) =>
      prev && (prev.id || prev.report_id) === reportId
        ? { ...prev, status: nextStatus, ...teamPatch }
        : prev,
    );
  };

  const handleUpdateStatus = async (report) => {
    const reportId = report?.report_id || report?.id;
    if (!reportId) {
      // ✅ Cleanup: Debug logging removed
      return;
    }
    // ✅ Cleanup: Debug logging removed
    setUpdateReportData(report);
    setShowUpdateStatusModal(true);
    setSelectedReport(null); // Đóng detail modal
  };

  const handleConfirmUpdateStatus = async (reportId, newStatus) => {
    try {
      setUpdatingStatus(true);
      // ✅ Cleanup: Status update logging removed
      const response = await reportApi.updateReportStatus(reportId, newStatus);

      const fetchResponse = await reportApi.getReceptionReports({
        search: query,
        type: typeFilter,
        status: "all",
        district: selectedArea,
        date: dateFilter === "old" ? "old" : "recent",
        page: 1,
        limit: 6,
      });
      
      if (fetchResponse?.data) {
        // ✅ Cleanup: Fetch logging removed
        setReports(fetchResponse.data);
        setTotalPages(fetchResponse?.pagination?.totalPages || 1);
        setPage(1);
        setStatusFilter("all");
      }

      // Cập nhật selectedReport
      const updatedReport = updateReportData
        ? { ...updateReportData, status: newStatus }
        : null;
      setSelectedReport(updatedReport);

      setShowUpdateStatusModal(false);
      setUpdateReportData(null);
      setErrorMessage("");
      
      if (typeof toast !== 'undefined' && toast?.success) {
        toast.success("Cập nhật trạng thái thành công!");
      }
    } catch (error) {
      // ✅ Cleanup: Error logging removed
      const errorMsg = 
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật trạng thái báo cáo";
      
      setErrorMessage(errorMsg);
      
      if (typeof toast !== 'undefined' && toast?.error) {
        toast.error(errorMsg);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendProcess = async (report) => {
    if (!report) {
      return;
    }

    setSelectedReport(null);
    setAssigningReport(report);
    setAssignTeams(null);
    setAssigningLoading(false);
    setAssigningError("");

    try {
      const response = await maintenanceTeamApi.getTeams({
        page: 1,
        limit: 50,
        status: "active",
      });
      setAssignTeams(mapMaintenanceTeamsToAssignOptions(response?.data || []));
    } catch (error) {
      setAssignTeams(null);
    }
  };

  const handleCloseAssignTeam = () => {
    setAssigningReport(null);
    setAssignTeams(null);
  };

  const handleCancelAssignTeam = () => {
    if (assigningReport) {
      setSelectedReport(assigningReport);
    }
    handleCloseAssignTeam();
  };

  const handleAssignTeam = async (team) => {
    const reportId =
      assigningReport?.id ||
      assigningReport?.report_id ||
      assigningReport?._id;
    if (!reportId) {
      return;
    }

    if (!team?.id) {
      toast.error("Thiếu thông tin đội xử lý.");
      return;
    }

    try {
      await reportApi.assignReport(reportId, {
        teamId: team?.id,
        teamName: team?.name,
      });
      syncReportStatus(reportId, "Đang Xử Lý", team?.name);
      handleCloseAssignTeam();
      toast.success("Phân công thành công!");
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || "Không thể gửi xử lý báo cáo",
      );
      toast.error(
        error?.response?.data?.message || "Không thể gửi xử lý báo cáo",
      );
    }
  };

  return (
    <div className="flex h-full w-full flex-col rounded-[22px] border border-gray-200 bg-white p-3 sm:p-4">
      <div className="mb-3 shrink-0 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-[400px]">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#969696]" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm theo mã sự cố, tiêu đề..."
            className="h-[45px] w-full rounded-full border border-[#dfe3e8] bg-[#f5f5f5] pl-12 text-sm text-gray-700 placeholder:text-[#969696] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] focus-visible:border-[#cdd5df] focus-visible:ring-2 focus-visible:ring-[#e8ecf1] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover open={isAreaOpen} onOpenChange={setIsAreaOpen}>
            <PopoverTrigger asChild>
              <button className="flex !h-[45px] w-[145px] shrink-0 items-center justify-between rounded-[10px] border border-[#dfe3e8] bg-white px-[15px] py-0 text-sm font-normal text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:bg-gray-50 focus-visible:border-[#cdd5df] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors data-[state=open]:bg-white">
                <span className="truncate text-left flex-1">
                  {selectedArea === "all"
                    ? "Phường/Xã"
                    : areas.find((a) => a.name === selectedArea)?.name ||
                      "Phường/Xã"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-down opacity-50 shrink-0 ml-2 h-4 w-4"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[200px] p-2 bg-white border border-gray-200 shadow-xl rounded-xl z-50"
              align="end"
            >
              <Input
                placeholder="Tìm phường/xã..."
                value={searchAreaQuery}
                onChange={(e) => setSearchAreaQuery(e.target.value)}
                className="mb-2 h-9 text-sm rounded-md"
              />
              <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                <div
                  className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors ${selectedArea === "all" ? "bg-gray-100 font-medium" : ""}`}
                  onClick={() => {
                    setSelectedArea("all");
                    setIsAreaOpen(false);
                    setPage(1);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`mr-2 h-4 w-4 lucide lucide-check ${selectedArea === "all" ? "opacity-100" : "opacity-0"}`}
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Tất cả phường/xã
                </div>
                {areas
                  .filter((a) =>
                    removeAccents(a.name).includes(
                      removeAccents(searchAreaQuery),
                    ),
                  )
                  .map((area) => (
                    <div
                      key={area.area_id}
                      className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors ${selectedArea === area.name ? "bg-gray-100 font-medium" : ""}`}
                      onClick={() => {
                        setSelectedArea(area.name);
                        setIsAreaOpen(false);
                        setPage(1);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`mr-2 h-4 w-4 lucide lucide-check ${selectedArea === area.name ? "opacity-100" : "opacity-0"}`}
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {area.name}
                    </div>
                  ))}
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="flex !h-[45px] w-[145px] shrink-0 items-center justify-between rounded-[10px] border border-[#dfe3e8] bg-[#f5f5f5] px-[15px] py-0 text-sm font-normal text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:bg-white focus-visible:border-[#cdd5df] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors data-[state=open]:bg-white [&>span]:truncate [&>span]:text-left [&>span]:flex-1 [&>svg]:opacity-50">
              <SelectValue placeholder="Loại sự cố" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden"
            >
              <SelectItem
                value="all"
                className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
              >
                Loại sự cố
              </SelectItem>
              {incidentTypes.map((type) => (
                <SelectItem
                  key={type._id || type.name}
                  value={type.name}
                  className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
                >
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="flex !h-[45px] w-[145px] shrink-0 items-center justify-between rounded-[10px] border border-[#dfe3e8] bg-[#f5f5f5] px-[15px] py-0 text-sm font-normal text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:bg-white focus-visible:border-[#cdd5df] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors data-[state=open]:bg-white [&>span]:truncate [&>span]:text-left [&>span]:flex-1 [&>svg]:opacity-50">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden"
            >
              <SelectItem
                value="all"
                className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
              >
                Trạng thái
              </SelectItem>
              {STATUS_OPTIONS.filter((option) => option !== "all").map(
                (option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
                  >
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
            <SelectTrigger className="flex !h-[45px] w-[145px] shrink-0 items-center justify-between rounded-[10px] border border-[#dfe3e8] bg-[#f5f5f5] px-[15px] py-0 text-sm font-normal text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:bg-white focus-visible:border-[#cdd5df] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors data-[state=open]:bg-white [&>span]:truncate [&>span]:text-left [&>span]:flex-1 [&>svg]:opacity-50">
              <SelectValue placeholder="Chọn ngày" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden"
            >
              <SelectItem
                value="all"
                className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
              >
                Chọn ngày
              </SelectItem>
              <SelectItem
                value="recent"
                className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
              >
                Mới nhất
              </SelectItem>
              <SelectItem
                value="old"
                className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
              >
                Cũ hơn
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide pb-2">
        <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <div className="col-span-full rounded-[20px] border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          )}

          {!loading &&
            visibleReports.map((report, index) => {
              const category = report.category || report.type || "CTCC";
              const imageUrl = optimizeCloudinaryUrl(report.image || roadImage);
              const date = report.date || report.time || "-";

              return (
                <div
                  key={`${report.id || report.report_id}-${report.location}-${index}`}
                  className="group relative h-[210px] xl:h-[224px] cursor-pointer overflow-hidden rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ring-1 ring-black/5"
                  onClick={async () => {
                    const reportId =
                      report?.id || report?.report_id || report?._id;
                    setSelectedReport(report);

                    if (!reportId) return;

                    try {
                      const response = await reportApi.getReportById(reportId);
                      if (response?.success && response?.data) {
                        setSelectedReport(response.data);
                      }
                    } catch (error) {
                      console.error("Không thể tải chi tiết báo cáo:", error);
                    }
                  }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="absolute left-4 right-4 top-4 flex items-center justify-between z-10">
                    <div className="flex shrink-0 items-center rounded-full bg-black/40 px-3 py-1 backdrop-blur-md border border-white/20 shadow-sm transition-colors group-hover:bg-black/50">
                      <span className="text-[11px] font-bold tracking-wider text-white/95">
                        {report.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md border shadow-sm transition-all group-hover:brightness-110 ${getStatusConfig(report.status).bg} ${getStatusConfig(report.status).border}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shadow-[0_0_4px_currentColor] ${getStatusConfig(report.status).dot}`}
                        />
                        <span
                          className={`text-[11px] font-bold tracking-wide ${getStatusConfig(report.status).color}`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <div
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md border shadow-sm transition-all group-hover:brightness-110 ${getCategoryConfig(category).bg} ${getCategoryConfig(category).border}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shadow-[0_0_4px_currentColor] ${getCategoryConfig(category).dot}`}
                        />
                        <span
                          className={`text-[11px] font-bold tracking-wide capitalize ${getCategoryConfig(category).color}`}
                        >
                          {String(category).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 z-10">
                    <h3 className="text-[15px] font-bold leading-snug text-white/95 line-clamp-2 drop-shadow-md transition-transform duration-300 group-hover:translate-x-1">
                      {report.title}
                    </h3>

                    <div className="flex flex-col gap-1.5 text-[12px] font-medium text-white/80 transition-all duration-300 group-hover:translate-x-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-white/60" />
                        <span className="truncate drop-shadow-sm">
                          {report.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-white/60" />
                        <span className="drop-shadow-sm">{date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {!loading && visibleReports.length === 0 && (
          <div className="mt-4 rounded-[20px] border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500">
            Không có đơn tiếp nhận phù hợp.
          </div>
        )}
      </div>

      <div className="mt-2 shrink-0 flex items-center justify-center gap-2 pt-2 text-sm font-semibold text-[#4b4b4b]">
        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-[#f5f5f5] hover:text-black transition-colors"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={safePage === 1}
        >
          Trước
        </button>

        {pageNumbers[0] > 1 && (
          <>
            <button
              type="button"
              className="h-7 min-w-7 rounded-[6px] px-2 transition-colors hover:bg-[#f5f5f5]"
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
            className={`h-7 min-w-7 rounded-[6px] px-2 transition-colors ${
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
              className="h-7 min-w-7 rounded-[6px] px-2 transition-colors hover:bg-[#f5f5f5]"
              onClick={() => setPage(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="rounded-md px-2 py-1 hover:bg-[#f5f5f5] hover:text-black transition-colors"
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

      <Update_Status
        isOpen={showUpdateStatusModal}
        reportId={updateReportData?.report_id || updateReportData?.id}
        reportCode={updateReportData?.id || updateReportData?.report_id}
        currentStatus={updateReportData?.status || "Đang Chờ"}
        onClose={() => {
          setShowUpdateStatusModal(false);
          setUpdateReportData(null);
          // Mở lại detail modal
          if (updateReportData) setSelectedReport(updateReportData);
        }}
        onUpdate={handleConfirmUpdateStatus}
        loading={updatingStatus}
      />

      <AssignMaintenanceTeam
        open={Boolean(assigningReport)}
        reportCode={
          assigningReport?.id || assigningReport?.report_id || "BCGT3101"
        }
        reportType={assigningReport?.type || assigningReport?.category}
        teams={assignTeams ?? []}
        onClose={handleCloseAssignTeam}
        onCancel={handleCancelAssignTeam}
        onAssign={handleAssignTeam}
        isSubmitting={assigningLoading}
        errorMessage={assigningError}
      />

      <Update_Status
        isOpen={showUpdateStatusModal}
        reportId={updateReportData?.id || updateReportData?.report_id}
        reportCode={updateReportData?.id}
        currentStatus={updateReportData?.status}
        onClose={() => {
          setShowUpdateStatusModal(false);
          setUpdateReportData(null);
        }}
        onUpdate={handleConfirmUpdateStatus}
        loading={updatingStatus}
      />
    </div>
  );
};

export default ReceptForm;
