const Medication = require("../models/Medication");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

// ─────────────────────────────────────────────────────────────
// @desc    Add new medication
// @route   POST /api/medications
// @access  Private
// ─────────────────────────────────────────────────────────────
const addMedication = asyncHandler(async (req, res, next) => {
  const {
    name,
    genericName,
    brandName,
    category,
    purpose,
    color,
    dosage,
    schedule,
    startDate,
    endDate,
    isOngoing,
    duration,
    prescribedBy,
    prescribedDate,
    indication,
    sideEffects,
    warnings,
    interactions,
    refillInfo,
    reminders,
    notes,
  } = req.body;

  if (!name) return next(new AppError("Medication name is required", 400));
  if (!dosage) return next(new AppError("Dosage information is required", 400));
  if (!schedule) return next(new AppError("Schedule is required", 400));

  const medication = await Medication.create({
    userId: req.userId,
    name: name.trim(),
    genericName,
    brandName,
    category,
    purpose,
    color: color || "#3B82F6",
    dosage,
    schedule,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : undefined,
    isOngoing: isOngoing || false,
    duration,
    prescribedBy,
    prescribedDate,
    indication,
    sideEffects: sideEffects || [],
    warnings: warnings || [],
    interactions: interactions || [],
    refillInfo,
    reminders: reminders || {},
    notes,
  });

  res.status(201).json({
    success: true,
    message: "Medication added successfully",
    data: { medication },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get all medications for user
// @route   GET /api/medications
// @access  Private
// ─────────────────────────────────────────────────────────────
const getMedications = asyncHandler(async (req, res) => {
  const { active, category } = req.query;

  const query = { userId: req.userId };
  if (active !== undefined) query.isActive = active === "true";
  if (category) query.category = category;

  const medications = await Medication.find(query).sort({ createdAt: -1 });

  const adherenceSummary = await Medication.getAdherenceSummary(req.userId);

  res.status(200).json({
    success: true,
    data: {
      medications,
      adherenceSummary,
      counts: {
        total: medications.length,
        active: medications.filter((m) => m.isActive).length,
        inactive: medications.filter((m) => !m.isActive).length,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get today's medications with schedule
// @route   GET /api/medications/today
// @access  Private
// ─────────────────────────────────────────────────────────────
const getTodayMeds = asyncHandler(async (req, res) => {
  const meds = await Medication.getTodayMeds(req.userId);

  // Build time-sorted schedule for today
  const schedule = [];
  const now = new Date();

  meds.forEach((med) => {
    const times = med.schedule?.times || [];
    times.forEach((t) => {
      const [hour, minute] = (t.time || "08:00").split(":").map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(hour, minute, 0, 0);

      schedule.push({
        medicationId: med._id,
        name: med.name,
        dosage: med.dosageReadable,
        color: med.color,
        time: t.time,
        label: t.label || "",
        scheduledDate,
        isPast: scheduledDate < now,
        isTaken: false, // will be computed from adherenceLogs if needed
      });
    });
  });

  schedule.sort((a, b) => a.scheduledDate - b.scheduledDate);

  res.status(200).json({
    success: true,
    data: { schedule, total: schedule.length },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get single medication
// @route   GET /api/medications/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getMedication = asyncHandler(async (req, res, next) => {
  const med = await Medication.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!med) return next(new AppError("Medication not found", 404));
  res.status(200).json({ success: true, data: { medication: med } });
});

// ─────────────────────────────────────────────────────────────
// @desc    Update medication
// @route   PUT /api/medications/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const updateMedication = asyncHandler(async (req, res, next) => {
  const med = await Medication.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!med) return next(new AppError("Medication not found", 404));

  const allowed = [
    "name",
    "genericName",
    "brandName",
    "category",
    "purpose",
    "color",
    "dosage",
    "schedule",
    "endDate",
    "isOngoing",
    "duration",
    "prescribedBy",
    "prescribedDate",
    "indication",
    "sideEffects",
    "warnings",
    "interactions",
    "refillInfo",
    "reminders",
    "notes",
    "specialStorage",
    "isActive",
    "pausedReason",
    "discontinuedReason",
  ];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) med[field] = req.body[field];
  });

  if (req.body.isActive === false && !med.discontinuedAt) {
    med.discontinuedAt = new Date();
    med.discontinuedReason = req.body.discontinuedReason || "Stopped by user";
  }

  await med.save();

  res.status(200).json({
    success: true,
    message: "Medication updated successfully",
    data: { medication: med },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Delete medication
// @route   DELETE /api/medications/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteMedication = asyncHandler(async (req, res, next) => {
  const med = await Medication.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!med) return next(new AppError("Medication not found", 404));
  res
    .status(200)
    .json({ success: true, message: "Medication deleted successfully" });
});

// ─────────────────────────────────────────────────────────────
// @desc    Log a dose (taken / missed / skipped)
// @route   POST /api/medications/:id/log
// @access  Private
// ─────────────────────────────────────────────────────────────
const logDose = asyncHandler(async (req, res, next) => {
  const { status, scheduledTime, notes } = req.body;
  const validStatuses = ["taken", "missed", "skipped", "late"];

  if (!validStatuses.includes(status)) {
    return next(
      new AppError(`Status must be one of: ${validStatuses.join(", ")}`, 400),
    );
  }

  const med = await Medication.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!med) return next(new AppError("Medication not found", 404));

  await med.logDose(status, new Date(scheduledTime || Date.now()), notes);

  res.status(200).json({
    success: true,
    message: `Dose marked as ${status}`,
    adherenceRate: med.adherenceRate,
  });
});

module.exports = {
  addMedication,
  getMedications,
  getTodayMeds,
  getMedication,
  updateMedication,
  deleteMedication,
  logDose,
};
