const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned in queries by default
    },

    // ── Profile ─────────────────────────────────────────────
    profilePic: {
      type: String,
      default: "",
    },
    profilePicPublicId: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [150, "Age seems too high"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-()]{7,15}$/, "Please provide a valid phone number"],
    },

    // ── Medical Profile ─────────────────────────────────────
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },
    height: {
      value: { type: Number, min: 0, max: 300 }, // cm
      unit: { type: String, enum: ["cm", "ft"], default: "cm" },
    },
    weight: {
      value: { type: Number, min: 0, max: 700 }, // kg
      unit: { type: String, enum: ["kg", "lbs"], default: "kg" },
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicalHistory: [
      {
        condition: { type: String, trim: true },
        diagnosedAt: { type: Date },
        status: {
          type: String,
          enum: ["active", "resolved", "chronic"],
          default: "active",
        },
        notes: { type: String, trim: true },
      },
    ],
    currentMedications: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
    },

    // ── Lifestyle ────────────────────────────────────────────
    lifestyle: {
      smokingStatus: {
        type: String,
        enum: ["never", "former", "current", "unknown"],
        default: "unknown",
      },
      alcoholConsumption: {
        type: String,
        enum: ["none", "occasional", "moderate", "heavy", "unknown"],
        default: "unknown",
      },
      exerciseFrequency: {
        type: String,
        enum: [
          "sedentary",
          "light",
          "moderate",
          "active",
          "very_active",
          "unknown",
        ],
        default: "unknown",
      },
      dietType: {
        type: String,
        enum: ["omnivore", "vegetarian", "vegan", "keto", "other", "unknown"],
        default: "unknown",
      },
      sleepHours: {
        type: Number,
        min: 0,
        max: 24,
      },
    },

    // ── App Settings ─────────────────────────────────────────
    settings: {
      theme: {
        type: String,
        enum: ["dark", "light", "system"],
        default: "dark",
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        medicationReminders: { type: Boolean, default: true },
      },
      units: {
        weight: { type: String, enum: ["kg", "lbs"], default: "kg" },
        height: { type: String, enum: ["cm", "ft"], default: "cm" },
        temperature: {
          type: String,
          enum: ["celsius", "fahrenheit"],
          default: "celsius",
        },
        glucose: { type: String, enum: ["mg/dL", "mmol/L"], default: "mg/dL" },
      },
    },

    // ── Auth & Security ──────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ── Computed / Cached ────────────────────────────────────
    latestHealthScore: { type: Number, min: 0, max: 100 },
    latestBMI: { type: Number },
    totalReports: { type: Number, default: 0 },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ───────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

// ── Virtuals ──────────────────────────────────────────────────
userSchema.virtual("fullName").get(function () {
  return this.name;
});

userSchema.virtual("bmi").get(function () {
  if (this.height?.value && this.weight?.value) {
    const heightM = this.height.value / 100;
    return parseFloat((this.weight.value / (heightM * heightM)).toFixed(1));
  }
  return null;
});

userSchema.virtual("ageFromDOB").get(function () {
  if (this.dateOfBirth) {
    const today = new Date();
    const dob = new Date(this.dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }
  return this.age || null;
});

// ── Pre-save: Hash Password ───────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ── Instance Methods ──────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

// ── Static Methods ────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
