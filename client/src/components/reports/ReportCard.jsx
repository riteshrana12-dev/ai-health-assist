import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image,
  Trash2,
  Star,
  RefreshCw,
  Eye,
  MoreVertical,
  Calendar,
  Brain,
} from "lucide-react";
import {
  timeAgo,
  formatFileSize,
  getRiskLevelConfig,
  truncate,
} from "../../utils/formatters";

const ReportCard = ({
  report,
  onDelete,
  onStar,
  onReAnalyze,
  onView,
  index,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const risk = getRiskLevelConfig(report.aiAnalysis?.riskLevel);
  const isImage = report.fileType?.startsWith("image/");
  const isPending = ["pending", "processing", "analyzing"].includes(
    report.aiAnalysis?.status,
  );
  const isFailed = report.aiAnalysis?.status === "failed";
  const isDone = report.aiAnalysis?.status === "completed";

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(report._id);
    setDeleting(false);
  };

  const statusBadge = isPending
    ? { label: "Analyzing…", bg: "bg-purple-500/15", color: "text-purple-400" }
    : isFailed
      ? { label: "Failed", bg: "bg-red-500/15", color: "text-red-400" }
      : isDone
        ? { label: risk.label, bg: risk.bg, color: risk.color }
        : { label: "Pending", bg: "bg-gray-500/15", color: "text-gray-400" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="card group relative overflow-hidden"
    >
      {/* Thumbnail strip */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {report.thumbnailUrl ? (
            <img
              src={report.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : isImage ? (
            <Image size={18} className="text-blue-400" />
          ) : (
            <FileText size={18} className="text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {report.title || report.fileName}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-gray-500">
              {timeAgo(report.createdAt)}
            </span>
            {report.fileSize && (
              <span className="text-[10px] text-gray-600">
                · {formatFileSize(report.fileSize)}
              </span>
            )}
          </div>
        </div>

        {/* Action menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-8 w-40 bg-dark-100 border border-white/10 rounded-xl shadow-card overflow-hidden z-20"
              >
                {[
                  {
                    label: "View",
                    icon: Eye,
                    action: () => {
                      onView(report);
                      setMenuOpen(false);
                    },
                    color: "",
                  },
                  {
                    label: report.isStarred ? "Unstar" : "Star",
                    icon: Star,
                    action: () => {
                      onStar(report._id);
                      setMenuOpen(false);
                    },
                    color: report.isStarred ? "text-yellow-400" : "",
                  },
                  {
                    label: "Re-analyze",
                    icon: RefreshCw,
                    action: () => {
                      onReAnalyze(report._id);
                      setMenuOpen(false);
                    },
                    color: "text-purple-400",
                  },
                  {
                    label: "Delete",
                    icon: Trash2,
                    action: () => {
                      handleDelete();
                      setMenuOpen(false);
                    },
                    color: "text-red-400",
                  },
                ].map(({ label, icon: Icon, action, color }) => (
                  <button
                    key={label}
                    onClick={action}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${color || "text-gray-300"}`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* AI Summary snippet */}
      {isDone && report.aiAnalysis?.summary && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
          {truncate(report.aiAnalysis.summary, 100)}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Status */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.bg} ${statusBadge.color}`}
          >
            {isPending && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="inline-block"
              >
                <Brain size={9} />
              </motion.span>
            )}
            {statusBadge.label}
          </span>

          {/* Star */}
          {report.isStarred && (
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
          )}
        </div>

        {/* View button */}
        <button
          onClick={() => onView(report)}
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
        >
          <Eye size={12} />
          View
        </button>
      </div>

      {/* Deleting overlay */}
      {deleting && (
        <div className="absolute inset-0 bg-dark-card/80 flex items-center justify-center rounded-xl">
          <RefreshCw size={16} className="text-gray-400 animate-spin" />
        </div>
      )}
    </motion.div>
  );
};

export default ReportCard;
