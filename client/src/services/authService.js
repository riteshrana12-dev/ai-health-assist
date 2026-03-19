import api from "./api";

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  updateAvatar: (formData) =>
    api.post("/auth/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (data) => api.put("/auth/change-password", data),
  deleteAccount: (data) => api.delete("/auth/account", { data }),
  getMe: () => api.get("/auth/me"),
};
