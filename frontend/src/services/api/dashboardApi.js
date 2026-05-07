import axiosClient from "./axiosClient";

const dashboardApi = {
  // Lấy dữ liệu thống kê tổng hợp
  getSummary: async () => {
    try {
      const response = await axiosClient.get("/statistics/summary");
      return (
        response.data || {
          totalReports: 0,
          byArea: [],
          byStatus: [],
          byIncidentType: [],
        }
      );
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu thống kê:", error);
      // Trả về dữ liệu mặc định nếu API lỗi
      return {
        totalReports: 0,
        byArea: [],
        byStatus: [],
        byIncidentType: [],
      };
    }
  },
};

export default dashboardApi;
