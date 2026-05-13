import axiosClient from "./axiosClient";

const userApi = {
  updateProfile(userData) {
    return axiosClient.put("/user/profile", userData);
  },

  changePassword(oldPassword, newPassword) {
    return axiosClient.post("/user/change-password", {
      oldPassword,
      newPassword,
    });
  },

  getUserInfo() {
    return axiosClient.get("/user/profile");
  },

  deleteAccount() {
    return axiosClient.delete("/user/account");
  },

  getManagementUsers(params = {}) {
    return axiosClient.get("/user/management", { params });
  },

  createManagementUser(payload) {
    return axiosClient.post("/user/management", payload);
  },

  updateManagementUser(userId, payload) {
    return axiosClient.put(`/user/management/${userId}`, payload);
  },

  updateManagementUserStatus(userId, status) {
    return axiosClient.patch(`/user/management/${userId}/status`, { status });
  },

  deleteManagementUser(userId) {
    return axiosClient.delete(`/user/management/${userId}`);
  },
};

export default userApi;
