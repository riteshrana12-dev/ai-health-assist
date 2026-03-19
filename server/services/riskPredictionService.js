const { predictRisk } = require("./geminiService");
const HealthData = require("../models/HealthData");
const User = require("../models/User");
const Medication = require("../models/Medication");

// ── Run full risk prediction for a user ───────────────────────
const runRiskPrediction = async (userId) => {
  const [user, latest, trend, medications] = await Promise.all([
    User.findById(userId),
    HealthData.getLatestForUser(userId),
    HealthData.getTrendData(userId, 60),
    Medication.find({ userId, isActive: true }).select("name dosage category"),
  ]);

  const riskInput = {
    user,
    latest,
    trend,
    medications,
  };

  const prediction = await predictRisk(riskInput);

  // Update user cached health score if we have one
  if (latest && prediction.overallRiskScore !== undefined) {
    await HealthData.findByIdAndUpdate(latest._id, {
      "healthScore.aiInsights": prediction.riskSummary,
    });
  }

  return prediction;
};

// ── Quick emergency symptom check (no DB needed) ─────────────
const checkEmergencySymptoms = (symptoms = []) => {
  const EMERGENCY_PATTERNS = [
    {
      pattern: /chest.{0,20}pain|heart.{0,10}attack/i,
      message: "Possible cardiac emergency",
      action: "Call emergency services immediately",
    },
    {
      pattern: /can.{0,5}t breathe|difficulty breath|shortness.{0,10}breath/i,
      message: "Respiratory distress",
      action: "Seek emergency care now",
    },
    {
      pattern: /stroke|face.{0,10}droop|arm.{0,10}weak|speech.{0,10}difficul/i,
      message: "Possible stroke symptoms",
      action: "Call emergency services — time is critical",
    },
    {
      pattern: /seiz|convuls/i,
      message: "Seizure activity",
      action: "Call emergency services",
    },
    {
      pattern: /unconsci|faint|pass.{0,5}out/i,
      message: "Loss of consciousness",
      action: "Emergency medical attention required",
    },
    {
      pattern: /severe.{0,15}bleed|blood.{0,10}not.{0,10}stop/i,
      message: "Severe bleeding",
      action: "Apply pressure and call emergency services",
    },
    {
      pattern: /allergic.{0,10}react|throat.{0,10}swell|anaphyl/i,
      message: "Possible anaphylaxis",
      action: "Use EpiPen if available, call emergency services",
    },
    {
      pattern: /overdos|poison/i,
      message: "Possible overdose/poisoning",
      action: "Call Poison Control and emergency services",
    },
  ];

  const symptomText = Array.isArray(symptoms) ? symptoms.join(" ") : symptoms;
  const matches = [];

  EMERGENCY_PATTERNS.forEach(({ pattern, message, action }) => {
    if (pattern.test(symptomText)) {
      matches.push({ message, action });
    }
  });

  return {
    isEmergency: matches.length > 0,
    emergencies: matches,
  };
};

module.exports = { runRiskPrediction, checkEmergencySymptoms };
