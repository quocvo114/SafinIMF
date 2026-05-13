import axiosClient from "./axiosClient";

const statisticsApi = {
  getSummary(params = {}) {
    return axiosClient
      .get("/statistics/summary", { params })
      .then((res) => res.data);
  },
};

export default statisticsApi;
