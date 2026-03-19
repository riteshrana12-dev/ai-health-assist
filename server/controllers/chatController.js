const {
  chatWithAI,
  explainCondition,
  checkMedicationInteractions,
} = require("../services/geminiService");
const {
  runRiskPrediction,
  checkEmergencySymptoms,
} = require("../services/riskPredictionService");
const { getPersonalizedInsights } = require("../services/healthScoreService");
const HealthData = require("../models/HealthData");
const User = require("../models/User");
const Medication = require("../models/Medication");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

// In-memory conversation store (for demo — use Redis in production)
const conversationStore = new Map();
const CONV_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY = 20; // last 20 turns

const getHistory = (userId) => {
  const entry = conversationStore.get(userId);
  if (!entry) return [];
  if (Date.now() - entry.updatedAt > CONV_TTL_MS) {
    conversationStore.delete(userId);
    return [];
  }
  return entry.history;
};

const saveHistory = (userId, history) => {
  conversationStore.set(userId, {
    history: history.slice(-MAX_HISTORY),
    updatedAt: Date.now(),
  });
};

// ─────────────────────────────────────────────────────────────
// @desc    Send message to AI health chatbot
// @route   POST /api/chat/message
// @access  Private
// ─────────────────────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res, next) => {
  const { message, clearHistory } = req.body;

  if (!message?.trim()) {
    return next(new AppError("Message cannot be empty", 400));
  }
  if (message.length > 2000) {
    return next(new AppError("Message too long (max 2000 characters)", 400));
  }

  // Clear history if requested (new conversation)
  if (clearHistory) conversationStore.delete(req.userId);

  // 1. Quick client-side emergency check (fast, no AI)
  const quickEmergencyCheck = checkEmergencySymptoms(message);
  if (quickEmergencyCheck.isEmergency) {
    const emergencyResponse = buildEmergencyResponse(
      quickEmergencyCheck.emergencies,
    );
    return res.status(200).json({
      success: true,
      data: {
        message: emergencyResponse,
        role: "assistant",
        isEmergency: true,
        timestamp: new Date(),
      },
    });
  }

  // 2. Fetch user health context for personalized responses
  const [user, latestHealth] = await Promise.all([
    User.findById(req.userId).select(
      "age gender bloodGroup allergies medicalHistory lifestyle latestBMI",
    ),
    HealthData.getLatestForUser(req.userId),
  ]);

  const userContext = {
    age: user?.age,
    gender: user?.gender,
    bloodGroup: user?.bloodGroup,
    allergies: user?.allergies,
    conditions: user?.medicalHistory
      ?.filter((h) => h.status === "active")
      .map((h) => h.condition),
    bmi: latestHealth?.bmi?.value,
    bp: latestHealth?.bloodPressure
      ? `${latestHealth.bloodPressure.systolic}/${latestHealth.bloodPressure.diastolic} mmHg`
      : undefined,
    glucose: latestHealth?.glucose?.value
      ? `${latestHealth.glucose.value} mg/dL`
      : undefined,
  };

  // 3. Get conversation history
  const history = getHistory(req.userId);

  // 4. Call Gemini
  const aiResult = await chatWithAI(message, history, userContext);

  // 5. Update conversation history
  const updatedHistory = [
    ...history,
    { role: "user", content: message },
    { role: "assistant", content: aiResult.message },
  ];
  saveHistory(req.userId, updatedHistory);

  res.status(200).json({
    success: true,
    data: {
      message: aiResult.message,
      role: "assistant",
      isEmergency: aiResult.isEmergency,
      tokensUsed: aiResult.tokensUsed,
      timestamp: new Date(),
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get conversation history
// @route   GET /api/chat/history
// @access  Private
// ─────────────────────────────────────────────────────────────
const getConversationHistory = asyncHandler(async (req, res) => {
  const history = getHistory(req.userId);
  res.status(200).json({
    success: true,
    data: {
      history,
      count: history.length,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Clear conversation history
// @route   DELETE /api/chat/history
// @access  Private
// ─────────────────────────────────────────────────────────────
const clearHistory = asyncHandler(async (req, res) => {
  conversationStore.delete(req.userId);
  res.status(200).json({ success: true, message: "Conversation cleared" });
});

// ─────────────────────────────────────────────────────────────
// @desc    Run full AI risk prediction
// @route   POST /api/chat/risk-predict
// @access  Private
// ─────────────────────────────────────────────────────────────
const getRiskPrediction = asyncHandler(async (req, res, next) => {
  const latest = await HealthData.getLatestForUser(req.userId);
  if (!latest) {
    return next(
      new AppError("No health data found. Please log your vitals first.", 400),
    );
  }

  const prediction = await runRiskPrediction(req.userId);

  res.status(200).json({
    success: true,
    data: { prediction },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get AI health insights for dashboard
// @route   GET /api/chat/insights
// @access  Private
// ─────────────────────────────────────────────────────────────
const getInsights = asyncHandler(async (req, res) => {
  const result = await getPersonalizedInsights(req.userId);
  res.status(200).json({
    success: true,
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Explain a disease / health condition
// @route   POST /api/chat/explain
// @access  Private
// ─────────────────────────────────────────────────────────────
const explainHealth = asyncHandler(async (req, res, next) => {
  const { condition, context } = req.body;
  if (!condition?.trim()) {
    return next(
      new AppError("Please provide a condition or topic to explain", 400),
    );
  }

  const user = await User.findById(req.userId).select("age");
  const result = await explainCondition(condition.trim(), user?.age, context);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Check medication interactions
// @route   POST /api/chat/med-interactions
// @access  Private
// ─────────────────────────────────────────────────────────────
const getMedInteractions = asyncHandler(async (req, res) => {
  // Use user's active medications from DB
  const medications = await Medication.find({
    userId: req.userId,
    isActive: true,
  }).select("name dosage category");

  const result = await checkMedicationInteractions(medications);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Quick symptom emergency check (no AI, instant)
// @route   POST /api/chat/emergency-check
// @access  Private
// ─────────────────────────────────────────────────────────────
const emergencyCheck = asyncHandler(async (req, res, next) => {
  const { symptoms } = req.body;
  if (!symptoms) return next(new AppError("Symptoms are required", 400));

  const result = checkEmergencySymptoms(symptoms);
  res.status(200).json({ success: true, data: result });
});

// ── Emergency response builder ────────────────────────────────
const buildEmergencyResponse = (emergencies) => {
  const lines = [
    "🚨 **EMERGENCY DETECTED**\n",
    "Based on your symptoms, this may require **immediate emergency care**.\n",
  ];
  emergencies.forEach((e) => {
    lines.push(`⚠️ **${e.message}**`);
    lines.push(`➡️ ${e.action}\n`);
  });
  lines.push("---");
  lines.push(
    "**Please call emergency services (911 / 112) or go to your nearest emergency room immediately.**",
  );
  lines.push(
    "\nDo not drive yourself. Have someone take you or call an ambulance.",
  );
  return lines.join("\n");
};

module.exports = {
  sendMessage,
  getConversationHistory,
  clearHistory,
  getRiskPrediction,
  getInsights,
  explainHealth,
  getMedInteractions,
  emergencyCheck,
};
