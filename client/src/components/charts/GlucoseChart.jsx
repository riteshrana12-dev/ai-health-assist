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
import { Droplets } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const color =
    v < 70 ? "#3B82F6" : v < 100 ? "#22C55E" : v < 126 ? "#EAB308" : "#EF4444";
  const label2 =
    v < 70 ? "Low" : v < 100 ? "Normal" : v < 126 ? "Prediabetes" : "High";
  return (
    <div className="bg-dark-100 border border-white/10 rounded-xl p-3 shadow-card text-xs">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-white font-semibold">{v} mg/dL</span>
        <span className="text-xs" style={{ color }}>
          {label2}
        </span>
      </div>
      {payload[0].payload.state && (
        <p className="text-gray-500 mt-1 capitalize">
          {payload[0].payload.state.replace("_", " ")}
        </p>
      )}
    </div>
  );
};

const GlucoseChart = ({ data = [], isLoading }) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="h-4 skeleton rounded w-28 mb-4" />
        <div className="h-48 skeleton rounded-xl" />
      </div>
    );
  }

  const formatted = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: d.value,
    state: d.state,
  }));

  const noData = !data.length;
  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.value, 0) / data.length)
    : null;
  const latest = data.length ? data[data.length - 1]?.value : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-health-500/15 flex items-center justify-center">
            <Droplets size={15} className="text-health-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Blood Glucose</p>
            <p className="text-xs text-gray-500">mg/dL over time</p>
          </div>
        </div>
        {avg && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Avg</p>
            <p className="text-sm font-semibold text-health-400">{avg} mg/dL</p>
          </div>
        )}
      </div>

      {noData ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <Droplets size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No glucose data yet</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={formatted}
            margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
          >
            <defs>
              <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
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
              domain={[40, 250]}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Zone markers */}
            <ReferenceLine
              y={70}
              stroke="#3B82F6"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: "Low",
                fill: "#3B82F6",
                fontSize: 9,
                position: "insideTopLeft",
              }}
            />
            <ReferenceLine
              y={100}
              stroke="#22C55E"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: "Pre",
                fill: "#EAB308",
                fontSize: 9,
                position: "insideTopLeft",
              }}
            />
            <ReferenceLine
              y={126}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: "High",
                fill: "#EF4444",
                fontSize: 9,
                position: "insideTopLeft",
              }}
            />

            <Area
              dataKey="value"
              name="Glucose"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#glucoseGrad)"
              dot={{ fill: "#22C55E", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#1E1E2F" }}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
};

export default GlucoseChart;
