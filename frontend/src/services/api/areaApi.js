import axiosClient from "./axiosClient";

export const areaApi = {
  getAllAreas: () => {
    return axiosClient.get("/areas");
  },
};
