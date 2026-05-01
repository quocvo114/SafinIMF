import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import MaintenanceUserSidebar from "./MaintenanceUserSidebar";
import { SidebarProvider } from "./ui/sidebar";
import { formatLocationDisplay } from "../utils/formatLocation";

export default function MaintenanceMyReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Du lieu mau theo giao dien Framer
  const reports = [
    {
      id: "#BC-23456",
      title: "Ổ gà lủng to đùng",
      location: "556 Hoàng Diệu, Hải Châu",
      time: "10:45, 24/03",
    },
    {
      id: "#BC-9999",
      title: "Đường lủng bự tổ chảng",
      location: "123 Thâm Tâm, Hoà Xuân",
      time: "22:05, 26/03",
    },
    {
      id: "#BC-7374",
      title: "Ổ voi siêu khủng lồ",
      location: "27 Hói Kiếng 34, Hoà Xuân",
      time: "13:45, 27/03",
    },
    {
      id: "#BC-9248",
      title: "Đường thủng gây nguy hiểm giao...",
      location: "98 Mai Thúc Lân, Ngũ Hành Sơn",
      time: "11:45, 11/03",
    },
    {
      id: "#BC-2821",
      title: "Mặt đường bị hư hỏng nặng",
      location: "44 Phan Tứ, Ngũ Hành Sơn",
      time: "09:00, 09/03",
    },
    {
      id: "#BC-9999",
      title: "Đường xấu dễ tai nạn",
      location: "99 Tôn Đức Thắng, Hoà Khánh",
      time: "14:30, 25/03",
    },
  ];

  const filteredReports = reports.filter((report) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      report.id.toLowerCase().includes(query) ||
      report.title.toLowerCase().includes(query) ||
      report.location.toLowerCase().includes(query)
    );
  });

  const maxPage = 3;

  return (
    <div className="w-full h-screen overflow-hidden bg-[#fafafa] flex flex-col relative">
      <div className="absolute left-6 top-4 z-10">
        <SidebarProvider>
          <MaintenanceUserSidebar />
        </SidebarProvider>
      </div>

      <div
        className="h-full overflow-hidden p-4 sm:p-6"
        style={{ marginLeft: "7rem" }}
      >
        <div className="flex h-full w-full flex-col max-w-[1320px] mx-auto">
          {/* Header Area */}
          <div className="mb-6 flex-shrink-0">
            <h1 className="text-3xl font-bold tracking-tight text-[#111] mb-2">
              Công Việc Được Phân Công
            </h1>
            <p className="text-gray-500">Danh sách các sự cố cần bảo trì khắc phục</p>
          </div>
          
          {/* Search Bar - Fixed height */}
          <div className="h-[76px] w-full rounded-[20px] border border-gray-200 bg-white px-5 md:px-9 shadow-sm flex items-center gap-4 flex-shrink-0 mb-6">
            <Search className="h-7 w-7 text-[#767676] shrink-0" />
            <Input
              className="flex-1 border-0 bg-transparent p-0 text-[15px] text-gray-700 placeholder:text-gray-400 shadow-none focus-visible:ring-0"
              placeholder="Nhập tên loại sự cố để tìm kiếm, mã sự cố, tiêu đề…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Table Area - Flex 1 min-h-0 to enable internal scrolling */}
          <div className="flex flex-1 min-h-0 flex-col w-full rounded-[30px] border border-gray-200 bg-white shadow-sm overflow-hidden pt-7 pb-6">
            {/* Table Container - Overflow Y auto */}
            <div className="flex-1 overflow-y-auto px-3 md:px-8">
              <table className="w-full min-w-[860px] border-collapse text-left relative">
                <thead className="sticky top-0 bg-white z-10 shadow-sm outline outline-1 outline-gray-200">
                  <tr className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gray-700">
                    <th className="px-4 py-4">Mã báo cáo</th>
                    <th className="px-4 py-4">Tiêu đề</th>
                    <th className="px-4 py-4">Vị trí</th>
                    <th className="px-4 py-4">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[15px]">
                  {filteredReports.map((report) => (
                    <tr
                      key={`${report.id}-${report.time}`}
                      className="transition-colors hover:bg-slate-50/70 cursor-pointer"
                    >
                      <td className="px-4 py-5 font-medium text-blue-600 whitespace-nowrap">
                        {report.id}
                      </td>
                      <td className="px-4 py-5 font-medium text-gray-900">{report.title}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatLocationDisplay(report.location)}
                      </td>
                      <td className="px-4 py-5 text-gray-500 whitespace-nowrap">
                        {report.time}
                      </td>
                    </tr>
                  ))}

                  {filteredReports.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        Không tìm thấy báo cáo phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - Fixed at bottom of white box */}
            {filteredReports.length > 0 && (
              <div className="mt-4 flex-shrink-0 flex items-center justify-center gap-[15px] text-[15px] font-semibold text-gray-700 px-3 md:px-8">
                <button
                  className="flex items-center gap-1 text-gray-500 transition-colors hover:text-gray-900"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 w-7 rounded-[5px] transition-colors ${
                      currentPage === page
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <span className="text-gray-400">…</span>

                <button
                  className="flex items-center gap-1 text-gray-500 transition-colors hover:text-gray-900"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(maxPage, prev + 1))
                  }
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
