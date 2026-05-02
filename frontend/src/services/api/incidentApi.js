import axiosClient from "./axiosClient";

const incidentApi = {
  getIncidentTypes(params = {}) {
    return axiosClient.get("/incident-types", { params }).then((res) => res.data);
  },

  getIncidentTypeById(id) {
    return axiosClient.get(`/incident-types/${id}`).then((res) => res.data);
  },

  createIncidentType(payload) {
    return axiosClient.post("/incident-types", payload).then((res) => res.data);
  },

  updateIncidentType(id, payload) {
    return axiosClient
      .put(`/incident-types/${id}`, payload)
      .then((res) => res.data);
  },

  deleteIncidentType(id) {
    return axiosClient.delete(`/incident-types/${id}`).then((res) => res.data);
  },
};

export default incidentApi;
