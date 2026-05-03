import React, { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import ReportDetailQLKV from "../components/ReportDetail-QLKV";
import { formatLocationDisplay } from "../utils/formatLocation";
import { reportApi } from "../services/api/reportApi";
import incidentApi from "../services/api/incidentApi";

const ReportManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const limit = 10;

  const fetchManagementReports = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await reportApi.getManagementReports({
        search: searchQuery,
        type: selectedCategory,
        status: selectedStatus,
        page: currentPage,
        limit,
      });

      setReports(response?.data || []);
      setTotalPages(response?.pagination?.totalPages || 1);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || "Không thể tải danh sách báo cáo"
      );
      setReports([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidentTypes = async () => {
    try {
      const response = await incidentApi.getIncidentTypes();
      if (response?.success && Array.isArray(response.data)) {
        setIncidentTypes(response.data.filter((item) => item?.name));
      } else {
        setIncidentTypes([]);
      }
    } catch (error) {
      console.error("Không thể tải danh mục loại sự cố:", error);
      setIncidentTypes([]);
    }
  };

  useEffect(() => {
    fetchIncidentTypes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchManagementReports();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedStatus, currentPage]);

  const categoryOptions = useMemo(() => {
    const activeTypes = incidentTypes.map((item) => item.name).filter(Boolean);
    const historicalTypes = reports.map((item) => item.type).filter(Boolean);
    return ["all", ...new Set([...activeTypes, ...historicalTypes])];
  }, [incidentTypes, reports]);

  const categoryColorMap = useMemo(() => {
    return incidentTypes.reduce((acc, item) => {
      if (item?.name && item?.color) {
        acc[item.name] = item.color;
      }
      return acc;
    }, {});
  }, [incidentTypes]);

  useEffect(() => {
    if (selectedCategory !== "all" && !categoryOptions.includes(selectedCategory)) {
      setSelectedCategory("all");
      setCurrentPage(1);
    }
  }, [selectedCategory, categoryOptions]);

  const getCategoryColor = (category) => {
    return categoryColorMap[category] || "#6b7280";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang Chờ":
        return "#9ca3af";
      case "Đang Xử Lý":
        return "#f97316";
      case "Đã Giải Quyết":
        return "#06b6d4";
      default:
        return "#6b7280";
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-4">
        <div className="px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Quản lý báo cáo
          </h1>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 sm:px-6 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Nhập mã báo cáo để tìm kiếm"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white cursor-pointer"
          >
            {categoryOptions.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "Tất Cả Các Loại" : type}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất Cả Trạng Thái</option>
            <option value="Đang Chờ">Đang Chờ</option>
            <option value="Đang Xử Lý">Đang Xử Lý</option>
            <option value="Đã Giải Quyết">Đã Giải Quyết</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="px-4 sm:px-6 mb-4">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Table */}
      <div className="px-4 sm:px-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Mã Báo Cáo
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Tiêu Đề
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Loại
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Vị Trí
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Trạng Thái
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                    Thời Gian
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <tr
                      key={report._id || report.id || report.report_id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {report.id || report.report_id}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {report.title}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getCategoryColor(report.type) }}
                        >
                          {report.type}
                        </span>
                      </td>
                      <td className="w-1/4 px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-100 max-w-[200px] truncate">
                        {formatLocationDisplay(report.location)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getStatusColor(report.status) }}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {report.time || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Không tìm thấy báo cáo nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;