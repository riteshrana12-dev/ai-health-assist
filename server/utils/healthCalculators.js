// ── BMI Calculator ────────────────────────────────────────────
const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || heightCm === 0) return null;
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  let category, color, advice;
  if (bmi < 18.5) {
    category = "Underweight";
    color = "#3B82F6";
    advice = "Consider increasing caloric intake with nutrient-rich foods.";
  } else if (bmi < 25.0) {
    category = "Normal";
    color = "#22C55E";
    advice =
      "Great! Maintain your healthy weight with balanced diet and exercise.";
  } else if (bmi < 30.0) {
    category = "Overweight";
    color = "#EAB308";
    advice = "Consider moderate exercise and reducing processed food intake.";
  } else if (bmi < 35.0) {
    category = "Obese I";
    color = "#F97316";
    advice = "Consult a healthcare provider for a weight management plan.";
  } else if (bmi < 40.0) {
    category = "Obese II";
    color = "#EF4444";
    advice = "Medical supervision recommended for weight loss.";
  } else {
    category = "Obese III";
    color = "#DC2626";
    advice = "Urgent medical consultation advised.";
  }

  return { value: bmi, category, color, advice };
};

// ── Blood Pressure Categorizer ────────────────────────────────
const categorizeBP = (systolic, diastolic) => {
  if (!systolic || !diastolic) return null;

  let category, color, advice, severity;
  if (systolic > 180 || diastolic > 120) {
    category = "Hypertensive Crisis";
    color = "#DC2626";
    severity = "critical";
    advice = "Seek emergency care immediately.";
  } else if (systolic >= 140 || diastolic >= 90) {
    category = "High Stage 2";
    color = "#EF4444";
    severity = "high";
    advice = "Consult doctor urgently.";
  } else if (systolic >= 130 || diastolic >= 80) {
    category = "High Stage 1";
    color = "#F97316";
    severity = "moderate";
    advice = "Lifestyle changes and medical consultation needed.";
  } else if (systolic >= 120 && diastolic < 80) {
    category = "Elevated";
    color = "#EAB308";
    severity = "low";
    advice = "Adopt heart-healthy lifestyle changes.";
  } else if (systolic < 90 || diastolic < 60) {
    category = "Low";
    color = "#3B82F6";
    severity = "moderate";
    advice = "Stay hydrated and consult a doctor.";
  } else {
    category = "Normal";
    color = "#22C55E";
    severity = "none";
    advice = "Excellent! Keep maintaining healthy habits.";
  }

  return {
    category,
    color,
    severity,
    advice,
    reading: `${systolic}/${diastolic}`,
  };
};

// ── Glucose Categorizer ───────────────────────────────────────
const categorizeGlucose = (value, mealState = "fasting") => {
  if (!value) return null;

  let category, color, advice, severity;
  if (mealState === "fasting") {
    if (value < 70) {
      category = "Hypoglycemia";
      color = "#3B82F6";
      severity = "high";
      advice = "Eat fast-acting carbs immediately.";
    } else if (value < 100) {
      category = "Normal";
      color = "#22C55E";
      severity = "none";
      advice = "Your fasting glucose is healthy.";
    } else if (value < 126) {
      category = "Prediabetes";
      color = "#EAB308";
      severity = "moderate";
      advice = "Reduce sugar intake and increase activity.";
    } else {
      category = "Diabetes";
      color = "#EF4444";
      severity = "high";
      advice = "Consult your doctor immediately.";
    }
  } else {
    if (value < 70) {
      category = "Hypoglycemia";
      color = "#3B82F6";
      severity = "high";
      advice = "Eat fast-acting carbs immediately.";
    } else if (value < 140) {
      category = "Normal";
      color = "#22C55E";
      severity = "none";
      advice = "Post-meal glucose is well controlled.";
    } else if (value < 200) {
      category = "Prediabetes";
      color = "#EAB308";
      severity = "moderate";
      advice = "Monitor diet — limit refined carbs.";
    } else {
      category = "Diabetes";
      color = "#EF4444";
      severity = "high";
      advice = "Seek medical attention.";
    }
  }

  return { category, color, severity, advice, value: `${value} mg/dL` };
};

