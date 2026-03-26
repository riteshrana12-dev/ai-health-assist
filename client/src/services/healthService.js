import api from "./api.js";

export const healthService = {
  // Vitals
  logVitals: (data) => api.post("/health-data", data),
  getDashboard: () => api.get("/health-data/dashboard"),
  getAnalytics: (days = 30) => api.get(`/health-data/analytics?days=${days}`),
  getHistory: (page = 1, limit = 10) =>
    api.get(`/health-data/history?page=${page}&limit=${limit}`),
  getEntry: (id) => api.get(`/health-data/${id}`),
  deleteEntry: (id) => api.delete(`/health-data/${id}`),
};
