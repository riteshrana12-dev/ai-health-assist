import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image, X, CheckCircle, Loader2 } from "lucide-react";
import { formatFileSize } from "../../utils/formatters";

const ACCEPTED_TYPES = {
  "application/pdf": { ext: "PDF", icon: FileText, color: "text-red-400" },
  "image/jpeg": { ext: "JPG", icon: Image, color: "text-blue-400" },
  "image/jpg": { ext: "JPG", icon: Image, color: "text-blue-400" },
  "image/png": { ext: "PNG", icon: Image, color: "text-green-400" },
  "image/webp": { ext: "WEBP", icon: Image, color: "text-cyan-400" },
};

const UploadZone = ({
  onFileSelect,
  isUploading,
  progress,
  uploadedFile,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES[file.type]) {
      return "Unsupported file type. Please upload PDF, JPG, PNG, or WEBP.";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "File too large. Maximum size is 10 MB.";
    }
    return null;
  };

  const handleFile = useCallback(
    (file) => {
      setError("");
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  // File info for display
  const fileType = uploadedFile ? ACCEPTED_TYPES[uploadedFile.type] : null;
  const FileIcon = fileType?.icon || FileText;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {/* ── Uploaded state ── */}
        {uploadedFile && !isUploading ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-health-500/25 bg-health-500/5"
          >
            <div className="w-12 h-12 rounded-xl bg-health-500/10 flex items-center justify-center flex-shrink-0">
              <FileIcon
                size={22}
                className={fileType?.color || "text-gray-400"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fileType?.ext} · {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            <CheckCircle size={18} className="text-health-400 flex-shrink-0" />
            <button
              onClick={onClear}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : isUploading ? (
          /* ── Uploading state ── */
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-xl border border-brand-500/20 bg-brand-500/5 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center mx-auto mb-3">
              <Loader2 size={22} className="text-brand-400 animate-spin" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Uploading & Analyzing…
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Gemini AI is reading your report
            </p>
            {/* Progress bar */}
            <div className="progress-bar mx-auto max-w-xs">
              <motion.div
                className="progress-fill bg-gradient-to-r from-brand-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{progress}%</p>
          </motion.div>
        ) : (
          /* ── Drop zone ── */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`upload-zone cursor-pointer ${isDragging ? "drag-over border-brand-500 bg-brand-500/8" : ""}`}
          >
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/15 to-purple-500/10 border border-brand-500/20 flex items-center justify-center"
            >
              <Upload
                size={24}
                className={isDragging ? "text-brand-400" : "text-gray-400"}
              />
            </motion.div>

            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {isDragging
                  ? "Drop to upload"
                  : "Drop file here or click to browse"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports PDF, JPG, PNG, WEBP · Max 10 MB
              </p>
            </div>

            {/* File type pills */}
            <div className="flex gap-2 justify-center">
              {["PDF", "JPG", "PNG", "WEBP"].map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] text-gray-500"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400 flex items-center gap-1.5"
          >
            <X size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};

export default UploadZone;
