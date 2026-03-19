// ── Date Formatters ───────────────────────────────────────────
export const formatDate = (date, opts = {}) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  });
};

export const formatTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return `${formatDate(date)} at ${formatTime(date)}`;
};

export const timeAgo = (date) => {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDate(date);
};

// ── Number Formatters ─────────────────────────────────────────
export const formatNumber = (n, decimals = 0) => {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (n) => {
  if (n === null || n === undefined) return "—";
  return `${Math.round(n)}%`;
};

// ── Health Calculators ────────────────────────────────────────
export const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return parseFloat((weightKg / (h * h)).toFixed(1));
};

export const getBMICategory = (bmi) => {
  if (!bmi)
    return { label: "Unknown", color: "text-gray-400", bg: "bg-gray-500/15" };
  if (bmi < 18.5)
    return {
      label: "Underweight",
      color: "text-blue-400",
      bg: "bg-blue-500/15",
    };
  if (bmi < 25)
    return { label: "Normal", color: "text-green-400", bg: "bg-green-500/15" };
  if (bmi < 30)
    return {
      label: "Overweight",
      color: "text-yellow-400",
      bg: "bg-yellow-500/15",
    };
  return { label: "Obese", color: "text-red-400", bg: "bg-red-500/15" };
};

export const getBPCategory = (systolic, diastolic) => {
  if (!systolic || !diastolic)
    return { label: "Unknown", color: "text-gray-400" };
  if (systolic > 180 || diastolic > 120)
    return { label: "Crisis", color: "text-red-500" };
  if (systolic >= 140 || diastolic >= 90)
    return { label: "High II", color: "text-red-400" };
  if (systolic >= 130 || diastolic >= 80)
    return { label: "High I", color: "text-orange-400" };
  if (systolic >= 120 && diastolic < 80)
    return { label: "Elevated", color: "text-yellow-400" };
  if (systolic < 90 || diastolic < 60)
    return { label: "Low", color: "text-blue-400" };
  return { label: "Normal", color: "text-green-400" };
};

export const getGlucoseCategory = (value, mealState = "fasting") => {
  if (!value) return { label: "Unknown", color: "text-gray-400" };
  if (value < 70) return { label: "Low", color: "text-blue-400" };
  if (mealState === "fasting") {
    if (value < 100) return { label: "Normal", color: "text-green-400" };
    if (value < 126) return { label: "Prediabetes", color: "text-yellow-400" };
    return { label: "Diabetes", color: "text-red-400" };
  }
  if (value < 140) return { label: "Normal", color: "text-green-400" };
  if (value < 200) return { label: "Prediabetes", color: "text-yellow-400" };
  return { label: "Diabetes", color: "text-red-400" };
};

export const getHealthScoreColor = (score) => {
  if (!score) return "#6B7280";
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#EAB308";
  if (score >= 40) return "#F97316";
  return "#EF4444";
};

export const getHealthScoreGrade = (score) => {
  if (!score) return { grade: "—", label: "No data", color: "text-gray-400" };
  if (score >= 90)
    return { grade: "A", label: "Excellent", color: "text-green-400" };
  if (score >= 75) return { grade: "B", label: "Good", color: "text-blue-400" };
  if (score >= 60)
    return { grade: "C", label: "Fair", color: "text-yellow-400" };
  if (score >= 45)
    return { grade: "D", label: "Poor", color: "text-orange-400" };
  return { grade: "F", label: "Critical", color: "text-red-400" };
};

export const getRiskLevelConfig = (level) => {
  const configs = {
    low: {
      label: "Low Risk",
      color: "text-green-400",
      bg: "bg-green-500/15",
      border: "border-green-500/30",
    },
    moderate: {
      label: "Moderate Risk",
      color: "text-yellow-400",
      bg: "bg-yellow-500/15",
      border: "border-yellow-500/30",
    },
    high: {
      label: "High Risk",
      color: "text-orange-400",
      bg: "bg-orange-500/15",
      border: "border-orange-500/30",
    },
    critical: {
      label: "Critical",
      color: "text-red-400",
      bg: "bg-red-500/15",
      border: "border-red-500/30",
    },
    unknown: {
      label: "Unknown",
      color: "text-gray-400",
      bg: "bg-gray-500/15",
      border: "border-gray-500/30",
    },
  };
  return configs[level] || configs.unknown;
};

// ── File helpers ──────────────────────────────────────────────
export const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileIcon = (fileType) => {
  if (fileType === "pdf") return "📄";
  if (fileType?.startsWith("image/")) return "🖼️";
  return "📎";
};

// ── String helpers ────────────────────────────────────────────
export const capitalize = (s) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
};

export const truncate = (str, len = 80) => {
  if (!str) return "";
  return str.length <= len ? str : str.slice(0, len) + "…";
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ── Trend arrow helpers ───────────────────────────────────────
export const getTrendIcon = (direction) => {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "→";
};

export const getTrendColor = (direction, goodDirection = "up") => {
  if (direction === goodDirection) return "text-green-400";
  if (direction === "stable") return "text-gray-400";
  return "text-red-400";
};

// ── Chart color palette ───────────────────────────────────────
export const CHART_COLORS = {
  blue: "#3B82F6",
  green: "#22C55E",
  purple: "#7C3AED",
  cyan: "#06B6D4",
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#EAB308",
  pink: "#EC4899",
};

export const CHART_GRADIENT_STOPS = {
  blue: [
    { offset: "5%", stopColor: "#3B82F6", stopOpacity: 0.3 },
    { offset: "95%", stopColor: "#3B82F6", stopOpacity: 0 },
  ],
  green: [
    { offset: "5%", stopColor: "#22C55E", stopOpacity: 0.3 },
    { offset: "95%", stopColor: "#22C55E", stopOpacity: 0 },
  ],
  purple: [
    { offset: "5%", stopColor: "#7C3AED", stopOpacity: 0.3 },
    { offset: "95%", stopColor: "#7C3AED", stopOpacity: 0 },
  ],
  red: [
    { offset: "5%", stopColor: "#EF4444", stopOpacity: 0.3 },
    { offset: "95%", stopColor: "#EF4444", stopOpacity: 0 },
  ],
};
