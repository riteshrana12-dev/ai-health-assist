const mongoose = require("mongoose");

// ── Sub-schema: Blood Pressure ────────────────────────────────
const bloodPressureSchema = new mongoose.Schema(
  {
    systolic: { type: Number, min: 60, max: 300 }, // mmHg
    diastolic: { type: Number, min: 30, max: 200 }, // mmHg
    pulse: { type: Number, min: 30, max: 250 }, // bpm
    category: {
      type: String,
      enum: [
        "normal", // <120/80
        "elevated", // 120-129/<80
        "high_stage1", // 130-139/80-89
        "high_stage2", // >=140/>=90
        "hypertensive_crisis", // >180/>120
        "low", // <90/60
      ],
    },
  },
  { _id: false },
);

// ── Sub-schema: Glucose ───────────────────────────────────────
const glucoseSchema = new mongoose.Schema(
  {
    value: { type: Number, min: 0, max: 1000 }, // mg/dL
    unit: { type: String, enum: ["mg/dL", "mmol/L"], default: "mg/dL" },
    mealState: {
      type: String,
      enum: ["fasting", "post_meal", "random", "bedtime"],
      default: "random",
    },
    category: {
      type: String,
      enum: ["normal", "prediabetes", "diabetes", "hypoglycemia"],
    },
  },
  { _id: false },
);

// ── Sub-schema: Vitals ────────────────────────────────────────
const vitalsSchema = new mongoose.Schema(
  {
    heartRate: { type: Number, min: 20, max: 300 }, // bpm
    oxygenSaturation: { type: Number, min: 50, max: 100 }, // %
    respiratoryRate: { type: Number, min: 5, max: 60 }, // breaths/min
    bodyTemperature: {
      value: { type: Number, min: 30, max: 45 }, // °C
      unit: {
        type: String,
        enum: ["celsius", "fahrenheit"],
        default: "celsius",
      },
    },
  },
  { _id: false },
);

// ── Sub-schema: Lifestyle Entry ───────────────────────────────
const lifestyleEntrySchema = new mongoose.Schema(
  {
    stepsCount: { type: Number, min: 0 },
    sleepHours: { type: Number, min: 0, max: 24 },
    sleepQuality: { type: String, enum: ["poor", "fair", "good", "excellent"] },
    waterIntake: { type: Number, min: 0 }, // ml
    caloriesConsumed: { type: Number, min: 0 },
    exerciseMinutes: { type: Number, min: 0 },
    exerciseType: { type: String, trim: true },
    stressLevel: { type: Number, min: 1, max: 10 },
    mood: {
      type: String,
      enum: ["terrible", "bad", "neutral", "good", "excellent"],
    },
  },
  { _id: false },
);

// ── Main HealthData Schema ────────────────────────────────────
const healthDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // ── Body Measurements ──────────────────────────────────
    weight: {
      value: { type: Number, min: 0, max: 700 },
      unit: { type: String, enum: ["kg", "lbs"], default: "kg" },
    },
    height: {
      value: { type: Number, min: 0, max: 300 },
      unit: { type: String, enum: ["cm", "ft"], default: "cm" },
    },
    bmi: {
      value: { type: Number, min: 0, max: 100 },
      category: {
        type: String,
        enum: [
          "underweight",
          "normal",
          "overweight",
          "obese_class1",
          "obese_class2",
          "obese_class3",
        ],
      },
    },
    waistCircumference: { type: Number, min: 0 }, // cm
    bodyFatPercentage: { type: Number, min: 0, max: 100 },

    // ── Clinical Measurements ──────────────────────────────
    bloodPressure: bloodPressureSchema,
    glucose: glucoseSchema,
    vitals: vitalsSchema,

    // ── Lab Values ─────────────────────────────────────────
    labValues: {
      cholesterolTotal: { type: Number, min: 0 }, // mg/dL
      cholesterolLDL: { type: Number, min: 0 },
      cholesterolHDL: { type: Number, min: 0 },
      triglycerides: { type: Number, min: 0 },
      hemoglobin: { type: Number, min: 0 }, // g/dL
      hba1c: { type: Number, min: 0, max: 20 }, // %
      creatinine: { type: Number, min: 0 },
      uricAcid: { type: Number, min: 0 },
    },

    // ── Lifestyle ──────────────────────────────────────────
    lifestyle: lifestyleEntrySchema,

    // ── AI-Generated Health Score ──────────────────────────
    healthScore: {
      overall: {
        type: Number,
        min: 0,
        max: 100,
      },
      breakdown: {
        bmiScore: { type: Number, min: 0, max: 100 },
        bpScore: { type: Number, min: 0, max: 100 },
        glucoseScore: { type: Number, min: 0, max: 100 },
        lifestyleScore: { type: Number, min: 0, max: 100 },
        vitalsScore: { type: Number, min: 0, max: 100 },
      },
      grade: {
        type: String,
        enum: ["A", "B", "C", "D", "F"],
      },
      trend: {
        type: String,
        enum: ["improving", "stable", "declining"],
      },
      aiInsights: { type: String }, // Gemini-generated personalized tip
    },

    // ── Risk Flags ─────────────────────────────────────────
    riskFlags: [
      {
        type: { type: String }, // e.g. 'hypertension', 'diabetes_risk'
        severity: {
          type: String,
          enum: ["low", "moderate", "high", "critical"],
        },
        message: { type: String },
      },
    ],

    // ── Entry Metadata ─────────────────────────────────────
    entryType: {
      type: String,
      enum: ["manual", "device_sync", "report_extracted", "ai_estimated"],
      default: "manual",
    },
    notes: { type: String, trim: true, maxlength: 500 },
    logDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Compound Indexes ──────────────────────────────────────────
