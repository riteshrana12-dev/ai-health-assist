import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Brain,
  TrendingUp,
  AlertTriangle,
  FileText,
  Pill,
  Calendar,
  ChevronRight,
  Zap,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import HealthScoreCard from "../components/dashboard/HealthScoreCard";
import VitalsGrid from "../components/dashboard/VitalsGrid";
import LogVitalsModal from "../components/dashboard/LogVitalsModal";
import BPChart from "../components/charts/BPChart";
import GlucoseChart from "../components/charts/GlucoseChart";
import BMIGauge from "../components/charts/BMIGauge";
import { useHealth } from "../hooks/useHealth";
import { chatService } from "../services/chatService";
import { timeAgo, formatDate, getRiskLevelConfig } from "../utils/formatters";
import { Link } from "react-router-dom";

// ── Stagger animation ─────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── Small section heading ─────────────────────────────────────
const SectionHead = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-display font-semibold text-white text-base">{title}</h2>
    {action}
  </div>
);

// ── AI Insight chip ───────────────────────────────────────────
const InsightChip = ({ insight }) => {
  const icons = {
    heart: "❤️",
    activity: "📊",
    brain: "🧠",
    zap: "⚡",
    shield: "🛡️",
    droplet: "💧",
  };
  const borderColors = {
    achievement: "border-health-500/30 bg-health-500/5",
    warning: "border-orange-500/30 bg-orange-500/5",
    tip: "border-brand-500/30 bg-brand-500/5",
    trend: "border-purple-500/30 bg-purple-500/5",
  };
  return (
    <motion.div
      variants={item}
      className={`flex items-start gap-3 p-3.5 rounded-xl border ${borderColors[insight.type] || "border-white/8 bg-white/3"}`}
    >
      <span className="text-lg flex-shrink-0">
        {icons[insight.icon] || "💡"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white mb-0.5">{insight.title}</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          {insight.message}
        </p>
      </div>
    </motion.div>
  );
};

// ── Recent report row ─────────────────────────────────────────
const ReportRow = ({ report }) => {
  const risk = getRiskLevelConfig(report.aiAnalysis?.riskLevel);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-sm">
        {report.fileType === "pdf" ? "📄" : "🖼️"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">
          {report.title || report.fileName}
        </p>
        <p className="text-xs text-gray-500">{timeAgo(report.createdAt)}</p>
      </div>
      <span
        className={`badge text-[10px] ${risk.bg} ${risk.color} ${risk.border} border`}
      >
        {risk.label}
      </span>
    </div>
  );
};

// ── Medication row ────────────────────────────────────────────
const MedRow = ({ med }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
    <div
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: med.color || "#3B82F6" }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-white font-medium truncate">{med.name}</p>
      <p className="text-xs text-gray-500">
        {med.dosageReadable || `${med.dosage?.amount} ${med.dosage?.unit}`}
      </p>
    </div>
    <span className="text-[10px] text-gray-500">
      {med.schedule?.times?.[0]?.time || "—"}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { dashboard, isLoading, fetchDashboard, logVitals } = useHealth();
  const [modalOpen, setModalOpen] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightLoad, setInsightLoad] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setInsightLoad(true);
    try {
      const { data } = await chatService.getInsights();
      setInsights(data.data?.insights || []);
    } catch {
      setInsights([]);
    } finally {
      setInsightLoad(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const handleLogVitals = async (payload) => {
    setLogLoading(true);
    const result = await logVitals(payload);
    setLogLoading(false);
    return result;
  };

  const latest = dashboard?.latest;
  const recent = dashboard?.recent || [];
  const trend = dashboard?.trend || {};
  const stats = dashboard?.stats || {};

  return (
    <DashboardLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-6"
      >
        {/* ── Header bar ──────────────────────────────── */}
        <motion.div
          variants={item}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-gray-500 mb-0.5">
              {formatDate(new Date(), {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {latest && (
              <p className="text-xs text-gray-600">
                Last updated {timeAgo(latest.logDate)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92, rotate: 180 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-ghost p-2 text-gray-400"
              title="Refresh dashboard"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setModalOpen(true)}
              className="btn-primary px-4 py-2 text-sm"
            >
              <Plus size={16} />
              Log Vitals
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats bar ───────────────────────────────── */}
        <motion.div
          variants={item}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            {
              label: "Health Score",
              value: latest?.healthScore?.overall
                ? `${latest.healthScore.overall}/100`
                : "—",
              icon: "🏥",
              color: "text-health-400",
            },
            {
              label: "Entries This Month",
              value: stats.entriesThisMonth ?? "—",
              icon: "📅",
              color: "text-brand-400",
            },
            {
              label: "Total Logs",
              value: stats.totalEntries ?? "—",
              icon: "📊",
              color: "text-purple-400",
            },
            {
              label: "Risk Level",
              value: latest?.riskFlags?.[0] ? "Alert" : "Normal",
              icon: latest?.riskFlags?.[0] ? "⚠️" : "✅",
              color: latest?.riskFlags?.[0]
                ? "text-orange-400"
                : "text-health-400",
            },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="metric-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{icon}</span>
                <p className="text-xs text-gray-500 truncate">{label}</p>
              </div>
              <p className={`font-display text-xl font-bold ${color}`}>
                {value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── Health Score + Vitals ─────────────────── */}
        <motion.div variants={item}>
          <SectionHead title="Health Overview" />
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <HealthScoreCard
                score={latest?.healthScore?.overall}
                trend={trend.healthScore}
                previousScore={null}
                isLoading={isLoading}
              />
            </div>
            <div className="lg:col-span-2">
              <VitalsGrid latest={latest} isLoading={isLoading} />
            </div>
          </div>
        </motion.div>

        {/* ── Charts row ──────────────────────────────── */}
        <motion.div variants={item}>
          <SectionHead
            title="Trends (Last 30 Days)"
            action={
              <Link
                to="/analytics"
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                Full analytics <ChevronRight size={12} />
              </Link>
            }
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card p-0 overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Blood Pressure
                </p>
              </div>
              <BPChart data={recent} height={160} />
            </div>
            <div className="card p-0 overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Blood Glucose
                </p>
              </div>
              <GlucoseChart data={recent} height={160} />
            </div>
            <div className="card p-4 flex flex-col">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                BMI Gauge
              </p>
              <div className="flex-1 flex items-center justify-center">
                <BMIGauge
                  value={latest?.bmi?.value}
                  category={latest?.bmi?.category}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Risk flags ──────────────────────────────── */}
        {latest?.riskFlags?.length > 0 && (
          <motion.div variants={item}>
            <SectionHead
              title="Risk Alerts"
              action={
                <Link
                  to="/chat"
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  Ask AI <ChevronRight size={12} />
                </Link>
              }
            />
            <div className="space-y-2">
              {latest.riskFlags.map((flag, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                    flag.severity === "critical"
                      ? "bg-red-500/8 border-red-500/25"
                      : flag.severity === "high"
                        ? "bg-orange-500/8 border-orange-500/25"
                        : "bg-yellow-500/8 border-yellow-500/25"
                  }`}
                >
                  <AlertTriangle
                    size={16}
                    className={`flex-shrink-0 mt-0.5 ${
                      flag.severity === "critical"
                        ? "text-red-400"
                        : flag.severity === "high"
                          ? "text-orange-400"
                          : "text-yellow-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white capitalize">
                      {flag.type?.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {flag.message}
                    </p>
                  </div>
                  <Link
                    to="/chat"
                    className="text-xs text-brand-400 hover:text-brand-300 flex-shrink-0 flex items-center gap-1 transition-colors"
                  >
                    Ask AI <ChevronRight size={12} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Bottom: AI Insights + Recent Reports + Medications ── */}
        <motion.div variants={item} className="grid lg:grid-cols-3 gap-4">
          {/* AI Insights */}
          <div className="card">
            <SectionHead
              title="AI Insights"
              action={
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Zap size={10} className="text-purple-400" />
                  <span className="text-[10px] text-purple-400 font-medium">
                    Gemini AI
                  </span>
                </div>
              }
            />
            {insightLoad ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded-xl" />
                ))}
              </div>
            ) : insights && insights.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {insights.map((ins, i) => (
                  <InsightChip key={i} insight={ins} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <Brain size={32} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  Log vitals to get AI insights
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Log first vitals
                </button>
              </div>
            )}
          </div>

          {/* Recent Reports */}
          <div className="card">
            <SectionHead
              title="Recent Reports"
              action={
                <Link
                  to="/reports"
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  View all <ChevronRight size={12} />
                </Link>
              }
            />
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 skeleton rounded-lg" />
                ))}
              </div>
            ) : dashboard?.recentReports?.length > 0 ? (
              dashboard.recentReports.map((r) => (
                <ReportRow key={r._id} report={r} />
              ))
            ) : (
              <div className="text-center py-8">
                <FileText size={32} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">No reports yet</p>
                <Link
                  to="/reports"
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Upload a report
                </Link>
              </div>
            )}
          </div>

          {/* Today's Medications */}
          <div className="card">
            <SectionHead
              title="Today's Medications"
              action={
                <Link
                  to="/medications"
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  Manage <ChevronRight size={12} />
                </Link>
              }
            />
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 skeleton rounded-lg" />
                ))}
              </div>
            ) : dashboard?.todayMeds?.length > 0 ? (
              dashboard.todayMeds.map((m) => <MedRow key={m._id} med={m} />)
            ) : (
              <div className="text-center py-8">
                <Pill size={32} className="text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  No medications added
                </p>
                <Link
                  to="/medications"
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Add medication
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Quick actions ────────────────────────────── */}
        <motion.div variants={item}>
          <SectionHead title="Quick Actions" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Chat with AI",
                icon: "🤖",
                to: "/chat",
                color:
                  "from-purple-500/15 to-purple-600/5 border-purple-500/20",
              },
              {
                label: "Upload Report",
                icon: "📁",
                to: "/reports",
                color: "from-cyan-500/15 to-cyan-600/5 border-cyan-500/20",
              },
              {
                label: "View Analytics",
                icon: "📈",
                to: "/analytics",
                color: "from-brand-500/15 to-brand-600/5 border-brand-500/20",
              },
              {
                label: "Health Education",
                icon: "📚",
                to: "/education",
                color:
                  "from-yellow-500/15 to-yellow-600/5 border-yellow-500/20",
              },
            ].map(({ label, icon, to, color }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-4 rounded-xl bg-gradient-to-br border ${color} cursor-pointer text-center`}
                >
                  <span className="text-2xl block mb-2">{icon}</span>
                  <p className="text-xs font-medium text-gray-300">{label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Log Vitals Modal */}
      <LogVitalsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleLogVitals}
        isLoading={logLoading}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
