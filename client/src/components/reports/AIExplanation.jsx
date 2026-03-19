import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Lightbulb,
  ClipboardList,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { getRiskLevelConfig } from "../../utils/formatters";

// ── Status icon for a lab finding ────────────────────────────
const StatusIcon = ({ status }) => {
  const map = {
    normal: { icon: CheckCircle, color: "text-health-400" },
    low: { icon: TrendingDown, color: "text-blue-400" },
    high: { icon: TrendingUp, color: "text-orange-400" },
    critical_low: { icon: AlertTriangle, color: "text-red-500" },
    critical_high: { icon: AlertTriangle, color: "text-red-500" },
    unknown: { icon: Minus, color: "text-gray-500" },
  };
  const { icon: Icon, color } = map[status] || map.unknown;
  return <Icon size={15} className={color} />;
};

// ── Status badge ──────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    normal: {
      label: "Normal",
      bg: "bg-health-500/15",
      color: "text-health-400",
    },
    low: { label: "Low", bg: "bg-blue-500/15", color: "text-blue-400" },
    high: { label: "High", bg: "bg-orange-500/15", color: "text-orange-400" },
    critical_low: {
      label: "Critical Low",
      bg: "bg-red-500/15",
      color: "text-red-400",
    },
    critical_high: {
      label: "Critical High",
      bg: "bg-red-500/15",
      color: "text-red-400",
    },
    unknown: { label: "Unknown", bg: "bg-gray-500/15", color: "text-gray-400" },
  };
  const { label, bg, color } = map[status] || map.unknown;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${bg} ${color}`}
    >
      {label}
    </span>
  );
};

// ── Collapsible section ───────────────────────────────────────
const Collapsible = ({
  title,
  icon: Icon,
  iconColor,
  count,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/2 hover:bg-white/4 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className={iconColor} />
          <span className="text-sm font-medium text-white">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-gray-400">
              {count}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={14} className="text-gray-500" />
        ) : (
          <ChevronDown size={14} className="text-gray-500" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
const AIExplanation = ({ analysis, isLoading, reportTitle }) => {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-2/3 skeleton rounded" />
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-10 skeleton rounded-xl" />
        <div className="h-10 skeleton rounded-xl" />
        <div className="h-10 skeleton rounded-xl" />
      </div>
    );
  }

  // Pending / processing state
  if (
    !analysis ||
    analysis.status === "pending" ||
    analysis.status === "processing"
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Brain size={24} className="text-purple-400" />
          </motion.div>
        </div>
        <p className="text-sm font-medium text-white mb-1">
          AI Analysis in Progress
        </p>
        <p className="text-xs text-gray-500 max-w-xs">
          Gemini AI is reading your report and preparing a plain-language
          explanation…
        </p>
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Failed state
  if (analysis.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <p className="text-sm font-medium text-white mb-1">Analysis Failed</p>
        <p className="text-xs text-gray-500 mb-4">
          {analysis.errorMessage || "Unable to analyze this report."}
        </p>
      </div>
    );
  }

  const risk = getRiskLevelConfig(analysis.riskLevel);
  const hasUrgent = analysis.urgentFlags?.length > 0;
  const findings = analysis.keyFindings || [];
  const recs = analysis.recommendations || [];
  const preventive = analysis.preventiveSuggestions || [];
  const riskFactors = analysis.riskFactors || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              AI Analysis Complete
            </p>
            {analysis.confidenceScore !== undefined && (
              <p className="text-xs text-gray-500">
                Confidence: {Math.round(analysis.confidenceScore * 100)}%
              </p>
            )}
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${risk.bg} ${risk.color} ${risk.border}`}
        >
          <Shield size={11} />
          {risk.label}
        </div>
      </div>

      {/* ── Report type badge ── */}
      {analysis.reportType && analysis.reportType !== "other" && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-400">
          <ClipboardList size={11} />
          {analysis.reportType
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        </div>
      )}

      {/* ── Plain language summary ── */}
      {analysis.summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-brand-500/8 to-purple-600/5 border border-brand-500/15"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} className="text-brand-400" />
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
              Summary
            </p>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">
            {analysis.summary}
          </p>
        </motion.div>
      )}

      {/* ── Urgent flags — always visible if present ── */}
      {hasUrgent && (
        <div className="space-y-2">
          {analysis.urgentFlags.map((flag, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                flag.severity === "emergency"
                  ? "bg-red-500/10 border-red-500/25"
                  : flag.severity === "urgent"
                    ? "bg-orange-500/10 border-orange-500/25"
                    : "bg-yellow-500/10 border-yellow-500/25"
              }`}
            >
              <AlertTriangle
                size={15}
                className={`flex-shrink-0 mt-0.5 ${
                  flag.severity === "emergency"
                    ? "text-red-400"
                    : flag.severity === "urgent"
                      ? "text-orange-400"
                      : "text-yellow-400"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-0.5">
                  {flag.finding}
                </p>
                <p className="text-xs text-gray-400">{flag.action}</p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${
                  flag.severity === "emergency"
                    ? "bg-red-500/20 text-red-400"
                    : flag.severity === "urgent"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {flag.severity}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Key Findings ── */}
      {findings.length > 0 && (
        <Collapsible
          title="Key Findings"
          icon={ClipboardList}
          iconColor="text-brand-400"
          count={findings.length}
          defaultOpen={true}
        >
          <div className="space-y-3">
            {findings.map((finding, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/2 border border-white/5"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <StatusIcon status={finding.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-medium text-white">
                      {finding.parameter}
                    </p>
                    <StatusBadge status={finding.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {finding.value && (
                      <span className="text-xs font-semibold text-gray-200">
                        {finding.value}
                      </span>
                    )}
                    {finding.normalRange && (
                      <span className="text-xs text-gray-500">
                        · Normal: {finding.normalRange}
                      </span>
                    )}
                  </div>
                  {finding.explanation && (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {finding.explanation}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* ── Risk Factors ── */}
      {riskFactors.length > 0 && (
        <Collapsible
          title="Risk Factors Identified"
          icon={AlertTriangle}
          iconColor="text-orange-400"
          count={riskFactors.length}
          defaultOpen={hasUrgent}
        >
          <ul className="space-y-2">
            {riskFactors.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="text-orange-400 mt-1.5 text-[8px] flex-shrink-0">
                  ●
                </span>
                {r}
              </motion.li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* ── Recommendations ── */}
      {recs.length > 0 && (
        <Collapsible
          title="Recommendations"
          icon={Lightbulb}
          iconColor="text-yellow-400"
          count={recs.length}
          defaultOpen={true}
        >
          <ul className="space-y-2">
            {recs.map((rec, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5"
              >
                <CheckCircle
                  size={13}
                  className="text-health-400 flex-shrink-0 mt-0.5"
                />
                <span className="text-sm text-gray-300 leading-relaxed">
                  {rec}
                </span>
              </motion.li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* ── Preventive Suggestions ── */}
      {preventive.length > 0 && (
        <Collapsible
          title="Preventive Suggestions"
          icon={Shield}
          iconColor="text-health-400"
          count={preventive.length}
          defaultOpen={false}
        >
          <ul className="space-y-2">
            {preventive.map((p, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5"
              >
                <span className="text-health-400 mt-1.5 text-[8px] flex-shrink-0">
                  ●
                </span>
                <span className="text-sm text-gray-300 leading-relaxed">
                  {p}
                </span>
              </motion.li>
            ))}
          </ul>
        </Collapsible>
      )}

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-gray-600 text-center pt-1 leading-relaxed">
        AI analysis is for educational purposes only and does not replace
        professional medical diagnosis. Always consult a qualified healthcare
        provider about your results.
      </p>
    </motion.div>
  );
};

export default AIExplanation;
