import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/staff/refresh");

      processQueue();
      isRefreshing = false;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      isRefreshing = false;

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  },
);
