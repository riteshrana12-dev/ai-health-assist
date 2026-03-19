const express = require("express");
const router = express.Router();

const {
  logVitals,
  getDashboard,
  getAnalytics,
  getHistory,
  getEntry,
  deleteEntry,
} = require("../controllers/healthController");

const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

router.post("/", logVitals); // log new vitals
router.get("/dashboard", getDashboard); // dashboard summary
router.get("/analytics", getAnalytics); // trend data (query: ?days=30)
router.get("/history", getHistory); // paginated history
router.get("/:id", getEntry); // single entry
router.delete("/:id", deleteEntry); // delete entry

module.exports = router;
