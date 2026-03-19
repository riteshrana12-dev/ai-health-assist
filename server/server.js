require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ── Route imports ─────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const chatRoutes = require("./routes/chat");
const reportRoutes = require("./routes/reports");
const medicationRoutes = require("./routes/medications");

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ═════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═════════════════════════════════════════════════════════════

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", globalLimiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: {
    success: false,
    message: "Too many auth attempts. Please wait 15 minutes.",
  },
});

// AI routes limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 15,
  message: {
    success: false,
    message: "AI rate limit reached. Please wait a moment.",
  },
});

// ═════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Health Assist API is running 🚀",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/health-data", healthRoutes);
app.use("/api/chat", aiLimiter, chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/medications", medicationRoutes);

// ─────────────────────────────────────────────────────────────
// SCHEDULED JOBS (node-cron)
// ─────────────────────────────────────────────────────────────

// Daily medication reminder check — runs every hour
cron.schedule("0 * * * *", async () => {
  try {
    const Medication = require("./models/Medication");
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Find medications scheduled for the current hour
    const dueMeds = await Medication.find({
      isActive: true,
      "schedule.times.time": {
        $regex: `^${String(now.getHours()).padStart(2, "0")}:`,
      },
    }).populate("userId", "name email settings");

    if (dueMeds.length > 0) {
      console.log(
        `⏰ ${dueMeds.length} medication reminder(s) due at ${currentTime}`,
      );
      // In production: send push notifications / emails here
    }
  } catch (err) {
    console.error("Cron job error:", err.message);
  }
});

// Clean expired conversation cache every 30 minutes
cron.schedule("*/30 * * * *", () => {
  console.log("🧹 Clearing expired conversation caches");
});

// ─────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 AI Health Assist API running on port ${PORT}`);
  console.log(`📍 Environment : ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received — shutting down gracefully");
  server.close(() => console.log("Server closed"));
});

module.exports = app;
