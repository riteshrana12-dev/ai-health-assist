const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const Report = require("../models/Report");

// ── Gemini Client ─────────────────────────────────────────────
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// ── Safety Settings ───────────────────────────────────────────
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// ── Generation Config ─────────────────────────────────────────
const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

const GENERATION_CONFIG_JSON = {
  temperature: 0.3, // lower = more deterministic for structured output
  topK: 20,
  topP: 0.85,
  maxOutputTokens: 4096,
};

// ═════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═════════════════════════════════════════════════════════════

const HEALTH_CHAT_SYSTEM_PROMPT = `You are HealthBot — an empathetic, knowledgeable AI health assistant built into AI Health Assist, a personal health companion app.

## Your Role
You help users understand their health, interpret symptoms, and make informed decisions about their wellbeing. You are NOT a replacement for professional medical care.

## Your Personality
- Warm, caring, and supportive — like a knowledgeable friend who happens to know medicine
- Clear and jargon-free — always explain medical terms in plain language
- Cautious and responsible — always recommend professional consultation for serious symptoms
- Encouraging — celebrate healthy behaviors and progress

## Your Capabilities
1. **Symptom Assessment**: Analyze symptoms, ask clarifying questions, provide possible explanations
2. **Health Education**: Explain diseases, conditions, medications in simple language
3. **Vitals Interpretation**: Help users understand their BP, glucose, BMI, heart rate readings
4. **Lifestyle Guidance**: Diet, exercise, sleep, stress management advice
5. **Report Explanation**: Help users understand lab results and medical reports
6. **Medication Info**: Explain medications, dosages, side effects (general info only)
7. **Preventive Care**: Proactive health tips based on risk factors
8. **Emergency Detection**: Identify potentially life-threatening symptoms

## Emergency Detection Rules
If the user describes ANY of these, IMMEDIATELY flag as emergency and urge them to call emergency services:
- Chest pain, pressure, or tightness (especially with arm/jaw pain)
- Sudden severe headache ("worst headache of my life")
- Difficulty breathing or shortness of breath at rest
- Signs of stroke: face drooping, arm weakness, speech difficulty
- Severe allergic reaction (throat swelling, can't breathe)
- Blood sugar below 50 mg/dL or above 400 mg/dL
- Blood pressure above 180/120 mmHg with symptoms
- Loss of consciousness or seizures
- Heavy uncontrolled bleeding
- Suspected overdose or poisoning

## Format Guidelines
- Use **bold** for important terms or warnings
- Use bullet points for lists of symptoms or steps
- Keep responses concise but complete (150-400 words ideal)
- Always end serious symptom discussions with a professional consultation reminder
- For emergencies: lead with 🚨 EMERGENCY and instructions FIRST

## Boundaries
- Never diagnose definitively — use phrases like "this could suggest", "may indicate", "common causes include"
- Never prescribe medications or specific dosages
- Never tell a user to stop prescribed medication
- Acknowledge uncertainty: "I'm not certain, but..."
- For mental health crises, provide crisis hotline numbers

## Disclaimer
Always remind users that your information is educational and not a substitute for professional medical advice.`;

// ─────────────────────────────────────────────────────────────
// 1. AI HEALTH CHATBOT
// ─────────────────────────────────────────────────────────────
const chatWithAI = async (
  userMessage,
  conversationHistory = [],
  userContext = {},
) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: HEALTH_CHAT_SYSTEM_PROMPT,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  // Build context prefix if user health data is available
  let contextMessage = "";
  if (userContext && Object.keys(userContext).length > 0) {
    const parts = [];
    if (userContext.age) parts.push(`Age: ${userContext.age}`);
    if (userContext.gender) parts.push(`Gender: ${userContext.gender}`);
    if (userContext.bloodGroup)
      parts.push(`Blood group: ${userContext.bloodGroup}`);
    if (userContext.bmi) parts.push(`BMI: ${userContext.bmi}`);
    if (userContext.bp) parts.push(`Latest BP: ${userContext.bp}`);
    if (userContext.glucose)
      parts.push(`Latest glucose: ${userContext.glucose}`);
    if (userContext.allergies?.length)
      parts.push(`Known allergies: ${userContext.allergies.join(", ")}`);
    if (userContext.conditions?.length)
      parts.push(`Medical conditions: ${userContext.conditions.join(", ")}`);
    if (parts.length > 0) {
      contextMessage = `[User Health Context: ${parts.join(" | ")}]\n\n`;
    }
  }

  // Format conversation history for Gemini
  const history = conversationHistory.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  const prompt = contextMessage + userMessage;

  const result = await chat.sendMessage(prompt);
  const response = result.response;

  // Check for emergency keywords in response
  const responseText = response.text();
  const isEmergency = detectEmergency(userMessage, responseText);

  return {
    message: responseText,
    isEmergency,
    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
  };
};

