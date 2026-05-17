import React, { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatLocationDisplay } from "../utils/formatLocation";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "../components/ui/pagination";
import { NavbarAdmin } from "../components/NavBar";
import MaintenanceUserSidebar from "../components/MaintenanceUserSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import MaintenanceReportDetail from "../components/MaintenanceReportDetail";
import { reportApi } from "../services/api/reportApi";
import { maintenanceTeamApi } from "../services/api/maintenanceTeamApi";
import { useAuth } from "../context/AuthContext";

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim();

export default function Assigned_report() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [teamId, setTeamId] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamReady, setTeamReady] = useState(false);
  const ITEMS_PER_PAGE = 4;
  const { user } = useAuth();

  const visibleStatuses = new Set(["Đang Xử Lý", "Đang Chờ"]);

  useEffect(() => {
    let isMounted = true;
    const fetchTeam = async () => {
      if (!user) {
        if (isMounted) setTeamReady(true);
        return;
      }
      setTeamLoading(true);
      try {
        const response = await maintenanceTeamApi.getTeams({
          page: 1,
          limit: 200,
          status: "active",
        });
        const teams = Array.isArray(response?.data) ? response.data : [];
        const leaderName = user?.full_name || user?.name || "";
        const leaderPhone = user?.phone || "";
        const normalizedLeader = normalizeText(leaderName);
        const normalizedPhone = normalizeText(leaderPhone);

        const matched = teams.find((team) => {
          const leader = normalizeText(team?.leader || "");
          if (!leader) return false;
          if (normalizedLeader && leader === normalizedLeader) return true;
          return normalizedPhone && leader.includes(normalizedPhone);
        });

        if (isMounted) {
          setTeamId(matched?.team_id || matched?.id || "");
        }
      } catch (teamError) {
        if (isMounted) setTeamId("");
      } finally {
        if (isMounted) {
          setTeamLoading(false);
          setTeamReady(true);
        }
      }
    };

    fetchTeam();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setReports([]);
      setError(null);
      setCurrentPage(1);
      if (user?.role === "maintenance" && !teamId && !teamLoading) {
        setReports([]);
        setError("Không tìm thấy đội xử lý của bạn.");
        return;
      }

      const response = await reportApi.getManagementReports({
        status: "Đang Xử Lý",
        search: "",
        page: 1,
        limit: 100,
        ...(teamId ? { assignedTeamId: teamId } : {}),
      });

      if (response.success && Array.isArray(response.data)) {
        const filteredReports = response.data.filter(
          (report) => visibleStatuses.has(report?.status),
        );
        setReports(filteredReports);
      } else {
        setReports([]);
      }
    } catch (err) {
      // ✅ Cleanup: Report fetching error handling silenced
      setError("Không thể tải danh sách báo cáo. Vui lòng thử lại.");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user?.role !== "maintenance") {
      return;
    }

    if (!teamReady) {
      return;
    }

    if (!teamId) {
      setReports([]);
      setError("Không tìm thấy đội xử lý của bạn.");
      setIsLoading(false);
      return;
    }

    fetchReports();
  }, [refreshKey, teamId, teamReady, user?.role]);

  const filteredReports = reports.filter((report) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      String(report?.id || report?.report_id || "")
        .toLowerCase()
        .includes(query) ||
      (report?.title || "").toLowerCase().includes(query) ||
      (report?.location || "").toLowerCase().includes(query)
    );
  });

  const maxPage = Math.ceil(filteredReports.length / ITEMS_PER_PAGE) || 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentReports = filteredReports.slice(offset, offset + ITEMS_PER_PAGE);

  const handleUpdateComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#fafafa] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="hidden md:block absolute left-4 top-4 z-10">
        <SidebarProvider>
          <MaintenanceUserSidebar />
        </SidebarProvider>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden md:pl-[var(--maintenance-sidebar-offset)]">
        {/* Navbar */}
        <div className="flex-shrink-0 px-4 sm:px-5 pt-3 sm:pt-4 pb-0">
          <div className="w-full mx-auto">
            <NavbarAdmin />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-4 sm:px-5 py-3 sm:py-4">
          <div className="w-full mx-auto flex flex-col gap-3 h-full">
            {/* Search */}
            <div className="h-[56px] flex-shrink-0 rounded-[20px] border border-gray-200 bg-white px-5 md:px-9 shadow-sm flex items-center gap-4">
              <Search className="h-5 w-5 text-[#a6a6a6] shrink-0" />
              <Input
                className="flex-1 border-0 bg-transparent p-0 text-[15px] text-gray-700 placeholder:text-gray-400 shadow-none focus-visible:ring-0"
                placeholder="Tìm kiếm theo mã sự cố, tiêu đề, vị trí…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Table Container */}
            <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden p-2 sm:p-4">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-500">
                      Đang tải danh sách...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Table wrapper - scrollable internally */}
                  <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-gray-100">
                    <Table className="w-full min-w-[700px]">
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className="border-b border-gray-200 hover:bg-transparent">
                          <TableHead className="w-[140px] px-6 py-5 text-left text-[12px] font-medium uppercase tracking-wider text-gray-800">
                            Mã Báo Cáo
                          </TableHead>
                          <TableHead className="px-6 py-5 text-center text-[12px] font-medium uppercase tracking-wider text-gray-800">
                            Tiêu đề
                          </TableHead>
                          <TableHead className="px-6 py-5 text-center text-[12px] font-medium uppercase tracking-wider text-gray-800">
                            Vị trí
                          </TableHead>
                          <TableHead className="w-[140px] px-6 py-5 text-center text-[12px] font-medium uppercase tracking-wider text-gray-800">
                            Thời gian
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentReports.map((report) => {
                          const timeStr = report?.time || "---";
                          let topTime = timeStr;
                          let bottomTime = "";
                          if (timeStr !== "---" && timeStr.includes(",")) {
                            const parts = timeStr.split(",");
                            topTime = parts[0].trim() + ",";
                            bottomTime = parts[1].trim();
                          }
                          return (
                            <TableRow
                              key={
                                report?._id || report?.id || report?.report_id
                              }
                              onClick={() => setSelectedReport(report)}
                              className="hover:bg-blue-50/50 cursor-pointer transition-colors h-[72px] border-b border-gray-100 last:border-none"
                            >
                              <TableCell className="px-6 py-4 text-left font-medium text-blue-800 whitespace-nowrap text-[15px]">
                                {report?.id
                                  ? `#${report.id}`
                                  : report?.report_id
                                    ? `#${report.report_id}`
                                    : "---"}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center text-[15px] text-gray-800 max-w-[250px] truncate">
                                {report?.title || "---"}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center text-[15px] text-gray-700 max-w-[300px] truncate">
                                {formatLocationDisplay(report?.location)}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center text-[14px] text-gray-800 whitespace-nowrap">
                                {bottomTime ? (
                                  <div className="flex flex-col items-center justify-center leading-snug">
                                    <span>{topTime}</span>
                                    <span>{bottomTime}</span>
                                  </div>
                                ) : (
                                  <span>{timeStr}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {currentReports.length === 0 && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell
                              colSpan={4}
                              className="px-4 py-12 text-center text-gray-400 text-sm"
                            >
                              {searchQuery
                                ? "Không tìm thấy báo cáo phù hợp."
                                : "Chưa có báo cáo nào được phân công."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-center pt-5 pb-2 bg-white">
                    <div className="flex items-center gap-2 text-[14px] text-gray-600">
                      <button
                        className="flex items-center gap-1 hover:text-gray-900 disabled:opacity-50 transition-colors mr-2"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                      >
                        <ChevronLeft className="h-4 w-4" /> Trước
                      </button>

                      {Array.from({ length: maxPage }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[28px] h-7 px-2 rounded-md flex items-center justify-center transition-colors ${
                              currentPage === page
                                ? "border border-gray-300 text-gray-800 font-medium"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}

                      <button
                        className="flex items-center gap-1 hover:text-gray-900 disabled:opacity-50 transition-colors ml-2"
                        disabled={currentPage === maxPage}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(maxPage, p + 1))
                        }
                      >
                        Sau <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MaintenanceReportDetail
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
        onUpdate={handleUpdateComplete}
      />
    </div>
  );
}
