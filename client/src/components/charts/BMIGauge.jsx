import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { getBMICategory } from "../../utils/formatters";

const BMI_ZONES = [
  { label: "Underweight", range: "< 18.5", color: "#3B82F6", pct: 18 },
  { label: "Normal", range: "18.5–24.9", color: "#22C55E", pct: 26 },
  { label: "Overweight", range: "25–29.9", color: "#EAB308", pct: 20 },
  { label: "Obese", range: "≥ 30", color: "#EF4444", pct: 36 },
];

// Map BMI value (0–45) to an angle on a 180° arc
const bmiToAngle = (bmi) => {
  const clamped = Math.min(45, Math.max(0, bmi || 0));
  return (clamped / 45) * 180;
};

const GAUGE_R = 70;
const GAUGE_CX = 90;
const GAUGE_CY = 90;

const polarToCart = (angle, r = GAUGE_R) => {
  const rad = ((angle - 180) * Math.PI) / 180;
  return {
    x: GAUGE_CX + r * Math.cos(rad),
    y: GAUGE_CY + r * Math.sin(rad),
  };
};

const arcPath = (startAngle, endAngle, r = GAUGE_R, strokeW = 14) => {
  const start = polarToCart(startAngle, r);
  const end = polarToCart(endAngle, r);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
};

const BMIGauge = ({ bmi, weight, height, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="h-4 skeleton rounded w-20 mb-4" />
        <div className="h-36 skeleton rounded-xl" />
      </div>
    );
  }

  const category = getBMICategory(bmi);
  const angle = bmiToAngle(bmi);
  const needle = polarToCart(angle);

  // Zone arc segments across 180°
  const zones = [
    { start: 0, end: 37 }, // Underweight: 0–18.5 bmi → 0–37°
    { start: 37, end: 90 }, // Normal:      18.5–25 → 37–90°
    { start: 90, end: 130 }, // Overweight:  25–30 → 90–130°
    { start: 130, end: 180 }, // Obese:       30–45 → 130–180°
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="card"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <Scale size={15} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">BMI</p>
          <p className="text-xs text-gray-500">Body Mass Index</p>
        </div>
      </div>

      {!bmi ? (
        <div className="h-36 flex items-center justify-center">
          <div className="text-center">
            <Scale size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No BMI data yet</p>
          </div>
        </div>
      ) : (
        <>
          {/* SVG gauge */}
          <div className="flex justify-center mb-3">
            <svg viewBox="0 0 180 100" className="w-48 h-28">
              {/* Background arc track */}
              <path
                d={arcPath(0, 180)}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Colored zone arcs */}
              {zones.map((z, i) => (
                <path
                  key={i}
                  d={arcPath(z.start, z.end)}
                  fill="none"
                  stroke={BMI_ZONES[i].color}
                  strokeWidth="14"
                  strokeOpacity={0.35}
                  strokeLinecap="butt"
                />
              ))}
              {/* Filled progress arc */}
              <motion.path
                d={arcPath(0, angle)}
                fill="none"
                stroke={category.color?.replace("text-", "") || "#7C3AED"}
                strokeWidth="14"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
                style={{
                  stroke: "#7C3AED",
                  filter: "drop-shadow(0 0 4px rgba(124,58,237,0.5))",
                }}
              />
              {/* Needle */}
              {bmi && (
                <motion.line
                  x1={GAUGE_CX}
                  y1={GAUGE_CY}
                  x2={needle.x}
                  y2={needle.y}
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                />
              )}
              {/* Center dot */}
              <circle
                cx={GAUGE_CX}
                cy={GAUGE_CY}
                r="4"
                fill="white"
                opacity={0.9}
              />
              {/* BMI value */}
              <text
                x={GAUGE_CX}
                y="85"
                textAnchor="middle"
                fill="white"
                fontSize="20"
                fontWeight="700"
                fontFamily="Outfit, sans-serif"
              >
                {bmi}
              </text>
              <text
                x={GAUGE_CX}
                y="96"
                textAnchor="middle"
                fill="#6B7280"
                fontSize="9"
              >
                kg/m²
              </text>
            </svg>
          </div>

          {/* Category badge */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${category.bg} ${category.color}`}
            >
              {category.label}
            </span>
          </div>

          {/* Weight / Height stats */}
          {(weight || height) && (
            <div className="grid grid-cols-2 gap-2">
              {weight && (
                <div className="text-center p-2 rounded-lg bg-white/3">
                  <p className="text-xs text-gray-500 mb-0.5">Weight</p>
                  <p className="text-sm font-semibold text-white">
                    {weight} <span className="text-xs text-gray-500">kg</span>
                  </p>
                </div>
              )}
              {height && (
                <div className="text-center p-2 rounded-lg bg-white/3">
                  <p className="text-xs text-gray-500 mb-0.5">Height</p>
                  <p className="text-sm font-semibold text-white">
                    {height} <span className="text-xs text-gray-500">cm</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Zone legend */}
          <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-white/5">
            {BMI_ZONES.map((z) => (
              <div key={z.label} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: z.color }}
                />
                <span className="text-[10px] text-gray-500">
                  {z.label} <span className="text-gray-600">{z.range}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default BMIGauge;
