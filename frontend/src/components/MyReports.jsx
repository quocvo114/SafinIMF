import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Database,
  Clock3,
  Zap,
  ShieldCheck,
} from "lucide-react";
import ReportDetail from "../components/ReportDetail";
import ReportReviews from "../components/ReportReviews";
import UserSidebar from "../components/UserSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { reportApi } from "../services/api/reportApi";
import incidentApi from "../services/api/incidentApi";
import { useAuth } from "../context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STATUS_OPTIONS = ["all", "Đang Chờ", "Đang Xử Lý", "Đã Giải Quyết"];
const TYPE_LABELS = {
  all: "Tất cả",
  "Giao Thông": "Giao Thông",
  "Điện": "Điện",
  "Cây Xanh": "Cây Xanh",
  CTCC: "Công trình công cộng",
};
const TYPE_BADGE = {
  "Giao Thông": "bg-orange-100 text-orange-700",
  "Điện": "bg-yellow-100 text-yellow-700",
  "Cây Xanh": "bg-emerald-100 text-emerald-700",
  CTCC: "bg-violet-100 text-violet-700",
  "Khác": "bg-slate-100 text-slate-700",
};

const STATUS_BADGE = {
  "Đang Chờ": "bg-gray-100 text-gray-700",
  "Đang Xử Lý": "bg-amber-100 text-amber-700",
  "Đã Giải Quyết": "bg-lime-100 text-lime-700",
};

const STATUS_LABEL = {
  "Đang Chờ": "Đang Chờ",
  "Đang Xử Lý": "Đang Xử Lý",
  "Đã Giải Quyết": "Đã Giải Quyết",
};

const CARD_STYLES = [
  "from-slate-50 to-slate-100/80",
  "from-pink-50 to-rose-100/60",
  "from-amber-50 to-yellow-100/60",
  "from-lime-50 to-green-100/60",
];

