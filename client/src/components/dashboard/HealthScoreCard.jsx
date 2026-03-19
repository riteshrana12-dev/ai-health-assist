import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Award } from "lucide-react";
import {
  getHealthScoreColor,
  getHealthScoreGrade,
} from "../../utils/formatters";

const RADIUS = 54;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const HealthScoreCard = ({ score, trend, previousScore, isLoading }) => {
  const [displayed, setDisplayed] = useState(0);
  const [animated, setAnimated] = useState(false);

  const color = getHealthScoreColor(score);
  const grade = getHealthScoreGrade(score);
  const offset = score
    ? CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
    : CIRCUMFERENCE;

  // Count-up animation
  useEffect(() => {
    if (!score || animated) return;
    let start = 0;
    const end = score;
    const dur = 1400;
    const step = 16;
    const inc = (end / dur) * step;
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) {
        setDisplayed(end);
        setAnimated(true);
        clearInterval(timer);
      } else setDisplayed(Math.round(start));
    }, step);
    return () => clearInterval(timer);
  }, [score, animated]);

  const diff = previousScore ? score - previousScore : 0;

  if (isLoading) {
    return (
      <div className="metric-card blue p-6 flex items-center gap-6">
        <div className="w-32 h-32 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 skeleton rounded" />
          <div className="h-8 w-16 skeleton rounded" />
          <div className="h-3 w-32 skeleton rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="metric-card blue p-6"
    >
      <div className="flex items-center gap-6">
        {/* SVG gauge */}
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            {/* Track */}
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <motion.circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
              transform="rotate(-90 64 64)"
              style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
            />
            {/* Glow track fill */}
            <circle
              cx="64"
              cy="64"
              r={RADIUS - STROKE / 2}
              fill={`${color}08`}
            />
          </svg>

          {/* Score text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={displayed}
              className="font-display text-3xl font-bold text-white leading-none"
              style={{ color }}
            >
              {score ? displayed : "—"}
            </motion.span>
            <span className="text-[10px] text-gray-500 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Health Score
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className={`font-display text-2xl font-bold ${grade.color}`}>
              {grade.grade}
            </span>
            <span className={`text-sm font-medium ${grade.color}`}>
              {grade.label}
            </span>
          </div>

          {/* Trend */}
          {diff !== 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-1.5 mb-3"
            >
              {diff > 0 ? (
                <TrendingUp size={14} className="text-health-400" />
              ) : (
                <TrendingDown size={14} className="text-red-400" />
              )}
              <span
                className={`text-xs font-medium ${diff > 0 ? "text-health-400" : "text-red-400"}`}
              >
                {diff > 0 ? "+" : ""}
                {diff} pts from last entry
              </span>
            </motion.div>
          )}

          {/* Grade breakdown bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-600 mb-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
            <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score || 0}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}60`,
                }}
              />
            </div>
          </div>

          {/* Award badge */}
          {score >= 80 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-health-500/10 border border-health-500/20 w-fit"
            >
              <Award size={12} className="text-health-400" />
              <span className="text-[10px] font-medium text-health-400">
                Great health!
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Score breakdown if available */}
      {trend?.breakdown && (
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
          {[
            { label: "BMI", val: trend.breakdown.bmiScore },
            { label: "BP", val: trend.breakdown.bpScore },
            { label: "Glucose", val: trend.breakdown.glucoseScore },
          ].map(
            ({ label, val }) =>
              val !== undefined && (
                <div key={label} className="text-center">
                  <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: getHealthScoreColor(val) }}
                  >
                    {val}
                  </p>
                </div>
              ),
          )}
        </div>
      )}
    </motion.div>
  );
};

export default HealthScoreCard;