healthDataSchema.index({ userId: 1, logDate: -1 });
healthDataSchema.index({ userId: 1, createdAt: -1 });
healthDataSchema.index({ userId: 1, "healthScore.overall": -1 });

// ── Pre-save: Auto-calculate BMI ──────────────────────────────
// ── Pre-save: Auto-calculate BMI, categorize BP and Glucose ───
// Single async hook — no next() parameter needed
// Mongoose resolves async pre-save hooks via the returned Promise
healthDataSchema.pre("save", async function () {
  // Auto-calculate BMI
  if (this.weight?.value && this.height?.value) {
    const heightM = this.height.value / 100;
    const bmi = parseFloat(
      (this.weight.value / (heightM * heightM)).toFixed(1),
    );
    if (!this.bmi) this.bmi = {};
    this.bmi.value = bmi;
    if (bmi < 18.5) this.bmi.category = "underweight";
    else if (bmi < 25.0) this.bmi.category = "normal";
    else if (bmi < 30.0) this.bmi.category = "overweight";
    else if (bmi < 35.0) this.bmi.category = "obese_class1";
    else if (bmi < 40.0) this.bmi.category = "obese_class2";
    else this.bmi.category = "obese_class3";
  }

  // Auto-categorize Blood Pressure
  if (this.bloodPressure?.systolic && this.bloodPressure?.diastolic) {
    const s = this.bloodPressure.systolic;
    const d = this.bloodPressure.diastolic;
    if (s > 180 || d > 120) this.bloodPressure.category = "hypertensive_crisis";
    else if (s >= 140 || d >= 90) this.bloodPressure.category = "high_stage2";
    else if (s >= 130 || d >= 80) this.bloodPressure.category = "high_stage1";
    else if (s >= 120 && d < 80) this.bloodPressure.category = "elevated";
    else if (s < 90 || d < 60) this.bloodPressure.category = "low";
    else this.bloodPressure.category = "normal";
  }

  // Auto-categorize Glucose
  if (this.glucose?.value) {
    const value = this.glucose.value;
    const mealState = this.glucose.mealState;
    if (mealState === "fasting") {
      if (value < 70) this.glucose.category = "hypoglycemia";
      else if (value < 100) this.glucose.category = "normal";
      else if (value < 126) this.glucose.category = "prediabetes";
      else this.glucose.category = "diabetes";
    } else {
      if (value < 70) this.glucose.category = "hypoglycemia";
      else if (value < 140) this.glucose.category = "normal";
      else if (value < 200) this.glucose.category = "prediabetes";
      else this.glucose.category = "diabetes";
    }
  }
});

// ── Virtuals ──────────────────────────────────────────────────
healthDataSchema.virtual("bpReadable").get(function () {
  if (this.bloodPressure?.systolic && this.bloodPressure?.diastolic) {
    return `${this.bloodPressure.systolic}/${this.bloodPressure.diastolic} mmHg`;
  }
  return null;
});

// ── Static: Get latest entry for a user ───────────────────────
healthDataSchema.statics.getLatestForUser = function (userId) {
  return this.findOne({ userId }).sort({ logDate: -1 });
};

// ── Static: Get trend data ────────────────────────────────────
healthDataSchema.statics.getTrendData = function (userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return this.find({ userId, logDate: { $gte: since } })
    .sort({ logDate: 1 })
    .select("bloodPressure glucose bmi vitals healthScore logDate weight");
};

const HealthData = mongoose.model("HealthData", healthDataSchema);
module.exports = HealthData;