// ─────────────────────────────────────────────────────────────
// 2. MEDICAL REPORT ANALYZER
// ─────────────────────────────────────────────────────────────
const REPORT_ANALYSIS_PROMPT = `You are a medical report analysis AI. Analyze the provided medical report text and return a detailed JSON analysis.

Extract and explain the findings in simple, patient-friendly language.

Return ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact structure:
{
  "reportType": "blood_test|urine_test|lipid_panel|liver_function|kidney_function|thyroid_panel|diabetes_panel|complete_blood_count|xray|mri|ct_scan|ecg|prescription|discharge_summary|vaccination|other",
  "summary": "2-3 sentence plain-language summary of the overall report",
  "keyFindings": [
    {
      "parameter": "Parameter name (e.g. Hemoglobin)",
      "value": "Actual value with unit",
      "normalRange": "Normal reference range",
      "status": "normal|low|high|critical_low|critical_high|unknown",
      "explanation": "What this means in simple terms for the patient"
    }
  ],
  "riskLevel": "low|moderate|high|critical|unknown",
  "riskFactors": ["List of identified risk factors"],
  "recommendations": ["Actionable recommendations for the patient"],
  "urgentFlags": [
    {
      "finding": "What was found",
      "severity": "warning|urgent|emergency",
      "action": "What the patient should do immediately"
    }
  ],
  "preventiveSuggestions": ["Preventive health tips based on findings"],
  "confidenceScore": 0.0
}

Rules:
- Be thorough but use simple, non-technical language in explanations
- If a value is critically abnormal, mark it as urgent
- confidenceScore should be 0.0-1.0 based on text clarity and completeness
- If the text is unclear or incomplete, note it in summary and set confidence lower
- Focus on what matters most to the patient's health`;

const analyzeReport = async (fileBuffer, mimeType) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: GENERATION_CONFIG_JSON,
    safetySettings: SAFETY_SETTINGS,
  });

  let extractedText = "";
  let extractionMethod = "unknown";

  // Extract text based on file type
  if (mimeType === "application/pdf") {
    try {
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text?.trim() || "";
      extractionMethod = "pdf_parse";
    } catch {
      extractedText = "";
    }
  }

  let analysisResult;

  // Strategy A: If we have good text, use text-only analysis
  if (extractedText && extractedText.length > 100) {
    const prompt = `${REPORT_ANALYSIS_PROMPT}\n\nMedical Report Text:\n\`\`\`\n${extractedText.slice(0, 8000)}\n\`\`\``;
    const result = await model.generateContent(prompt);
    analysisResult = parseJSONResponse(result.response.text());

    // Strategy B: For images or failed PDF extraction, use vision
  } else if (mimeType.startsWith("image/")) {
    extractionMethod = "gemini_vision";
    const imageData = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: mimeType,
      },
    };
    const result = await model.generateContent([
      REPORT_ANALYSIS_PROMPT +
        "\n\nAnalyze the medical report shown in this image:",
      imageData,
    ]);
    analysisResult = parseJSONResponse(result.response.text());

    // Strategy C: Fallback
  } else {
    analysisResult = {
      reportType: "other",
      summary:
        "Unable to extract sufficient text from the document for analysis.",
      keyFindings: [],
      riskLevel: "unknown",
      riskFactors: [],
      recommendations: [
        "Please upload a clearer image or a text-based PDF for better analysis.",
      ],
      urgentFlags: [],
      preventiveSuggestions: [],
      confidenceScore: 0.1,
    };
  }

  return {
    ...analysisResult,
    extractedData: {
      rawText: extractedText,
      textLength: extractedText.length,
      extractionMethod,
      extractedAt: new Date(),
    },
  };
};

