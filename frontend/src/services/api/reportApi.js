import axiosClient from "./axiosClient";

export const reportApi = {
  // Dữ liệu cho trang quản lý báo cáo (có lọc + phân trang)
  getManagementReports: async (params = {}) => {
    try {
      const response = await axiosClient.get(`/reports/management`, { params });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu quản lý báo cáo:", error);
      throw error;
    }
  },

  // Dữ liệu cho trang đơn tiếp nhận (có lọc + phân trang)
  getReceptionReports: async (params = {}) => {
    try {
      const response = await axiosClient.get(`/reports/reception`, { params });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu đơn tiếp nhận:", error);
      throw error;
    }
  },

  // Lấy tất cả báo cáo
  getAllReports: async () => {
    try {
      const response = await axiosClient.get("/reports");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo:", error);
      throw error;
    }
  },

  // Lấy dữ liệu nhẹ cho marker bản đồ
  getMapReports: async (params = {}) => {
    try {
      const response = await axiosClient.get("/reports", {
        params: { view: "map", ...params },
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu marker bản đồ:", error);
      throw error;
    }
  },

  // Lấy 1 báo cáo theo ID
  getReportById: async (id, params = {}) => {
    try {
      const response = await axiosClient.get(`/reports/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết báo cáo:", error);
      throw error;
    }
  },

  // Lấy báo cáo theo userId
  getReportsByUserId: async (userId, params = {}) => {
    try {
      const response = await axiosClient.get(`/reports/user/${userId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo của user:", error);
      throw error;
    }
  },

  // Alias cho test workflow (dùng cùng endpoint hiện tại)
  getTestReportsByUserId: async (userId, params = {}) => {
    try {
      const response = await axiosClient.get(`/reports/user/${userId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy báo cáo test của user:", error);
      throw error;
    }
  },

  // Tạo báo cáo mới
  createReport: async (reportData) => {
    try {
      const response = await axiosClient.post("/reports", reportData);
      return response.data;
    } catch (error) {
      const backendMessage =
        error.response?.data?.message || error.message || "Lỗi khi tạo báo cáo";
      const normalizedError = new Error(backendMessage);
      normalizedError.status = error.response?.status;
      normalizedError.code = error.response?.data?.code;
      normalizedError.response = error.response;
      throw normalizedError;
    }
  },

  updateReportStatus: async (reportId, status) => {
    try {
      const response = await axiosClient.patch(`/reports/${reportId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái báo cáo:", error);
      throw error;
    }
  },

  assignReport: async (reportId, { teamId, teamName }) => {
    try {
      const response = await axiosClient.patch(`/reports/${reportId}/assign`, {
        teamId,
        teamName,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi phân công báo cáo:", error);
      throw error;
    }
  },

  // PB14: Cập nhật tiến độ xử lý (Đội xử lý upload ảnh sau khắc phục)
  updateProgress: async (reportId, { afterImg, afterImage, progressNote }) => {
    try {
      const response = await axiosClient.patch(
        `/reports/${reportId}/progress`,
        {
          afterImg: afterImg || afterImage,
          progressNote,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật tiến độ xử lý:", error);
      throw error;
    }
  },
};
