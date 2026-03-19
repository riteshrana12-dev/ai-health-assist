import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  Scale,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  getBMICategory,
  getBPCategory,
  getGlucoseCategory,
} from "../../utils/formatters";

const SkeletonCard = () => (
  <div className="metric-card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 skeleton rounded-xl" />
      <div className="w-16 h-5 skeleton rounded" />
    </div>
    <div className="w-24 h-7 skeleton rounded mb-1" />
    <div className="w-16 h-4 skeleton rounded" />
  </div>
);

const VitalCard = ({
  title,
  value,
  unit,
  icon: Icon,
  iconBg,
  iconColor,
  accentClass,
  category,
  trend,
  extra,
  delay,
}) => {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-health-400"
      : trend === "down"
        ? "text-red-400"
        : "text-gray-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`metric-card ${accentClass} p-5 group cursor-default`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon size={17} className={iconColor} />
        </div>
        {category && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${category.bg} ${category.color}`}
          >
            {category.label}
          </span>
        )}
      </div>

      {value !== null && value !== undefined ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1 }}
        >
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-display text-2xl font-bold text-white">
              {value}
            </span>
            <span className="text-xs text-gray-500 font-medium">{unit}</span>
          </div>
          <p className="text-xs text-gray-400 mb-2">{title}</p>

          {extra && <p className="text-xs text-gray-500 mb-2">{extra}</p>}

          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
              <TrendIcon size={12} />
              <span>vs last entry</span>
            </div>
          )}
        </motion.div>
      ) : (
        <div>
          <p className="text-gray-600 text-2xl font-bold mb-1">—</p>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xs text-gray-600 mt-1">No data yet</p>
        </div>
      )}
    </motion.div>
  );
};

const VitalsGrid = ({ latest, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const bp = latest?.bloodPressure;
  const glucose = latest?.glucose;
  const bmi = latest?.bmi;
  const hr = latest?.vitals?.heartRate;

  const bpCat = bp ? getBPCategory(bp.systolic, bp.diastolic) : null;
  const glucoseCat = glucose
    ? getGlucoseCategory(glucose.value, glucose.mealState)
    : null;
  const bmiCat = bmi ? getBMICategory(bmi.value) : null;

  const cards = [
    {
      title: "Blood Pressure",
      value: bp ? `${bp.systolic}/${bp.diastolic}` : null,
      unit: "mmHg",
      icon: Activity,
      iconBg: "bg-brand-500/15",
      iconColor: "text-brand-400",
      accentClass: "blue",
      category: bpCat,
      extra: bp?.pulse ? `Pulse: ${bp.pulse} bpm` : null,
      delay: 0,
    },
    {
      title: "Blood Glucose",
      value: glucose?.value ?? null,
      unit: glucose?.unit || "mg/dL",
      icon: Droplets,
      iconBg: "bg-health-500/15",
      iconColor: "text-health-400",
      accentClass: "green",
      category: glucoseCat,
      extra: glucose?.mealState
        ? `${glucose.mealState.replace("_", " ")}`
        : null,
      delay: 0.08,
    },
    {
      title: "Body Mass Index",
      value: bmi?.value ?? null,
      unit: "kg/m²",
      icon: Scale,
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-400",
      accentClass: "purple",
      category: bmiCat,
      extra: null,
      delay: 0.16,
    },
    {
      title: "Heart Rate",
      value: hr ?? null,
      unit: "bpm",
      icon: Heart,
      iconBg: "bg-pink-500/15",
      iconColor: "text-pink-400",
      accentClass: "red",
      category: hr
        ? hr < 60
          ? { label: "Low", bg: "bg-blue-500/15", color: "text-blue-400" }
          : hr > 100
            ? { label: "High", bg: "bg-red-500/15", color: "text-red-400" }
            : {
                label: "Normal",
                bg: "bg-health-500/15",
                color: "text-health-400",
              }
        : null,
      extra: null,
      delay: 0.24,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <VitalCard key={c.title} {...c} />
      ))}
    </div>
  );
};

export default VitalsGrid;
