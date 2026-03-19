import api from "./api";

export const chatService = {
  sendMessage: (message, clearHistory = false) =>
    api.post("/chat/message", { message, clearHistory }),
  getHistory: () => api.get("/chat/history"),
  clearHistory: () => api.delete("/chat/history"),
  getRiskPrediction: () => api.post("/chat/risk-predict"),
  getInsights: () => api.get("/chat/insights"),
  explainCondition: (condition, context) =>
    api.post("/chat/explain", { condition, context }),
  getMedInteractions: () => api.post("/chat/med-interactions"),
  emergencyCheck: (symptoms) => api.post("/chat/emergency-check", { symptoms }),
};
