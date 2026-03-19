import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const grade =
    score >= 90
      ? "A"
      : score >= 75
        ? "B"
        : score >= 60
          ? "C"
          : score >= 45
            ? "D"
            : "F";
  const color =
    score >= 80
      ? "#22C55E"
      : score >= 60
        ? "#EAB308"
        : score >= 40
          ? "#F97316"
          : "#EF4444";
  return (
    <div className="bg-dark-100 border border-white/10 rounded-xl p-3 shadow-card text-xs">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-white font-semibold">{score}</span>
        <span className="font-bold" style={{ color }}>
          Grade {grade}
        </span>
      </div>
    </div>
  );
};

const TrendChart = ({ data = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="h-4 skeleton rounded w-32 mb-4" />
        <div className="h-44 skeleton rounded-xl" />
      </div>
    );
  }

  const formatted = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: d.score,
  }));

  const noData = !data.length;
  const latest = data.length ? data[data.length - 1]?.score : null;
  const first = data.length ? data[0]?.score : null;
  const diff = latest && first ? latest - first : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
            <BarChart3 size={15} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Health Score Trend
            </p>
            <p className="text-xs text-gray-500">0–100 composite score</p>
          </div>
        </div>
        {diff !== null && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              diff >= 0
                ? "text-health-400 bg-health-500/10"
                : "text-red-400 bg-red-500/10"
            }`}
          >
            {diff >= 0 ? "+" : ""}
            {Math.round(diff)} pts
          </span>
        )}
      </div>

      {noData ? (
        <div className="h-44 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No score history yet</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={176}>
          <AreaChart
            data={formatted}
            margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
          >
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={75}
              stroke="#22C55E"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              label={{
                value: "Good",
                fill: "#22C55E",
                fontSize: 9,
                position: "insideTopRight",
              }}
            />
            <Area
              dataKey="score"
              name="Health Score"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#scoreGrad)"
              dot={{ fill: "#3B82F6", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#1E1E2F" }}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
};

export default TrendChart;
