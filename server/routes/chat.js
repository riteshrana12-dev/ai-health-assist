const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getConversationHistory,
  clearHistory,
  getRiskPrediction,
  getInsights,
  explainHealth,
  getMedInteractions,
  emergencyCheck,
} = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/message", sendMessage); // AI chatbot
router.get("/history", getConversationHistory); // get chat history
router.delete("/history", clearHistory); // clear chat history
router.post("/risk-predict", getRiskPrediction); // full risk prediction
router.get("/insights", getInsights); // dashboard AI insights
router.post("/explain", explainHealth); // explain a condition
router.post("/med-interactions", getMedInteractions); // drug interaction check
router.post("/emergency-check", emergencyCheck); // instant emergency check

module.exports = router;
