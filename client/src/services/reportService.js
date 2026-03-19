import api from "./api";

export const reportService = {
  upload: (formData, onProgress) =>
    api.post("/reports/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
        : undefined,
    }),
  getAll: (params = {}) => api.get("/reports", { params }),
  getOne: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
  toggleStar: (id) => api.patch(`/reports/${id}/star`),
  reAnalyze: (id) => api.post(`/reports/${id}/analyze`),
};
