import axiosClient from "./axiosClient";

export const maintenanceTeamApi = {
  getTeams: async (params = {}) => {
    const response = await axiosClient.get("/maintenance-teams", { params });
    return response.data;
  },

  createTeam: async (payload) => {
    const response = await axiosClient.post("/maintenance-teams", payload);
    return response.data;
  },

  updateTeam: async (teamId, payload) => {
    const response = await axiosClient.put(`/maintenance-teams/${teamId}`, payload);
    return response.data;
  },

  updateTeamStatus: async (teamId, status) => {
    const response = await axiosClient.patch(`/maintenance-teams/${teamId}/status`, {
      status,
    });
    return response.data;
  },

  deleteTeam: async (teamId) => {
    const response = await axiosClient.delete(`/maintenance-teams/${teamId}`);
    return response.data;
  },
};
