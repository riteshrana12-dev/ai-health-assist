const mongoose = require("mongoose");

// ── Sub-schema: Dosage ────────────────────────────────────────
const dosageSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Dosage amount is required"],
      min: [0, "Dosage cannot be negative"],
    },
    unit: {
      type: String,
      enum: [
        "mg",
        "mcg",
        "g",
        "ml",
        "IU",
        "tablet",
        "capsule",
        "drop",
        "puff",
        "unit",
      ],
      default: "mg",
    },
    form: {
      type: String,
      enum: [
        "tablet",
        "capsule",
        "liquid",
        "injection",
        "patch",
        "inhaler",
        "drops",
        "cream",
        "other",
      ],
      default: "tablet",
    },
    instructions: { type: String, trim: true }, // e.g. "Take with food"
  },
  { _id: false },
);

// ── Sub-schema: Schedule ──────────────────────────────────────
const scheduleSchema = new mongoose.Schema(
  {
    frequency: {
      type: String,
      enum: [
        "once_daily",
        "twice_daily",
        "three_times_daily",
        "four_times_daily",
        "every_other_day",
        "weekly",
        "bi_weekly",
        "monthly",
        "as_needed",
        "custom",
      ],
      default: "once_daily",
    },
    times: [
      {
        time: { type: String }, // "08:00", "14:00", "20:00"
        label: { type: String }, // "Morning", "Afternoon", "Evening"
      },
    ],
    // For custom frequency
    customIntervalHours: { type: Number },
    // Days of week (0=Sun, 6=Sat) for weekly schedules
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    // Meal relation
    withMeal: {
      type: String,
      enum: [
        "before_meal",
        "with_meal",
        "after_meal",
        "empty_stomach",
        "no_restriction",
      ],
      default: "no_restriction",
    },
  },
  { _id: false },
);

// ── Sub-schema: Adherence Log ─────────────────────────────────
const adherenceLogSchema = new mongoose.Schema(
  {
    scheduledTime: { type: Date, required: true },
    takenAt: { type: Date },
    status: {
      type: String,
      enum: ["taken", "missed", "skipped", "late"],
      default: "missed",
    },
    notes: { type: String, trim: true },
  },
  { _id: true, timestamps: false },
);

// ── Sub-schema: Refill Info ───────────────────────────────────
const refillSchema = new mongoose.Schema(
  {
    totalQuantity: { type: Number, min: 0 },
    remainingQuantity: { type: Number, min: 0 },
    refillAt: { type: Number, min: 0 }, // quantity threshold
    lastRefillDate: { type: Date },
    nextRefillDate: { type: Date },
    pharmacy: { type: String, trim: true },
    prescriptionId: { type: String, trim: true },
  },
  { _id: false },
);

// ── Main Medication Schema ────────────────────────────────────
const medicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // ── Drug Info ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Medication name is required"],
      trim: true,
      maxlength: [100, "Medication name cannot exceed 100 characters"],
    },
    genericName: { type: String, trim: true },
    brandName: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    category: {
      type: String,
      enum: [
        "antibiotic",
        "antihypertensive",
        "antidiabetic",
        "analgesic",
        "antihistamine",
        "antidepressant",
        "antianxiety",
        "vitamin_supplement",
        "cardiac",
        "respiratory",
        "gastrointestinal",
        "hormonal",
        "immunosuppressant",
        "other",
      ],
      default: "other",
    },
    purpose: { type: String, trim: true }, // "For blood pressure control"
    color: { type: String, default: "#3B82F6" }, // for UI pill display

    // ── Dosage & Schedule ──────────────────────────────────
    dosage: { type: dosageSchema, required: true },
    schedule: { type: scheduleSchema, required: true },

    // ── Duration ───────────────────────────────────────────
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: { type: Date },
    duration: {
      value: { type: Number },
      unit: {
        type: String,
        enum: ["days", "weeks", "months", "ongoing"],
        default: "days",
      },
    },
    isOngoing: { type: Boolean, default: false },

    // ── Status ─────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    pausedReason: { type: String, trim: true },
    pausedAt: { type: Date },
    discontinuedAt: { type: Date },
    discontinuedReason: { type: String, trim: true },

    // ── Prescriber ─────────────────────────────────────────
    prescribedBy: { type: String, trim: true },
    prescribedDate: { type: Date },
    indication: { type: String, trim: true }, // medical condition it treats

    // ── Side Effects & Warnings ────────────────────────────
    sideEffects: [{ type: String, trim: true }],
    warnings: [{ type: String, trim: true }],
    interactions: [{ type: String, trim: true }], // drug interactions
    contraindications: [{ type: String, trim: true }],

    // ── Refill Tracking ────────────────────────────────────
    refillInfo: refillSchema,

    // ── Adherence Tracking ─────────────────────────────────
    adherenceLogs: {
      type: [adherenceLogSchema],
      default: [],
      // Keep only last 90 days of logs
    },
    adherenceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    // ── Reminders ─────────────────────────────────────────
    reminders: {
      enabled: { type: Boolean, default: true },
      advanceMinutes: { type: Number, default: 15 }, // remind X min before
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true },
    },

    // ── Notes ─────────────────────────────────────────────
    notes: { type: String, trim: true, maxlength: 500 },
    specialStorage: { type: String, trim: true }, // "Refrigerate"
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ───────────────────────────────────────────────────
medicationSchema.index({ userId: 1, isActive: 1 });
medicationSchema.index({ userId: 1, createdAt: -1 });
medicationSchema.index({ userId: 1, "schedule.times.time": 1 });