// ── Heart Rate Categorizer ────────────────────────────────────
const categorizeHeartRate = (bpm, age = 30) => {
  if (!bpm) return null;

  let category, color, advice;
  if (bpm < 40) {
    category = "Very Low";
    color = "#DC2626";
    advice = "Seek medical attention immediately.";
  } else if (bpm < 60) {
    category = "Low";
    color = "#3B82F6";
    advice = "May be normal for athletes; consult if you feel symptoms.";
  } else if (bpm <= 100) {
    category = "Normal";
    color = "#22C55E";
    advice = "Heart rate is in healthy range.";
  } else if (bpm <= 120) {
    category = "Elevated";
    color = "#EAB308";
    advice = "Rest and monitor — could be stress or caffeine.";
  } else {
    category = "High";
    color = "#EF4444";
    advice = "Consult a doctor if this persists at rest.";
  }

  return { category, color, advice, value: `${bpm} bpm` };
};

// ── Health Score Calculator ───────────────────────────────────
const calculateHealthScore = (data = {}) => {
  const scores = {};
  let totalWeight = 0;
  let weightedSum = 0;

  const score = (value, weight) => {
    if (value === null || value === undefined) return;
    scores[weight.name] = Math.round(value);
    weightedSum += value * weight.w;
    totalWeight += weight.w;
  };

  // BMI Score (weight 25%)
  if (data.bmi) {
    const b = data.bmi;
    let s = 100;
    if (b < 16) s = 20;
    else if (b < 18.5) s = 60;
    else if (b <= 24.9) s = 100;
    else if (b <= 27.4) s = 85;
    else if (b <= 29.9) s = 65;
    else if (b <= 34.9) s = 45;
    else if (b <= 39.9) s = 30;
    else s = 15;
    score(s, { name: "bmiScore", w: 25 });
  }

  // BP Score (weight 30%)
  if (data.systolic && data.diastolic) {
    const { systolic: s, diastolic: d } = data;
    let bp = 100;
    if (s > 180 || d > 120) bp = 5;
    else if (s >= 140 || d >= 90) bp = 30;
    else if (s >= 130 || d >= 80) bp = 55;
    else if (s >= 120 && d < 80) bp = 75;
    else if (s < 90 || d < 60) bp = 60;
    else bp = 100;
    score(bp, { name: "bpScore", w: 30 });
  }

  // Glucose Score (weight 25%)
  if (data.glucose) {
    const g = data.glucose;
    let gs = 100;
    if (g < 70) gs = 30;
    else if (g < 100) gs = 100;
    else if (g < 126) gs = 60;
    else gs = 25;
    score(gs, { name: "glucoseScore", w: 25 });
  }

  // Lifestyle Score (weight 20%)
  if (data.lifestyle) {
    const { exerciseFrequency, smokingStatus, sleepHours, alcoholConsumption } =
      data.lifestyle;
    let ls = 70; // base
    if (exerciseFrequency === "active" || exerciseFrequency === "very_active")
      ls += 10;
    else if (exerciseFrequency === "moderate") ls += 5;
    else if (exerciseFrequency === "sedentary") ls -= 10;
    if (smokingStatus === "never") ls += 10;
    else if (smokingStatus === "current") ls -= 15;
    if (sleepHours >= 7 && sleepHours <= 9) ls += 5;
    if (alcoholConsumption === "none") ls += 5;
    else if (alcoholConsumption === "heavy") ls -= 10;
    score(Math.min(100, Math.max(0, ls)), { name: "lifestyleScore", w: 20 });
  }

  const overall =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

  let grade;
  if (overall >= 90) grade = "A";
  else if (overall >= 75) grade = "B";
  else if (overall >= 60) grade = "C";
  else if (overall >= 45) grade = "D";
  else grade = "F";

  return { overall, grade, breakdown: scores };
};

module.exports = {
  calculateBMI,
  categorizeBP,
  categorizeGlucose,
  categorizeHeartRate,
  calculateHealthScore,
};