const truncateLocation = (value, maxLength = 24) => {
  const text = (value || "").trim();
  if (!text || text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
};

const formatReportDateTime = (value) => {
  if (!value) {
    return "Chưa có thời gian";
  }

  const rawValue = typeof value === "string" ? value.trim() : value;
  if (!rawValue) {
    return "Chưa có thời gian";
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return typeof rawValue === "string" ? rawValue : "Chưa có thời gian";
  }

  return parsedDate.toLocaleString("vi-VN");
};

const useTestWorkflow =
  (import.meta.env.VITE_USE_TEST_REPORT_WORKFLOW ?? "false") === "true";

function normalizeReport(report) {
  const hasKnownStatus = STATUS_OPTIONS.includes(report?.status);
  const reportDate = report?.time || report?.createdAt;

  const normalizeAiPercent = (rawValue) => {
    const parsed = Number(rawValue ?? 0);
    if (Number.isNaN(parsed)) {
      return 0;
    }

    if (parsed > 0 && parsed <= 1) {
      return parsed * 100;
    }

    return parsed;
  };

  const hasAiValue =
    report?.aiPercent !== null && report?.aiPercent !== undefined;
  const aiPercent = hasAiValue
    ? Number(normalizeAiPercent(report?.aiPercent).toFixed(2))
    : 0;
  const aiVerified =
    typeof report?.aiVerified === "boolean" ? report.aiVerified : hasAiValue;

  return {
    id: report?.id || report?.report_id || report?._id || "N/A",
    title: report?.title || "Không có tiêu đề",
    type: report?.type || "Khác",
    location: report?.location || "Chưa có vị trí",
    status: hasKnownStatus ? report.status : "Đang Chờ",
    time: formatReportDateTime(reportDate),
    description: report?.description || "",
    images: report?.images || [],
    image: report?.image || "",
    aiPercent,
    aiVerified,
  };
}

export default function MyReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeIncidentTypes, setActiveIncidentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchIncidentTypes();
  }, [user]);

  const fetchIncidentTypes = async () => {
    try {
      const response = await incidentApi.getIncidentTypes();
      if (response?.success && Array.isArray(response.data)) {
        setActiveIncidentTypes(response.data.filter((item) => item?.name));
      } else {
        setActiveIncidentTypes([]);
      }
    } catch (err) {
      setActiveIncidentTypes([]);
      console.error("Không thể tải danh mục loại sự cố:", err);
    }
  };

  const fetchReports = async () => {
    const userId = user?._id || user?.user_id;

    if (!userId) {
      setReports([]);
      setLoading(false);
      setError("Vui lòng đăng nhập để xem báo cáo.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const useTestEndpoint =
        useTestWorkflow &&
        typeof reportApi.getTestReportsByUserId === "function";

      const response = useTestEndpoint
        ? await reportApi.getTestReportsByUserId(userId)
        : await reportApi.getReportsByUserId(userId);

      if (response?.success) {
        const normalizedReports = Array.isArray(response.data)
          ? response.data.map(normalizeReport)
          : [];
        setReports(normalizedReports);
      } else {
        setReports([]);
        setError("Không thể tải danh sách báo cáo.");
      }
    } catch (err) {
      setReports([]);
      setError(
        err?.response?.data?.message ||
          "Không kết nối được máy chủ. Vui lòng kiểm tra backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return reports.filter((item) => {
      const haystack =
        `${item.id} ${item.title} ${item.location}`.toLowerCase();
      const matchSearch = !searchTerm || haystack.includes(searchTerm);
      const matchType = typeFilter === "all" || item.type === typeFilter;
      const matchStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [reports, search, typeFilter, statusFilter]);

  const typeOptions = useMemo(() => {
    const activeTypeNames = activeIncidentTypes
      .map((item) => item.name)
      .filter(Boolean);

    const historicalTypeNames = reports
      .map((item) => item.type)
      .filter(Boolean);

    return ["all", ...new Set([...activeTypeNames, ...historicalTypeNames])];
  }, [activeIncidentTypes, reports]);

  useEffect(() => {
    if (typeFilter !== "all" && !typeOptions.includes(typeFilter)) {
      setTypeFilter("all");
    }
  }, [typeFilter, typeOptions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter]);

  const totalPages = Math.max(Math.ceil(filteredReports.length / pageSize), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const visibleReports = filteredReports.slice(
    startIndex,
    startIndex + pageSize,
  );

  const totalReports = reports.length;
  const pendingReports = reports.filter(
    (item) => item.status === "Đang Chờ",
  ).length;
  const processingReports = reports.filter(
    (item) => item.status === "Đang Xử Lý",
  ).length;
  const resolvedReports = reports.filter(
    (item) => item.status === "Đã Giải Quyết",
  ).length;

  const statCards = [
    {
      label: "Tổng Báo Cáo",
      value: totalReports,
      icon: <Database className="h-4 w-4" />,
    },
    {
      label: "Đang Chờ",
      value: pendingReports,
      icon: <Clock3 className="h-4 w-4" />,
    },
    {
      label: "Đang Xử Lý",
      value: processingReports,
      icon: <Zap className="h-4 w-4" />,
    },
    {
      label: "Đã Giải Quyết",
      value: resolvedReports,
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f3f4f6] md:h-screen md:overflow-hidden">
      <div className="absolute left-6 top-4 z-20">
        <SidebarProvider>
          <UserSidebar />
        </SidebarProvider>
      </div>

      <div className="h-full overflow-y-auto p-3 pb-24 sm:p-4 sm:pb-24 md:overflow-hidden md:p-6 md:pl-[7rem] md:pb-6">
        <div className="flex h-full w-full flex-col rounded-[24px] border border-gray-200 bg-white p-4 sm:p-5 md:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Báo Cáo Của Tôi
            </h1>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:w-auto">
              <div className="relative w-full min-w-0 sm:min-w-[280px] sm:max-w-[460px]">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nhập mã báo cáo, tiêu đề,..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-full border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-700"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="h-11 w-full rounded-full border-gray-200 bg-white text-gray-500 sm:h-12 sm:w-12"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card, index) => (
              <div
                key={card.label}
                className={`rounded-2xl border border-gray-100 bg-gradient-to-br p-5 ${CARD_STYLES[index]}`}
              >
                <div className="mb-2 inline-flex items-center justify-center rounded-full bg-white/80 p-2 text-gray-500">
                  {card.icon}
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {card.label}
                </p>
                <p className="mt-1 text-4xl font-semibold leading-none text-gray-800">
                  {card.value.toLocaleString("vi-VN", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            ))}
          </div> */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card, index) => (
              <Card
                key={card.label}
                size="sm"
                className={`border border-gray-100 bg-gradient-to-br ${CARD_STYLES[index]}`}
              >
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="inline-flex items-center justify-center rounded-full bg-white/80 p-2 text-gray-500">
                      {card.icon}
                    </span>
                    {card.label}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Thống kê hiện tại
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-4xl font-semibold leading-none text-gray-800">
                    {card.value.toLocaleString("vi-VN", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <ToggleGroup
              type="single"
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value || "all")}
              spacing={2}
              className="flex flex-wrap items-center justify-start gap-2"
            >
              {typeOptions.map((option) => (
                <ToggleGroupItem
                  key={option}
                  value={option}
                  className="h-11 rounded-full border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 hover:bg-gray-50 data-[state=on]:border-blue-200 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-600"
                  aria-label={option === "all" ? "Tất cả" : option}
                >
                  {option === "all" ? "Tất cả" : option}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value || "all")}
            >
              <div className="w-full min-w-0 sm:min-w-[190px] xl:w-auto">
                <SelectTrigger className="h-11 w-full rounded-xl border-gray-200 bg-white px-3 text-sm text-gray-600 data-[state=open]:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-100">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
              </div>
              <SelectContent
                position="popper"
                align="end"
                sideOffset={6}
                className="z-[80] w-[190px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
              >
                <SelectItem
                  value="all"
                  className="rounded-lg py-2 text-sm outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                >
                  Tất cả trạng thái
                </SelectItem>
                <SelectItem
                  value="Đang Chờ"
                  className="rounded-lg py-2 text-sm outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                >
                  Đang Chờ
                </SelectItem>
                <SelectItem
                  value="Đang Xử Lý"
                  className="rounded-lg py-2 text-sm outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                >
                  Đang Xử Lý
                </SelectItem>
                <SelectItem
                  value="Đã Giải Quyết"
                  className="rounded-lg py-2 text-sm outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900"
                >
                  Đã Giải Quyết
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              <button
                type="button"
                onClick={fetchReports}
                className="ml-3 rounded-lg bg-red-100 px-3 py-1 font-medium text-red-700 hover:bg-red-200"
              >
                Thử lại
              </button>
            </div>
          )}

          <div className="flex flex-1 min-h-0 flex-col">
            <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200">
              <div className="h-full overflow-auto bg-white">
                {loading ? (
                  <div className="flex h-full min-h-[240px] items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
                  </div>
                ) : (
                  <div className="min-w-[900px]">
                    <Table className="min-w-full text-left text-sm">
                      <TableHeader className="sticky top-0 z-10 bg-white text-gray-700">
                        <TableRow className="border-b border-gray-100 hover:bg-white">
                          <TableHead className="px-4 py-3 font-semibold">
                            Mã báo cáo
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold">
                            Tiêu đề
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold">
                            Loại
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold">
                            Vị trí
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold">
                            Trạng thái
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold">
                            % AI
                          </TableHead>
                          <TableHead className="px-4 py-3 font-semibold">
                            Thời gian
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleReports.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="px-4 py-10 text-center text-gray-400"
                            >
                              Chưa có dữ liệu báo cáo phù hợp.
                            </TableCell>
                          </TableRow>
                        )}

                        {visibleReports.map((item) => (
                          <TableRow
                            key={item.id}
                            className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
                            onClick={() => {
                              setSelected(item);
                              setShowDetail(true);
                            }}
                          >
                            <TableCell className="px-4 py-3 font-semibold text-gray-700">
                              {item.id}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-700">
                              {item.title}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`h-auto border-0 rounded-full px-3 py-1 text-xs font-medium ${TYPE_BADGE[item.type] || TYPE_BADGE["Khác"]}`}
                              >
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className="px-4 py-3 text-gray-600"
                              title={item.location}
                            >
                              {truncateLocation(item.location, 24)}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge
                                variant={
                                  (item.status || "Đang Chờ") === "Đang Chờ"
                                    ? "secondary"
                                    : "outline"
                                }
                                className={`h-auto border-0 rounded-full px-3 py-1 text-xs font-medium ${
                                  STATUS_BADGE[item.status] ||
                                  STATUS_BADGE["Đang Chờ"]
                                }`}
                              >
                                {STATUS_LABEL[item.status] || "Đang Chờ"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              {item.aiVerified ? (
                                <Badge
                                  variant={
                                    item.aiPercent >= 70
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className={`h-auto border-0 rounded-full px-3 py-1 text-xs font-medium ${
                                    item.aiPercent >= 70
                                      ? ""
                                      : item.aiPercent >= 30
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {Number(item.aiPercent || 0).toFixed(2)}%
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="h-auto border-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                                >
                                  Đang xác thực
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-600">
                              {item.time}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            <Pagination className="mt-4 justify-center md:justify-end">
              <PaginationContent className="gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text="Trang trước"
                    onClick={(event) => {
                      event.preventDefault();
                      if (safeCurrentPage > 1) {
                        setCurrentPage((prev) => Math.max(prev - 1, 1));
                      }
                    }}
                    aria-disabled={safeCurrentPage <= 1}
                    className={
                      safeCurrentPage <= 1
                        ? "pointer-events-none opacity-40"
                        : ""
                    }
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive
                    onClick={(event) => event.preventDefault()}
                    className="h-8 px-3 text-xs text-gray-500"
                  >
                    {safeCurrentPage} / {totalPages}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text="Trang sau"
                    onClick={(event) => {
                      event.preventDefault();
                      if (safeCurrentPage < totalPages) {
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages),
                        );
                      }
                    }}
                    aria-disabled={safeCurrentPage >= totalPages}
                    className={
                      safeCurrentPage >= totalPages
                        ? "pointer-events-none opacity-40"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
      {showDetail && (
        <ReportDetail
          data={selected}
          close={() => setShowDetail(false)}
          openRating={() => {
            setShowDetail(false);
            setShowReview(true);
          }}
        />
      )}
      {showReview && (
        <ReportReviews
          close={() => setShowReview(false)}
          submit={() => {
            toast.success("Đánh giá thành công!");
            setShowReview(false);
          }}
        />
      )}
    </div>
  );
}