// ── Virtuals ──────────────────────────────────────────────────
medicationSchema.virtual("isExpired").get(function () {
  if (!this.endDate) return false;
  return new Date() > new Date(this.endDate);
});

medicationSchema.virtual("daysRemaining").get(function () {
  if (!this.endDate || this.isOngoing) return null;
  const diff = new Date(this.endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

medicationSchema.virtual("dosageReadable").get(function () {
  if (!this.dosage) return "";
  return `${this.dosage.amount} ${this.dosage.unit} — ${this.dosage.form}`;
});

medicationSchema.virtual("needsRefill").get(function () {
  if (!this.refillInfo) return false;
  return (
    this.refillInfo.remainingQuantity !== undefined &&
    this.refillInfo.refillAt !== undefined &&
    this.refillInfo.remainingQuantity <= this.refillInfo.refillAt
  );
});

// ── Pre-save: Calculate adherence rate ───────────────────────
medicationSchema.pre("save", function (next) {
  if (this.adherenceLogs && this.adherenceLogs.length > 0) {
    const taken = this.adherenceLogs.filter(
      (l) => l.status === "taken" || l.status === "late",
    ).length;
    this.adherenceRate = Math.round((taken / this.adherenceLogs.length) * 100);
  }
  next();
});

// ── Pre-save: Auto set isOngoing ──────────────────────────────
medicationSchema.pre("save", function (next) {
  if (!this.endDate && this.duration?.unit === "ongoing") {
    this.isOngoing = true;
  }
  next();
});

// ── Instance: Log adherence ───────────────────────────────────
medicationSchema.methods.logDose = async function (
  status,
  scheduledTime,
  notes = "",
) {
  const log = {
    scheduledTime,
    takenAt: status === "taken" || status === "late" ? new Date() : undefined,
    status,
    notes,
  };
  this.adherenceLogs.push(log);
  // Trim logs older than 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  this.adherenceLogs = this.adherenceLogs.filter(
    (l) => l.scheduledTime >= cutoff,
  );
  return this.save();
};

// ── Static: Get today's medications ──────────────────────────
medicationSchema.statics.getTodayMeds = function (userId) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return this.find({
    userId,
    isActive: true,
    startDate: { $lte: today },
    $or: [
      { endDate: { $gte: today } },
      { endDate: { $exists: false } },
      { isOngoing: true },
    ],
  }).sort({ "schedule.times.0.time": 1 });
};

// ── Static: Get adherence summary ────────────────────────────
medicationSchema.statics.getAdherenceSummary = async function (userId) {
  const meds = await this.find({ userId, isActive: true });
  if (!meds.length) return { overall: 100, medications: [] };

  const overall = Math.round(
    meds.reduce((sum, m) => sum + (m.adherenceRate || 100), 0) / meds.length,
  );

  return {
    overall,
    medications: meds.map((m) => ({
      name: m.name,
      adherenceRate: m.adherenceRate,
    })),
  };
};

const Medication = mongoose.model("Medication", medicationSchema);
module.exports = Medication;
