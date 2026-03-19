const { generateHealthInsights, predictRisk } = require("./geminiService");
const HealthData = require("../models/HealthData");
const User = require("../models/User");

// ── Generate personalized AI health insights for dashboard ────
const getPersonalizedInsights = async (userId) => {
  try {
    const user = await User.findById(userId);
    const latest = await HealthData.getLatestForUser(userId);
    const trendData = await HealthData.getTrendData(userId, 30);

    if (!latest) {
      return {
        insights: [
          {
            type: "tip",
            icon: "activity",
            title: "Start tracking",
            message:
              "Log your first vitals to get personalized AI health insights.",
            priority: "medium",
          },
        ],
      };
    }

    const userProfile = {
      age: user?.age || user?.ageFromDOB,
      gender: user?.gender,
      lifestyle: user?.lifestyle,
    };

    const result = await generateHealthInsights(
      latest,
      trendData.slice(-7),
      userProfile,
    );
    return result;
  } catch (err) {
    console.error("Health insights error:", err.message);
    return { insights: [] };
  }
};

// ── Full AI risk prediction for a user ────────────────────────
const getUserRiskProfile = async (userId) => {
  const user = await User.findById(userId);
  const latest = await HealthData.getLatestForUser(userId);
  const trendData = await HealthData.getTrendData(userId, 60);

  const riskData = {
    user,
    latest,
    trend: trendData,
  };

  return await predictRisk(riskData);
};

module.exports = { getPersonalizedInsights, getUserRiskProfile };
