import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Activity,
  Droplets,
  Scale,
  Heart,
  Brain,
  AlertCircle,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import DashboardLayout from "../components/common/DashboardLayout";
import { healthService } from "../services/healthService";
import { chatService } from "../services/chatService";
import {
  formatNumber,
  getHealthScoreColor,
  CHART_COLORS,
} from "../utils/formatters";
import { Link } from "react-router-dom";

// ── Custom recharts tooltip ───────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-100 border border-white/10 rounded-xl px-3 py-2.5 shadow-card text-xs min-w-[120px]">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}:{" "}
          <span className="text-white">{formatNumber(p.value, 1)}</span>
        </p>
      ))}
    </div>
  );
};

// ── Axis shared styles ────────────────────────────────────────
const AXIS = {
  tick: { fill: "#6B7280", fontSize: 11 },
  axisLine: false,
  tickLine: false,
};
const GRID = { stroke: "rgba(255,255,255,0.04)", strokeDasharray: "4 4" };
const SDOT = {
  strokeWidth: 2,
  dot: false,
  activeDot: { r: 4, strokeWidth: 0 },
};

// ── Stat summary card ─────────────────────────────────────────
const StatCard = ({
  label,
  avg,
  min,
  max,
  unit,
  icon: Icon,
  color,
  delay = 0,
}) => {
  const hasData = avg !== null && avg !== undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="metric-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center`}
          style={{ background: `${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      {hasData ? (
        <>
          <p className="font-display text-2xl font-bold text-white">
            {formatNumber(avg, 1)}
            <span className="text-xs text-gray-500 ml-1 font-normal">
              {unit}
            </span>
          </p>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span>↓ {formatNumber(min, 1)}</span>
            <span>↑ {formatNumber(max, 1)}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-600 mt-2">No data yet</p>
      )}
    </motion.div>
  );
};

// ── Chart wrapper ─────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="card"
  >
    <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mb-4">{subtitle}</p>}
    {children}
  </motion.div>
);

// ── Empty chart state ─────────────────────────────────────────
const EmptyChart = ({ message = "No data for this period" }) => (
  <div className="h-44 flex flex-col items-center justify-center text-center gap-2">
    <BarChart3 size={24} className="text-gray-700" />
    <p className="text-xs text-gray-500">{message}</p>
  </div>
);

// ─────────────────────────────────────────────────────────────
const Analytics = () => {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Fetch analytics from API directly ─────────────────────
  const fetchData = async (d, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data } = await healthService.getAnalytics(d);
      if (mountedRef.current) {
        setAnalytics(data.data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || "Failed to load analytics");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Fetch on mount and when days changes
  useEffect(() => {
    fetchData(days);
  }, [days]);

  // ── Fetch AI risk — only on button click, not auto ────────
  const handleFetchRisk = async () => {
    setRiskLoading(true);
    try {
      const { data } = await chatService.getRiskPrediction();
      if (mountedRef.current) setRiskData(data.data.prediction);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Need health data to generate risk report";
      if (mountedRef.current) setRiskData({ error: msg });
    } finally {
      if (mountedRef.current) setRiskLoading(false);
    }
  };

  // ── Prepare chart data ────────────────────────────────────
  const series = analytics?.series || {};

  const bpData = (series.bpSeries || []).map((d) => ({
    date: d.date?.slice(5),
    systolic: d.systolic,
    diastolic: d.diastolic,
  }));
  const glucoseData = (series.glucoseSeries || []).map((d) => ({
    date: d.date?.slice(5),
    value: d.value,
  }));
  const weightData = (series.weightSeries || []).map((d) => ({
    date: d.date?.slice(5),
    value: d.value,
  }));
  const scoreData = (series.scoreSeries || []).map((d) => ({
    date: d.date?.slice(5),
    score: d.score,
  }));
  const hrData = (series.heartRateSeries || []).map((d) => ({
    date: d.date?.slice(5),
    bpm: d.bpm,
  }));

  const stats = analytics?.stats || {};

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 pb-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 skeleton rounded-lg" />
            <div className="h-9 w-48 skeleton rounded-xl" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 skeleton rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-80 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">
              Failed to load analytics
            </p>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => fetchData(days)}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── No data state ─────────────────────────────────────────
  const hasAnyData = analytics?.totalEntries > 0;

  if (!hasAnyData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <BarChart3 size={28} className="text-brand-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-white mb-1">
              No health data yet
            </p>
            <p className="text-sm text-gray-400 mb-5 max-w-xs">
              Log your vitals from the Dashboard to start seeing trends and
              analytics here.
            </p>
            <Link
              to="/dashboard"
              className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <Plus size={15} /> Log your first vitals
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 pb-6"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Health Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {analytics?.totalEntries ?? 0} entries · last {days} days
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
              {[7, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  disabled={refreshing}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    days === d
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchData(days, true)}
              disabled={refreshing}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Avg Systolic BP"
            unit="mmHg"
            color={CHART_COLORS.blue}
            avg={stats.bp?.avg}
            min={stats.bp?.min}
            max={stats.bp?.max}
            icon={Activity}
            delay={0}
          />
          <StatCard
            label="Avg Glucose"
            unit="mg/dL"
            color={CHART_COLORS.green}
            avg={stats.glucose?.avg}
            min={stats.glucose?.min}
            max={stats.glucose?.max}
            icon={Droplets}
            delay={0.06}
          />
          <StatCard
            label="Avg Weight"
            unit="kg"
            color={CHART_COLORS.purple}
            avg={stats.weight?.avg}
            min={stats.weight?.min}
            max={stats.weight?.max}
            icon={Scale}
            delay={0.12}
          />
          <StatCard
            label="Avg Health Score"
            unit="/100"
            color={CHART_COLORS.yellow}
            avg={stats.score?.avg}
            min={stats.score?.min}
            max={stats.score?.max}
            icon={Brain}
            delay={0.18}
          />
        </div>

        {/* ── Charts ── */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Blood Pressure */}
          <ChartCard
            title="Blood Pressure"
            subtitle="Systolic & diastolic (mmHg)"
            delay={0.1}
          >
            {bpData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={bpData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" {...AXIS} />
                  <YAxis domain={["auto", "auto"]} {...AXIS} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    y={120}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    strokeOpacity={0.35}
                  />
                  <ReferenceLine
                    y={80}
                    stroke="#F97316"
                    strokeDasharray="3 3"
                    strokeOpacity={0.35}
                  />
                  <Line
                    dataKey="systolic"
                    name="Systolic"
                    stroke={CHART_COLORS.blue}
                    {...SDOT}
                  />
                  <Line
                    dataKey="diastolic"
                    name="Diastolic"
                    stroke={CHART_COLORS.purple}
                    {...SDOT}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Blood Glucose */}
          <ChartCard
            title="Blood Glucose"
            subtitle="mg/dL readings"
            delay={0.15}
          >
            {glucoseData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={glucoseData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="glucGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={CHART_COLORS.green}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS.green}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" {...AXIS} />
                  <YAxis domain={["auto", "auto"]} {...AXIS} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={100}
                    stroke="#EAB308"
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                  />
                  <ReferenceLine
                    y={126}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    strokeOpacity={0.4}
                  />
                  <Area
                    dataKey="value"
                    name="Glucose"
                    stroke={CHART_COLORS.green}
                    fill="url(#glucGrad)"
                    {...SDOT}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Weight */}
          <ChartCard title="Weight" subtitle="kg over time" delay={0.2}>
            {weightData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={weightData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={CHART_COLORS.purple}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS.purple}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" {...AXIS} />
                  <YAxis domain={["auto", "auto"]} {...AXIS} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    dataKey="value"
                    name="Weight (kg)"
                    stroke={CHART_COLORS.purple}
                    fill="url(#wGrad)"
                    {...SDOT}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Health Score */}
          <ChartCard
            title="Health Score"
            subtitle="AI-calculated score (0–100)"
            delay={0.25}
          >
            {scoreData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart
                  data={scoreData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={CHART_COLORS.yellow}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS.yellow}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" {...AXIS} />
                  <YAxis domain={[0, 100]} {...AXIS} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={75}
                    stroke="#22C55E"
                    strokeDasharray="3 3"
                    strokeOpacity={0.35}
                  />
                  <Area
                    dataKey="score"
                    name="Score"
                    stroke={CHART_COLORS.yellow}
                    fill="url(#sGrad)"
                    {...SDOT}
                  />
                  <Bar
                    dataKey="score"
                    fill={CHART_COLORS.yellow}
                    opacity={0.08}
                    radius={[2, 2, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Heart Rate */}
          <ChartCard title="Heart Rate" subtitle="bpm over time" delay={0.3}>
            {hrData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={hrData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="date" {...AXIS} />
                  <YAxis domain={[40, 140]} {...AXIS} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={60}
                    stroke="#3B82F6"
                    strokeDasharray="3 3"
                    strokeOpacity={0.35}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#EF4444"
                    strokeDasharray="3 3"
                    strokeOpacity={0.35}
                  />
                  <Line
                    dataKey="bpm"
                    name="Heart Rate"
                    stroke={CHART_COLORS.pink}
                    {...SDOT}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* AI Risk Assessment — manual trigger */}
          <ChartCard
            title="AI Risk Assessment"
            subtitle="Powered by Gemini AI"
            delay={0.35}
          >
            {!riskData && !riskLoading && (
              <div className="h-44 flex flex-col items-center justify-center text-center gap-3">
                <Brain size={28} className="text-gray-600" />
                <p className="text-xs text-gray-500 max-w-[200px]">
                  Generate a full AI risk profile based on your health data
                </p>
                <button
                  onClick={handleFetchRisk}
                  className="btn-primary px-5 py-2 text-xs"
                >
                  Generate Risk Report
                </button>
              </div>
            )}

            {riskLoading && (
              <div className="h-44 flex flex-col items-center justify-center text-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    ease: "linear",
                  }}
                >
                  <Brain size={24} className="text-purple-400" />
                </motion.div>
                <p className="text-xs text-gray-500">
                  Gemini AI is analysing your data…
                </p>
              </div>
            )}

            {riskData && !riskLoading && (
              <div className="space-y-3">
                {riskData.error ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/8 border border-orange-500/20">
                    <AlertCircle
                      size={14}
                      className="text-orange-400 flex-shrink-0"
                    />
                    <p className="text-xs text-orange-300">{riskData.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Risk score bar */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-xs text-gray-300 font-medium">
                        Overall Risk Score
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${riskData.overallRiskScore || 0}%`,
                              background: getHealthScoreColor(
                                100 - (riskData.overallRiskScore || 0),
                              ),
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white">
                          {riskData.overallRiskScore ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Risk summary */}
                    {riskData.riskSummary && (
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {riskData.riskSummary}
                      </p>
                    )}

                    {/* Immediate actions */}
                    {riskData.immediateActions?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                          Immediate Actions
                        </p>
                        {riskData.immediateActions.slice(0, 3).map((a, i) => (
                          <p
                            key={i}
                            className="text-xs text-gray-300 flex items-start gap-1.5"
                          >
                            <span className="text-orange-400 flex-shrink-0 mt-0.5">
                              →
                            </span>
                            {a}
                          </p>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleFetchRisk}
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw size={11} /> Regenerate
                    </button>
                  </>
                )}
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Min / Max / Avg summary table ── */}
        {(stats.bp || stats.glucose || stats.weight || stats.score) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card overflow-x-auto"
          >
            <p className="text-sm font-semibold text-white mb-4">
              Period Summary
            </p>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Metric</th>
                  <th className="text-right">Min</th>
                  <th className="text-right">Avg</th>
                  <th className="text-right">Max</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Systolic BP (mmHg)", stat: stats.bp },
                  { label: "Blood Glucose (mg/dL)", stat: stats.glucose },
                  { label: "Weight (kg)", stat: stats.weight },
                  { label: "Health Score", stat: stats.score },
                  { label: "Heart Rate (bpm)", stat: stats.heartRate },
                ]
                  .filter((r) => r.stat)
                  .map(({ label, stat }) => (
                    <tr key={label}>
                      <td className="text-gray-300 py-2.5">{label}</td>
                      <td className="text-right text-blue-400 font-mono">
                        {formatNumber(stat.min, 1)}
                      </td>
                      <td className="text-right text-white font-semibold font-mono">
                        {formatNumber(stat.avg, 1)}
                      </td>
                      <td className="text-right text-red-400 font-mono">
                        {formatNumber(stat.max, 1)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Analytics;
