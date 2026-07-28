import axios from "axios";
import { installAdminPropertyMatchTracker } from "./adminPropertyMatchTracker";
import { installActivityResponseTracker } from "./activityResponseTracker";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath =
        `${window.location.pathname}${window.location.search}`;

      const publicPaths = [
        "/",
        "/auth",
        "/properties",
        "/about",
        "/contact",
        "/faq",
        "/terms",
        "/privacy",
        "/pricing-policy",
        "/how-it-works",
      ];

      const isPublicPath = publicPaths.includes(
        window.location.pathname,
      );

      if (!isPublicPath && window.location.pathname !== "/auth") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href =
          `/auth?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(error);
  },
);

installActivityResponseTracker(api);

installAdminPropertyMatchTracker(api);

export default api;
