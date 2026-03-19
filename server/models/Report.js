const mongoose = require("mongoose");

// ── Sub-schema: AI Analysis ───────────────────────────────────
const aiAnalysisSchema = new mongoose.Schema(
  {
    // Plain-language summary of the report
    summary: {
      type: String,
      trim: true,
      default: "",
    },

    // Structured key findings extracted by Gemini
    keyFindings: [
      {
        parameter: { type: String, trim: true }, // e.g. "Hemoglobin"
        value: { type: String, trim: true }, // e.g. "11.2 g/dL"
        normalRange: { type: String, trim: true }, // e.g. "12-16 g/dL"
        status: {
          type: String,
          enum: [
            "normal",
            "low",
            "high",
            "critical_low",
            "critical_high",
            "unknown",
          ],
          default: "unknown",
        },
        explanation: { type: String, trim: true }, // simple language explanation
      },
    ],

    // Risk assessment
    riskLevel: {
      type: String,
      enum: ["low", "moderate", "high", "critical", "unknown"],
      default: "unknown",
    },
    riskFactors: [{ type: String, trim: true }],

    // AI-generated recommendations
    recommendations: [{ type: String, trim: true }],

    // Urgent flags that need immediate attention
    urgentFlags: [
      {
        finding: { type: String, trim: true },
        severity: { type: String, enum: ["warning", "urgent", "emergency"] },
        action: { type: String, trim: true },
      },
    ],

    // Preventive suggestions
    preventiveSuggestions: [{ type: String, trim: true }],

    // Report type identified by AI
    reportType: {
      type: String,
      enum: [
        "blood_test",
        "urine_test",
        "lipid_panel",
        "liver_function",
        "kidney_function",
        "thyroid_panel",
        "diabetes_panel",
        "complete_blood_count",
        "xray",
        "mri",
        "ct_scan",
        "ecg",
        "prescription",
        "discharge_summary",
        "vaccination",
        "other",
      ],
      default: "other",
    },

    // Confidence score of AI analysis (0-1)
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
    },

    // Raw Gemini response (for debugging / re-processing)
    rawResponse: {
      type: String,
      select: false,
    },

    // When analysis was completed
    analyzedAt: { type: Date },

    // Status of AI processing
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    errorMessage: { type: String },
  },
  { _id: false },
);

// ── Sub-schema: Extracted Data ────────────────────────────────
const extractedDataSchema = new mongoose.Schema(
  {
    rawText: { type: String }, // OCR / PDF extracted text
    textLength: { type: Number, default: 0 },
    language: { type: String, default: "en" },
    extractionMethod: {
      type: String,
      enum: ["pdf_parse", "ocr_tesseract", "gemini_vision", "manual"],
    },
    extractedAt: { type: Date },
  },
  { _id: false },
);

// ── Main Report Schema ────────────────────────────────────────
const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // ── File Info ──────────────────────────────────────────
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"],
      required: [true, "File type is required"],
    },
    fileSize: { type: Number }, // bytes
    mimeType: { type: String },

    // ── Cloudinary Storage ─────────────────────────────────
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    thumbnailUrl: { type: String },
    cloudinaryPublicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
    },

    // ── Report Metadata ────────────────────────────────────
    title: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    reportDate: { type: Date },
    labName: { type: String, trim: true },
    doctorName: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],

    // ── Processing Status ──────────────────────────────────
    processingStatus: {
      type: String,
      enum: ["uploaded", "extracting", "analyzing", "completed", "failed"],
      default: "uploaded",
    },

    // ── Extracted Text ─────────────────────────────────────
    extractedData: extractedDataSchema,

    // ── AI Analysis ────────────────────────────────────────
    aiAnalysis: aiAnalysisSchema,

    // ── User Actions ───────────────────────────────────────
    isStarred: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date },

    // ── Sharing ────────────────────────────────────────────
    shareToken: { type: String, select: false },
    isShared: { type: Boolean, default: false },
    sharedWith: [{ type: String, trim: true }], // emails
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ───────────────────────────────────────────────────
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, "aiAnalysis.riskLevel": 1 });
reportSchema.index({ userId: 1, isArchived: 1 });
reportSchema.index({ tags: 1 });

// ── Virtuals ──────────────────────────────────────────────────
reportSchema.virtual("fileSizeReadable").get(function () {
  if (!this.fileSize) return "Unknown";
  const kb = this.fileSize / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
});

reportSchema.virtual("isImage").get(function () {
  return this.fileType?.startsWith("image/");
});

reportSchema.virtual("isPDF").get(function () {
  return this.fileType === "pdf";
});

reportSchema.virtual("analysisComplete").get(function () {
  return this.aiAnalysis?.status === "completed";
});

// ── Pre-save: Set title from fileName ─────────────────────────
reportSchema.pre("save", async function () {
  if (!this.title && this.fileName) {
    this.title = this.fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
});

// ── Instance: Increment view count ────────────────────────────
reportSchema.methods.recordView = async function () {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// ── Static: Get reports by risk level ─────────────────────────
reportSchema.statics.getByRiskLevel = function (userId, riskLevel) {
  return this.find({
    userId,
    "aiAnalysis.riskLevel": riskLevel,
    isArchived: false,
  }).sort({ createdAt: -1 });
};

// ── Static: Get recent reports ────────────────────────────────
reportSchema.statics.getRecentForUser = function (userId, limit = 5) {
  return this.find({ userId, isArchived: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "fileName fileType aiAnalysis.riskLevel aiAnalysis.status aiAnalysis.summary thumbnailUrl createdAt processingStatus",
    );
};

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
