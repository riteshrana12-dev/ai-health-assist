const express = require("express");
const router = express.Router();

const {
  addMedication,
  getMedications,
  getTodayMeds,
  getMedication,
  updateMedication,
  deleteMedication,
  logDose,
} = require("../controllers/medicationController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", addMedication);
router.get("/", getMedications); // ?active=true&category=antibiotic
router.get("/today", getTodayMeds);
router.get("/:id", getMedication);
router.put("/:id", updateMedication);
router.delete("/:id", deleteMedication);
router.post("/:id/log", logDose);

module.exports = router;
