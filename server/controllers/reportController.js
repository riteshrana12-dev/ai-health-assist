const Report = require("../models/Report");
const User = require("../models/User");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { deleteFromCloudinary } = require("../middleware/uploadMiddleware");

// ─────────────────────────────────────────────────────────────
// @desc    Upload and analyze a medical report
// @route   POST /api/reports/upload
// @access  Private
// ─────────────────────────────────────────────────────────────
const uploadReport = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError("No file uploaded", 400));
  if (!req.cloudinary)
    return next(new AppError("File upload to storage failed", 500));

  const { title, description, reportDate, labName, doctorName, tags } =
    req.body;

  const isPDF = req.file.mimetype === "application/pdf";

  // 1. Save report record
  const report = await Report.create({
    userId: req.userId,
    fileName: req.file.originalname.replace(/\s+/g, "_"),
    originalName: req.file.originalname,
    fileType: isPDF ? "pdf" : req.file.mimetype,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    fileUrl: req.cloudinary.url,
    thumbnailUrl: req.cloudinary.thumbnailUrl,
    cloudinaryPublicId: req.cloudinary.publicId,
    title: title || undefined,
    description: description || undefined,
    reportDate: reportDate ? new Date(reportDate) : undefined,
    labName: labName || undefined,
    doctorName: doctorName || undefined,
    tags: tags ? JSON.parse(tags) : [],
    processingStatus: "uploaded",
    aiAnalysis: { status: "pending" },
  });

  // 2. Trigger async AI analysis (non-blocking)
  triggerAnalysis(
    report._id,
    req.file.buffer,
    req.file.mimetype,
    req.userId,
  ).catch((err) => console.error("Analysis trigger error:", err.message));

  // 3. Update user report count
  await User.findByIdAndUpdate(req.userId, { $inc: { totalReports: 1 } });

  res.status(201).json({
    success: true,
    message: "Report uploaded. AI analysis in progress…",
    data: { report },
  });
});

// ── Non-blocking: run AI analysis after upload ────────────────
const triggerAnalysis = async (reportId, fileBuffer, mimeType, userId) => {
  try {
    // Lazy-load geminiService to avoid circular deps
    const { analyzeReport } = require("../services/geminiService");

    await Report.findByIdAndUpdate(reportId, {
      processingStatus: "analyzing",
      "aiAnalysis.status": "processing",
    });

    const analysis = await analyzeReport(fileBuffer, mimeType);

    await Report.findByIdAndUpdate(reportId, {
      processingStatus: "completed",
      aiAnalysis: {
        ...analysis,
        status: "completed",
        analyzedAt: new Date(),
      },
      extractedData: analysis.extractedData || undefined,
    });
  } catch (err) {
    await Report.findByIdAndUpdate(reportId, {
      processingStatus: "failed",
      "aiAnalysis.status": "failed",
      "aiAnalysis.errorMessage": err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get all reports for user
// @route   GET /api/reports
// @access  Private
// ─────────────────────────────────────────────────────────────
const getReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const riskFilter = req.query.risk;
  const typeFilter = req.query.type;
  const starred = req.query.starred === "true";

  const query = { userId: req.userId, isArchived: false };
  if (riskFilter) query["aiAnalysis.riskLevel"] = riskFilter;
  if (typeFilter) query["aiAnalysis.reportType"] = typeFilter;
  if (starred) query.isStarred = true;

  const total = await Report.countDocuments(query);
  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select("-extractedData.rawText -aiAnalysis.rawResponse");

  res.status(200).json({
    success: true,
    data: {
      reports,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!report) return next(new AppError("Report not found", 404));

  await report.recordView();

  res.status(200).json({ success: true, data: { report } });
});

// ─────────────────────────────────────────────────────────────
// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!report) return next(new AppError("Report not found", 404));

  // Delete file from Cloudinary
  const resourceType = report.fileType === "pdf" ? "raw" : "image";
  await deleteFromCloudinary(report.cloudinaryPublicId, resourceType);

  await report.deleteOne();
  await User.findByIdAndUpdate(req.userId, { $inc: { totalReports: -1 } });

  res
    .status(200)
    .json({ success: true, message: "Report deleted successfully" });
});

// ─────────────────────────────────────────────────────────────
// @desc    Toggle star on report
// @route   PATCH /api/reports/:id/star
// @access  Private
// ─────────────────────────────────────────────────────────────
const toggleStar = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!report) return next(new AppError("Report not found", 404));

  report.isStarred = !report.isStarred;
  await report.save();

  res.status(200).json({
    success: true,
    isStarred: report.isStarred,
    message: report.isStarred ? "Report starred" : "Report unstarred",
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Re-trigger AI analysis on existing report
// @route   POST /api/reports/:id/analyze
// @access  Private
// ─────────────────────────────────────────────────────────────
const reAnalyze = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!report) return next(new AppError("Report not found", 404));

  await Report.findByIdAndUpdate(report._id, {
    processingStatus: "analyzing",
    "aiAnalysis.status": "processing",
  });

  // Re-analyze using file URL (pass null buffer — geminiService will use URL)
  const { analyzeReportFromUrl } = require("../services/geminiService");
  analyzeReportFromUrl(report.fileUrl, report.fileType, report._id).catch(
    (err) => console.error("Re-analysis error:", err.message),
  );

  res.status(200).json({
    success: true,
    message: "AI re-analysis started",
  });
});

module.exports = {
  uploadReport,
  getReports,
  getReport,
  deleteReport,
  toggleStar,
  reAnalyze,
};
