import api from "./api.js";

export const medicationService = {
  add: (data) => api.post("/medications", data),
  getAll: (params = {}) => api.get("/medications", { params }),
  getToday: () => api.get("/medications/today"),
  getOne: (id) => api.get(`/medications/${id}`),
  update: (id, data) => api.put(`/medications/${id}`, data),
  delete: (id) => api.delete(`/medications/${id}`),
  logDose: (id, data) => api.post(`/medications/${id}/log`, data),
};
