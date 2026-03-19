import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Filter,
  Star,
  RefreshCw,
  X,
  ChevronDown,
  Brain,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import UploadZone from "../components/reports/UploadZone";
import ReportCard from "../components/reports/ReportCard";
import AIExplanation from "../components/reports/AIExplanation";
import { reportService } from "../services/reportService";
import { getRiskLevelConfig, timeAgo, formatDate } from "../utils/formatters";
import toast from "react-hot-toast";

const RISK_FILTERS = ["all", "low", "moderate", "high", "critical", "unknown"];

// ── Detail side panel ─────────────────────────────────────────
const ReportDetailPanel = ({ report, onClose, onReAnalyze }) => {
  const [reanalyzing, setReanalyzing] = useState(false);

  if (!report) return null;

  const handleReAnalyze = async () => {
    setReanalyzing(true);
    await onReAnalyze(report._id);
    setReanalyzing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {report.title || report.fileName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(report.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 ml-3">
          {report.fileUrl && (
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
              title="Open original file"
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            onClick={handleReAnalyze}
            disabled={reanalyzing}
            title="Re-analyze with AI"
            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <RefreshCw
              size={15}
              className={reanalyzing ? "animate-spin text-purple-400" : ""}
            />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Thumbnail (images only) */}
      {report.thumbnailUrl && (
        <div className="px-5 py-3 border-b border-white/5 flex-shrink-0">
          <img
            src={report.thumbnailUrl}
            alt="Report preview"
            className="w-full max-h-40 object-contain rounded-xl bg-white/3"
          />
        </div>
      )}

      {/* AI Analysis */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <AIExplanation
          analysis={report.aiAnalysis}
          isLoading={false}
          reportTitle={report.title}
        />
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
const UploadReport = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [riskFilter, setRiskFilter] = useState("all");
  const [showStarred, setShowStarred] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    labName: "",
  });
  const [pollTimers, setPollTimers] = useState({});

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
    return () => Object.values(pollTimers).forEach(clearInterval);
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data } = await reportService.getAll({ limit: 20 });
      setReports(data.data.reports);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for analysis completion on pending reports
  useEffect(() => {
    const pending = reports.filter((r) =>
      ["pending", "processing", "analyzing"].includes(r.aiAnalysis?.status),
    );
    pending.forEach((r) => {
      if (pollTimers[r._id]) return;
      const timer = setInterval(async () => {
        try {
          const { data } = await reportService.getOne(r._id);
          const updated = data.data.report;
          if (
            updated.aiAnalysis?.status === "completed" ||
            updated.aiAnalysis?.status === "failed"
          ) {
            clearInterval(timer);
            setPollTimers((p) => {
              const n = { ...p };
              delete n[r._id];
              return n;
            });
            setReports((prev) =>
              prev.map((rep) => (rep._id === r._id ? updated : rep)),
            );
            if (selectedReport?._id === r._id) setSelectedReport(updated);
            if (updated.aiAnalysis?.status === "completed") {
              toast.success(
                `✅ Analysis complete: ${updated.title || updated.fileName}`,
              );
            }
          }
        } catch {}
      }, 4000); // poll every 4s
      setPollTimers((p) => ({ ...p, [r._id]: timer }));
    });
  }, [reports]);

  const handleFileSelect = useCallback(
    (file) => {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((p) => ({
          ...p,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        }));
      }
    },
    [formData.title],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append("report", selectedFile);
    if (formData.title) fd.append("title", formData.title);
    if (formData.description) fd.append("description", formData.description);
    if (formData.labName) fd.append("labName", formData.labName);

    try {
      const { data } = await reportService.upload(fd, setUploadProgress);
      toast.success("Report uploaded! AI analysis started…");
      setReports((prev) => [data.data.report, ...prev]);
      setSelectedFile(null);
      setFormData({ title: "", description: "", labName: "" });
      setUploadProgress(0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await reportService.delete(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
      if (selectedReport?._id === id) setSelectedReport(null);
      toast.success("Report deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleStar = async (id) => {
    try {
      const { data } = await reportService.toggleStar(id);
      setReports((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, isStarred: data.isStarred } : r,
        ),
      );
    } catch {}
  };

  const handleReAnalyze = async (id) => {
    try {
      await reportService.reAnalyze(id);
      setReports((prev) =>
        prev.map((r) =>
          r._id === id
            ? {
                ...r,
                aiAnalysis: { ...r.aiAnalysis, status: "processing" },
                processingStatus: "analyzing",
              }
            : r,
        ),
      );
      toast.success("Re-analysis started…");
    } catch {
      toast.error("Re-analysis failed");
    }
  };

  // Filtered reports
  const filtered = reports.filter((r) => {
    if (showStarred && !r.isStarred) return false;
    if (riskFilter !== "all" && r.aiAnalysis?.riskLevel !== riskFilter)
      return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="flex gap-6 h-full -m-4 lg:-m-6 overflow-hidden">
        {/* ── Left: Upload + Report list ──────────────── */}
        <div
          className={`flex flex-col ${selectedReport ? "hidden lg:flex lg:w-1/2" : "flex-1"} overflow-hidden`}
        >
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-6 space-y-6">
            {/* Upload card */}
            <div className="card">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                  <Upload size={16} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Upload Medical Report
                  </p>
                  <p className="text-xs text-gray-500">
                    AI will analyze and explain results in plain language
                  </p>
                </div>
              </div>

              <UploadZone
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                progress={uploadProgress}
                uploadedFile={selectedFile}
                onClear={() => setSelectedFile(null)}
              />

              {/* Optional metadata */}
              <AnimatePresence>
                {selectedFile && !isUploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="input-label">Report Title</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              title: e.target.value,
                            }))
                          }
                          placeholder="e.g. Blood Test Results"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="input-label">
                          Lab / Hospital Name
                        </label>
                        <input
                          type="text"
                          value={formData.labName}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              labName: e.target.value,
                            }))
                          }
                          placeholder="e.g. Apollo Diagnostics"
                          className="input-field"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpload}
                      className="btn-primary w-full py-3"
                    >
                      <Brain size={16} />
                      Upload & Analyze with AI
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">
                  Filter:
                </span>
                {RISK_FILTERS.slice(0, 4).map((f) => (
                  <button
                    key={f}
                    onClick={() => setRiskFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150 ${
                      riskFilter === f
                        ? "bg-brand-500/20 border border-brand-500/40 text-brand-400"
                        : "bg-white/4 border border-white/8 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowStarred((s) => !s)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  showStarred
                    ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                    : "bg-white/4 border-white/8 text-gray-400 hover:border-white/20"
                }`}
              >
                <Star
                  size={11}
                  className={showStarred ? "fill-yellow-400" : ""}
                />
                Starred
              </button>
            </div>

            {/* Reports grid */}
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 skeleton rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  No reports found
                </p>
                <p className="text-xs text-gray-600">
                  {reports.length === 0
                    ? "Upload your first medical report above"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.map((report, i) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    index={i}
                    onDelete={handleDelete}
                    onStar={handleStar}
                    onReAnalyze={handleReAnalyze}
                    onView={setSelectedReport}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: AI Explanation panel ─────────────── */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "50%" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:flex flex-col border-l border-white/5 bg-dark-card/40 overflow-hidden"
            >
              <ReportDetailPanel
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
                onReAnalyze={handleReAnalyze}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: Full-screen detail panel */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-0 bg-dark-bg z-50 flex flex-col"
            >
              <ReportDetailPanel
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
                onReAnalyze={handleReAnalyze}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default UploadReport;