// ── Analyze from Cloudinary URL (for re-analysis) ─────────────
const analyzeReportFromUrl = async (fileUrl, fileType, reportId) => {
  try {
    const https = require("https");
    const fileBuffer = await downloadFile(fileUrl);
    const mimeType = fileType === "pdf" ? "application/pdf" : fileType;

    const analysis = await analyzeReport(fileBuffer, mimeType);

    await Report.findByIdAndUpdate(reportId, {
      processingStatus: "completed",
      aiAnalysis: {
        ...analysis,
        status: "completed",
        analyzedAt: new Date(),
      },
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
// 3. AI RISK PREDICTION ENGINE
// ─────────────────────────────────────────────────────────────
const RISK_PREDICTION_PROMPT = `You are a preventive healthcare AI. Analyze the provided patient health data and return a structured risk assessment.

Return ONLY valid JSON (no markdown, no extra text):
{
  "overallRiskScore": 0,
  "overallRiskLevel": "low|moderate|high|critical",
  "riskSummary": "2-3 sentence summary of the patient's health risk profile",
  "riskFactors": [
    {
      "category": "cardiovascular|diabetes|metabolic|lifestyle|other",
      "risk": "Specific risk identified",
      "severity": "low|moderate|high|critical",
      "evidence": "What data point indicates this risk",
      "mitigation": "Specific actionable step to reduce this risk"
    }
  ],
  "protectiveFactors": ["Positive health factors observed"],
  "immediateActions": ["Actions needed in the next 1-7 days"],
  "shortTermGoals": ["Goals for next 1-3 months"],
  "longTermGoals": ["Goals for next 6-12 months"],
  "emergencyWarnings": ["Any urgent warning signs to watch for"],
  "recommendedScreenings": ["Medical tests or screenings recommended"],
  "lifestyleRecommendations": {
    "diet":     ["Specific dietary changes"],
    "exercise": ["Specific exercise recommendations"],
    "sleep":    ["Sleep recommendations"],
    "stress":   ["Stress management tips"],
    "other":    ["Other lifestyle tips"]
  },
  "nextReviewDate": "Recommended timeframe for next health check (e.g. '3 months')"
}`;

const predictRisk = async (healthData = {}) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: GENERATION_CONFIG_JSON,
    safetySettings: SAFETY_SETTINGS,
  });

  // Build structured health profile for analysis
  const profile = buildHealthProfile(healthData);

  const prompt = `${RISK_PREDICTION_PROMPT}\n\nPatient Health Profile:\n${JSON.stringify(profile, null, 2)}`;

  const result = await model.generateContent(prompt);
  const parsed = parseJSONResponse(result.response.text());

  return {
    ...parsed,
    generatedAt: new Date(),
  };
};

// ─────────────────────────────────────────────────────────────
// 4. HEALTH EDUCATION — Explain a disease / condition
// ─────────────────────────────────────────────────────────────
const explainCondition = async (
  condition,
  userAge = null,
  userContext = "",
) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
  });

  const ageContext = userAge ? ` The user is ${userAge} years old.` : "";
  const prompt = `Explain "${condition}" in simple, patient-friendly language.${ageContext}${userContext ? ` Additional context: ${userContext}` : ""}

Please structure your response as follows:
## What is ${condition}?
[Simple 2-3 sentence explanation]

## Common Symptoms
[Bullet list of main symptoms]

## Who is at Risk?
[Risk factors and vulnerable populations]

## How is it Diagnosed?
[Common diagnostic methods]

## Treatment Options
[Overview of treatments — remind that a doctor must guide actual treatment]

## Prevention Tips
[Practical prevention steps]

## When to See a Doctor
[Red flag symptoms requiring immediate attention]

Keep language simple, avoid heavy medical jargon, and be reassuring but accurate.`;

  const result = await model.generateContent(prompt);
  return { explanation: result.response.text(), condition };
};

// ─────────────────────────────────────────────────────────────
// 5. SMART HEALTH INSIGHTS from vitals
// ─────────────────────────────────────────────────────────────
const generateHealthInsights = async (latestEntry, trend, userProfile) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { ...GENERATION_CONFIG, maxOutputTokens: 512 },
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `Based on the following health data, generate 3 personalized, actionable health insights. Each insight should be concise (1-2 sentences), positive in tone, and specific to the data.

Health Data:
${JSON.stringify({ latest: latestEntry, trend, profile: userProfile }, null, 2)}

Return ONLY valid JSON:
{
  "insights": [
    {
      "type": "achievement|warning|tip|trend",
      "icon": "heart|activity|brain|zap|shield|droplet",
      "title": "Short title (5 words max)",
      "message": "Actionable insight message (1-2 sentences)",
      "priority": "high|medium|low"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  return parseJSONResponse(result.response.text());
};

// ─────────────────────────────────────────────────────────────
// 6. MEDICATION INTERACTION CHECKER
// ─────────────────────────────────────────────────────────────
const checkMedicationInteractions = async (medications) => {
  if (!medications || medications.length < 2) {
    return {
      interactions: [],
      safe: true,
      message: "Not enough medications to check interactions.",
    };
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: GENERATION_CONFIG_JSON,
    safetySettings: SAFETY_SETTINGS,
  });

  const medList = medications
    .map((m) => `${m.name} ${m.dosage?.amount}${m.dosage?.unit}`)
    .join(", ");

  const prompt = `Check for potential drug interactions between these medications: ${medList}

