import axiosClient from "./axiosClient";

export const notificationApi = {
  getNotifications: async () => {
    try {
      const response = await axiosClient.get("/notifications");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await axiosClient.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await axiosClient.patch("/notifications/mark-all-read");
      return response.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
      throw error;
    }
  },
};
