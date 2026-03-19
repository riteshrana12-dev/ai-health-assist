const HealthData = require("../models/HealthData");
const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const {
  calculateBMI,
  categorizeBP,
  categorizeGlucose,
  calculateHealthScore,
} = require("../utils/healthCalculators");

// ─────────────────────────────────────────────────────────────
// @desc    Log new vitals entry
// @route   POST /api/health/vitals
// @access  Private
// ─────────────────────────────────────────────────────────────
const logVitals = asyncHandler(async (req, res, next) => {
  const {
    weight,
    height,
    bloodPressure,
    glucose,
    vitals,
    labValues,
    lifestyle,
    notes,
    logDate,
    entryType,
  } = req.body;

  // Build entry object
  const entryData = {
    userId: req.userId,
    entryType: entryType || "manual",
    notes,
    logDate: logDate ? new Date(logDate) : new Date(),
  };

  if (weight) entryData.weight = weight;
  if (height) entryData.height = height;
  if (bloodPressure) entryData.bloodPressure = bloodPressure;
  if (glucose) entryData.glucose = glucose;
  if (vitals) entryData.vitals = vitals;
  if (labValues) entryData.labValues = labValues;
  if (lifestyle) entryData.lifestyle = lifestyle;

  // Calculate health score from submitted data
  const user = await User.findById(req.userId);
  const scoreInput = {
    bmi:
      weight?.value && height?.value
        ? weight.value / Math.pow(height.value / 100, 2)
        : user?.latestBMI || null,
    systolic: bloodPressure?.systolic,
    diastolic: bloodPressure?.diastolic,
    glucose: glucose?.value,
    lifestyle: user?.lifestyle,
  };
  const scoreResult = calculateHealthScore(scoreInput);
  entryData.healthScore = {
    overall: scoreResult.overall,
    grade: scoreResult.grade,
    breakdown: scoreResult.breakdown,
    trend: "stable",
  };

  // Add risk flags
  const riskFlags = [];
  if (bloodPressure?.systolic > 180 || bloodPressure?.diastolic > 120) {
    riskFlags.push({
      type: "hypertensive_crisis",
      severity: "critical",
      message: "Hypertensive crisis detected — seek emergency care.",
    });
  } else if (bloodPressure?.systolic >= 140) {
    riskFlags.push({
      type: "hypertension",
      severity: "high",
      message: "High blood pressure Stage 2 detected.",
    });
  }
  if (glucose?.value > 200) {
    riskFlags.push({
      type: "hyperglycemia",
      severity: "high",
      message: "Blood sugar critically high.",
    });
  }
  if (glucose?.value < 70) {
    riskFlags.push({
      type: "hypoglycemia",
      severity: "high",
      message: "Blood sugar dangerously low.",
    });
  }
  entryData.riskFlags = riskFlags;

  const entry = await HealthData.create(entryData);

  // Update user cached values
  if (scoreResult.overall !== null) {
    await User.findByIdAndUpdate(req.userId, {
      latestHealthScore: scoreResult.overall,
      latestBMI: entry.bmi?.value,
    });
  }

  res.status(201).json({
    success: true,
    message: "Vitals logged successfully",
    data: { entry },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get dashboard summary
// @route   GET /api/health/dashboard
// @access  Private
// ─────────────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Latest entry
  const latest = await HealthData.getLatestForUser(userId);

  // Last 7 entries for mini trends
  const recent7 = await HealthData.find({ userId })
    .sort({ logDate: -1 })
    .limit(7)
    .select("bloodPressure glucose bmi vitals healthScore logDate weight");

  // Count entries this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const entriesThisMonth = await HealthData.countDocuments({
    userId,
    logDate: { $gte: startOfMonth },
  });

  // Previous entry for trend comparison
  const previous = await HealthData.findOne({ userId })
    .sort({ logDate: -1 })
    .skip(1)
    .select("healthScore bmi bloodPressure glucose");

  // Build trends
  const trend = {};
  if (latest && previous) {
    if (latest.healthScore?.overall && previous.healthScore?.overall) {
      const diff = latest.healthScore.overall - previous.healthScore.overall;
      trend.healthScore = {
        diff,
        direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      };
    }
    if (latest.bmi?.value && previous.bmi?.value) {
      const diff = parseFloat(
        (latest.bmi.value - previous.bmi.value).toFixed(1),
      );
      trend.bmi = {
        diff,
        direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      };
    }
  }

  res.status(200).json({
    success: true,
    data: {
      latest,
      recent: recent7.reverse(), // chronological for charts
      trend,
      stats: {
        entriesThisMonth,
        totalEntries: await HealthData.countDocuments({ userId }),
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get analytics / trend data
// @route   GET /api/health/analytics
// @access  Private
// ─────────────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const days = parseInt(req.query.days) || 30;

  const data = await HealthData.getTrendData(userId, days);

  // Build chart-ready series
  const bpSeries = [];
  const glucoseSeries = [];
  const weightSeries = [];
  const scoreSeries = [];
  const heartRateSeries = [];

  data.forEach((entry) => {
    const date = entry.logDate.toISOString().split("T")[0];
    if (entry.bloodPressure?.systolic) {
      bpSeries.push({
        date,
        systolic: entry.bloodPressure.systolic,
        diastolic: entry.bloodPressure.diastolic,
      });
    }
    if (entry.glucose?.value) {
      glucoseSeries.push({
        date,
        value: entry.glucose.value,
        state: entry.glucose.mealState,
      });
    }
    if (entry.weight?.value) {
      weightSeries.push({ date, value: entry.weight.value });
    }
    if (entry.healthScore?.overall) {
      scoreSeries.push({
        date,
        score: entry.healthScore.overall,
        grade: entry.healthScore.grade,
      });
    }
    if (entry.vitals?.heartRate) {
      heartRateSeries.push({ date, bpm: entry.vitals.heartRate });
    }
  });

  // Summary stats
  const calcStats = (arr) => {
    if (!arr.length) return null;
    const vals = arr
      .map((d) => d.value || d.systolic || d.score || d.bpm)
      .filter(Boolean);
    if (!vals.length) return null;
    return {
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: parseFloat(
        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      ),
    };
  };

  res.status(200).json({
    success: true,
    data: {
      period: `${days} days`,
      series: {
        bpSeries,
        glucoseSeries,
        weightSeries,
        scoreSeries,
        heartRateSeries,
      },
      stats: {
        bp: bpSeries.length
          ? {
              min: Math.min(...bpSeries.map((d) => d.systolic)),
              max: Math.max(...bpSeries.map((d) => d.systolic)),
              avg: parseFloat(
                (
                  bpSeries.reduce((a, b) => a + b.systolic, 0) / bpSeries.length
                ).toFixed(1),
              ),
            }
          : null,
        glucose: calcStats(glucoseSeries),
        weight: calcStats(weightSeries),
        score: calcStats(scoreSeries),
        heartRate: calcStats(heartRateSeries),
      },
      totalEntries: data.length,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get health history (paginated)
// @route   GET /api/health/history
// @access  Private
// ─────────────────────────────────────────────────────────────
const getHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await HealthData.countDocuments({ userId: req.userId });
  const entries = await HealthData.find({ userId: req.userId })
    .sort({ logDate: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: {
      entries,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get a single health entry
// @route   GET /api/health/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getEntry = asyncHandler(async (req, res, next) => {
  const entry = await HealthData.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!entry) return next(new AppError("Health entry not found", 404));

  res.status(200).json({ success: true, data: { entry } });
});

// ─────────────────────────────────────────────────────────────
// @desc    Delete a health entry
// @route   DELETE /api/health/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteEntry = asyncHandler(async (req, res, next) => {
  const entry = await HealthData.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!entry) return next(new AppError("Health entry not found", 404));

  res
    .status(200)
    .json({ success: true, message: "Entry deleted successfully" });
});

module.exports = {
  logVitals,
  getDashboard,
  getAnalytics,
  getHistory,
  getEntry,
  deleteEntry,
};
