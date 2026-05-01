import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, House, Megaphone } from "lucide-react";
import Toast from "../components/Toast";
import ReportDetail from "../components/ReportDetail";
import { formatLocationDisplay } from "../utils/formatLocation";
import ReportReviews from "../components/ReportReviews";
import UserSidebar from "../components/UserSidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { reportApi } from "../services/api/reportApi";
import { useAuth } from "../context/AuthContext";
const TYPE_COLOR = {
  "Giao Thông": "bg-orange-400",
  Điện: "bg-yellow-400",
  "Cây Xanh": "bg-green-400",
  CTCC: "bg-purple-400",
};

const STATUS_COLOR = {
  "Đang Chờ": "bg-gray-400",
  "Đang Xử Lý": "bg-orange-500",
  "Đã Giải Quyết": "bg-blue-500",
};

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReview, setShowReview] = useState(false);

  //! Lấy dữ liệu từ API
  useEffect(() => {
    const userId = user?._id || user?.user_id;
    if (userId) {
      fetchReports();
    } else {
      // Nếu không có user sau 1 giây, dừng loading
      const timer = setTimeout(() => {
        setLoading(false);
        setError("Vui lòng đăng nhập để xem báo cáo");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]); // Re-fetch khi user hoặc location thay đổi

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = user?._id || user?.user_id;
      console.log("🔍 Fetching reports for userId:", userId);
      console.log("👤 User object:", user);

      if (!userId) {
        setError("Vui lòng đăng nhập để xem báo cáo");
        setLoading(false);
        return;
      }

      const response = await reportApi.getReportsByUserId(userId);
      console.log("📡 API Response:", response);

      if (response.success) {
        setReports(response.data);
        console.log("Reports loaded:", response.data.length);
      } else {
        setError("Không thể tải báo cáo");
      }
    } catch (error) {
      setError("Lỗi khi tải dữ liệu");
      console.error("Lỗi khi tải dữ liệu:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || item.type === typeFilter;
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });
  //! Hiển thị loading
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-100 flex flex-col relative">
      {/* Floating Sidebar */}
      <div className="absolute left-6 top-4 z-10">
        <SidebarProvider>
          <UserSidebar />
        </SidebarProvider>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{ marginLeft: "7rem" }}
      >
        {/* HEADER - Title + Search */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Báo Cáo Của Tôi</h1>
          <div className="relative w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Nhập mã báo cáo, tiêu đề,..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatBox label="Tổng Báo Cáo" number={reports.length} icon="📁" />
          <StatBox
            label="Đang Chờ"
            number={reports.filter((r) => r.status === "Đang Chờ").length}
            icon="⏳"
          />
          <StatBox
            label="Đang Xử Lý"
            number={reports.filter((r) => r.status === "Đang Xử Lý").length}
            icon="⚡"
          />
          <StatBox
            label="Đã Giải Quyết"
            number={reports.filter((r) => r.status === "Đã Giải Quyết").length}
            icon="✔️"
          />
        </div>

        {/* FILTERS & SORT */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTypeFilter("Giao Thông")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === "Giao Thông"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Giao thông
            </button>
            <button
              onClick={() => setTypeFilter("Điện")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === "Điện"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Điện
            </button>
            <button
              onClick={() => setTypeFilter("Cây Xanh")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === "Cây Xanh"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Cây xanh
            </button>
            <button
              onClick={() => setTypeFilter("CTCC")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === "CTCC"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Công trình công cộng
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang Chờ">Đang Chờ</option>
            <option value="Đang Xử Lý">Đang Xử Lý</option>
            <option value="Đã Giải Quyết">Đã Giải Quyết</option>
          </select>
        </div>

        {/* TABLE CARD */}
        <div className="p-6 bg-white border rounded-2xl shadow">
          {/* TABLE */}
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3">Mã Báo Cáo</th>
                  <th className="p-3">Tiêu Đề</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3">Vị Trí</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3">Thời Gian</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => {
                      setSelected(item);
                      setShowDetail(true);
                    }}
                  >
                    <td className="p-3 font-semibold">{item.id}</td>
                    <td className="p-3">{item.title}</td>
                    <td className="p-3">
                      <span
                        className={`text-white px-3 py-1 rounded-full text-xs ${
                          TYPE_COLOR[item.type]
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3">{formatLocationDisplay(item.location)}</td>
                    <td className="p-3">
                      <span
                        className={`text-white px-3 py-1 rounded-full text-xs ${
                          STATUS_COLOR[item.status]
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="mt-6 flex justify-between items-center">
            <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
              Previous
            </button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
              Next
            </button>
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
          submit={(rating, text) => {
            alert("Đánh giá thành công!");
            setShowReview(false);
          }}
        />
      )}
    </div>
  );
}

/* STAT BOX */
function StatBox({ label, number, icon }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow border flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold">{number}</p>
      </div>
    </div>
  );
}
