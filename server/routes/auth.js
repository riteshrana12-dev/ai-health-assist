const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Avatar upload — memory storage (streamed to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// ── Public Routes ─────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Protected Routes ──────────────────────────────────────────
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);

// ── Health check ──────────────────────────────────────────────
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

module.exports = router;
