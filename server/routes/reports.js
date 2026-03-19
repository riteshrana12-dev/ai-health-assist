const express = require("express");
const router = express.Router();

const {
  uploadReport,
  getReports,
  getReport,
  deleteReport,
  toggleStar,
  reAnalyze,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");
const {
  upload,
  processUpload,
  handleMulterError,
} = require("../middleware/uploadMiddleware");

// All routes protected
router.use(protect);

router.post(
  "/upload",
  upload.single("report"),
  handleMulterError,
  processUpload,
  uploadReport,
);
router.get("/", getReports);
router.get("/:id", getReport);
router.delete("/:id", deleteReport);
router.patch("/:id/star", toggleStar);
router.post("/:id/analyze", reAnalyze);

module.exports = router;
