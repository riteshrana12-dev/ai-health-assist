import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-100 border border-white/10 rounded-xl p-3 shadow-card text-xs">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-semibold">{p.value} mmHg</span>
        </div>
      ))}
      {payload.length === 2 && (
        <p className="text-gray-500 mt-1 pt-1 border-t border-white/5">
          PP: {payload[0].value - payload[1].value} mmHg
        </p>
      )}
    </div>
  );
};

const BPChart = ({ data = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="h-4 skeleton rounded w-32 mb-4" />
        <div className="h-48 skeleton rounded-xl" />
      </div>
    );
  }

  const formatted = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    systolic: d.systolic,
    diastolic: d.diastolic,
  }));

  const noData = !data.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
            <Activity size={15} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Blood Pressure</p>
            <p className="text-xs text-gray-500">Systolic / Diastolic trend</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-brand-400 rounded" />
            <span>Systolic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-cyan-400 rounded" />
            <span>Diastolic</span>
          </div>
        </div>
      </div>

      {noData ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <Activity size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No blood pressure data yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Log your vitals to see trends
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={formatted}
            margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
          >
            <defs>
              <linearGradient id="systolicGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
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
              domain={[50, 180]}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Normal range reference zone */}
            <ReferenceLine
              y={120}
              stroke="#EAB308"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: "Elevated",
                fill: "#EAB308",
                fontSize: 9,
                position: "insideTopRight",
              }}
            />
            <ReferenceLine
              y={80}
              stroke="#22C55E"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
              label={{
                value: "Normal",
                fill: "#22C55E",
                fontSize: 9,
                position: "insideTopRight",
              }}
            />

            <Area dataKey="systolic" fill="url(#systolicGrad)" stroke="none" />
            <Line
              dataKey="systolic"
              name="Systolic"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#1E1E2F" }}
              animationDuration={1200}
            />
            <Line
              dataKey="diastolic"
              name="Diastolic"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={{ fill: "#06B6D4", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#1E1E2F" }}
              animationDuration={1400}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
};

export default BPChart;
