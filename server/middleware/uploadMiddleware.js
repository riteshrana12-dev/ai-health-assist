const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const { AppError } = require("./errorHandler");

// ── Allowed MIME types ────────────────────────────────────────
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Multer memory storage ─────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, JPG, PNG, WEBP`,
        400,
      ),
      false,
    );
  }
};

// ── Multer instance ───────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Upload buffer to Cloudinary via stream ────────────────────
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaults = {
      folder: "ai-health-assist/reports",
      resource_type: "auto",
      allowed_formats: ["pdf", "jpg", "jpeg", "png", "webp"],
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      defaults,
      (error, result) => {
        if (error)
          reject(
            new AppError(`Cloudinary upload failed: ${error.message}`, 500),
          );
        else resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ── Delete from Cloudinary ────────────────────────────────────
const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

// ── Middleware: Process uploaded file ─────────────────────────
// Attaches cloudinaryResult to req.cloudinary
const processUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const isPDF = req.file.mimetype === "application/pdf";
    const resourceType = isPDF ? "raw" : "image";

    const options = {
      folder: "ai-health-assist/reports",
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    };

    // For images: generate thumbnail too
    if (!isPDF) {
      options.eager = [
        { width: 300, height: 300, crop: "fill", quality: "auto" },
      ];
      options.eager_async = false;
    }

    const result = await uploadToCloudinary(req.file.buffer, options);

    req.cloudinary = {
      url: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: result.eager?.[0]?.secure_url || null,
      format: result.format,
      size: result.bytes,
      resourceType: result.resource_type,
    };

    next();
  } catch (err) {
    next(err);
  }
};

// ── Multer error handler ──────────────────────────────────────
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  processUpload,
  handleMulterError,
};
