import axios from "axios";

const DEFAULT_API_PORT = import.meta.env.VITE_BACKEND_PORT || 5000;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `http://localhost:${DEFAULT_API_PORT}/api`;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// Optional: attach token nếu có
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