Return ONLY valid JSON:
{
  "interactions": [
    {
      "drugs": ["Drug A", "Drug B"],
      "severity": "minor|moderate|major|contraindicated",
      "description": "Plain-language description of interaction",
      "recommendation": "What the patient should do"
    }
  ],
  "safe": true,
  "generalAdvice": "Overall safety advice",
  "disclaimer": "Always consult your doctor or pharmacist about drug interactions."
}

If no interactions found, return empty interactions array and safe: true.
This is for educational awareness only, not medical advice.`;

  const result = await model.generateContent(prompt);
  return parseJSONResponse(result.response.text());
};

// ═════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════

// Detect emergency keywords in user message or AI response
const detectEmergency = (userMessage, aiResponse) => {
  const emergencyKeywords = [
    "chest pain",
    "heart attack",
    "stroke",
    "can't breathe",
    "difficulty breathing",
    "unconscious",
    "seizure",
    "severe bleeding",
    "emergency",
    "call 911",
    "call ambulance",
    "🚨",
    "severe chest",
    "face drooping",
    "arm weakness",
    "overdose",
    "anaphylaxis",
    "allergic reaction",
    "choking",
  ];
  const combined = (userMessage + " " + aiResponse).toLowerCase();
  return emergencyKeywords.some((kw) => combined.includes(kw));
};

// Build a structured health profile for risk analysis
const buildHealthProfile = (data) => {
  const profile = {};

  if (data.user) {
    profile.demographics = {
      age: data.user.age || data.user.ageFromDOB,
      gender: data.user.gender,
      bloodGroup: data.user.bloodGroup,
    };
    profile.lifestyle = data.user.lifestyle || {};
    profile.medicalHistory =
      data.user.medicalHistory?.map((h) => h.condition) || [];
    profile.allergies = data.user.allergies || [];
    profile.currentMeds = data.user.currentMedications || [];
  }

  if (data.latest) {
    profile.currentVitals = {
      bmi: data.latest.bmi?.value,
      bmiCategory: data.latest.bmi?.category,
      bp: data.latest.bloodPressure
        ? `${data.latest.bloodPressure.systolic}/${data.latest.bloodPressure.diastolic}`
        : undefined,
      bpCategory: data.latest.bloodPressure?.category,
      glucose: data.latest.glucose?.value,
      glucoseState: data.latest.glucose?.mealState,
      heartRate: data.latest.vitals?.heartRate,
      o2Sat: data.latest.vitals?.oxygenSaturation,
    };
    profile.healthScore = data.latest.healthScore?.overall;
    profile.riskFlags = data.latest.riskFlags?.map((f) => f.type) || [];
  }

  if (data.trend && data.trend.length > 0) {
    profile.trends = {
      bpTrend: analyzeTrend(
        data.trend.map((t) => t.bloodPressure?.systolic).filter(Boolean),
      ),
      glucoseTrend: analyzeTrend(
        data.trend.map((t) => t.glucose?.value).filter(Boolean),
      ),
      weightTrend: analyzeTrend(
        data.trend.map((t) => t.weight?.value).filter(Boolean),
      ),
    };
  }

  return profile;
};

// Simple trend direction helper
const analyzeTrend = (values) => {
  if (values.length < 2) return "insufficient_data";
  const first = values[0];
  const last = values[values.length - 1];
  const diff = ((last - first) / first) * 100;
  if (diff > 5) return "increasing";
  else if (diff < -5) return "decreasing";
  else return "stable";
};

// Safely parse JSON from Gemini response
const parseJSONResponse = (text) => {
  try {
    // Strip markdown code blocks if present
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    // Return a safe fallback
    console.error("Failed to parse Gemini JSON response:", text.slice(0, 200));
    return {
      summary: text.slice(0, 500),
      riskLevel: "unknown",
      keyFindings: [],
      recommendations: ["Please try analyzing this report again."],
      urgentFlags: [],
      confidenceScore: 0.1,
    };
  }
};

// Download file from URL for re-analysis
const downloadFile = (url) =>
  new Promise((resolve, reject) => {
    const https = require("https");
    const http = require("http");
    const lib = url.startsWith("https") ? https : http;
    const chunks = [];

    lib
      .get(url, (res) => {
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", (err) => reject(err));
      })
      .on("error", reject);
  });

module.exports = {
  chatWithAI,
  analyzeReport,
  analyzeReportFromUrl,
  predictRisk,
  explainCondition,
  generateHealthInsights,
  checkMedicationInteractions,
};
