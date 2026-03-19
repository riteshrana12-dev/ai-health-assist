import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Brain,
  ChevronRight,
  Heart,
  Activity,
  Droplets,
  Zap,
  Shield,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import { chatService } from "../services/chatService";

// ── Categories — static Tailwind classes (no dynamic strings) ─
const CATEGORIES = [
  {
    id: "cardiovascular",
    label: "Heart & Circulation",
    icon: Heart,
    activeCls: "bg-red-500/15 border-red-500/30 text-red-400",
    iconCls: "text-red-400",
  },
  {
    id: "diabetes",
    label: "Diabetes & Blood Sugar",
    icon: Droplets,
    activeCls: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    iconCls: "text-blue-400",
  },
  {
    id: "respiratory",
    label: "Respiratory",
    icon: Activity,
    activeCls: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    iconCls: "text-cyan-400",
  },
  {
    id: "mental",
    label: "Mental Health",
    icon: Brain,
    activeCls: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    iconCls: "text-purple-400",
  },
  {
    id: "immunity",
    label: "Immunity & Infection",
    icon: Shield,
    activeCls: "bg-health-500/15 border-health-500/30 text-health-400",
    iconCls: "text-health-400",
  },
  {
    id: "general",
    label: "General Health",
    icon: Zap,
    activeCls: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
    iconCls: "text-yellow-400",
  },
];

// ── Topics per category ───────────────────────────────────────
const QUICK_TOPICS = {
  cardiovascular: [
    "Hypertension",
    "Coronary Artery Disease",
    "Heart Failure",
    "Arrhythmia",
    "Stroke",
    "Atherosclerosis",
  ],
  diabetes: [
    "Type 2 Diabetes",
    "Prediabetes",
    "Hypoglycemia",
    "Insulin Resistance",
    "Diabetes Complications",
    "HbA1c",
  ],
  respiratory: [
    "Asthma",
    "COPD",
    "Pneumonia",
    "Tuberculosis",
    "Sleep Apnea",
    "Chronic Bronchitis",
  ],
  mental: [
    "Depression",
    "Anxiety Disorder",
    "Bipolar Disorder",
    "Panic Attacks",
    "Insomnia",
    "Burnout Syndrome",
  ],
  immunity: [
    "Autoimmune Diseases",
    "Thyroid Disorders",
    "Anemia",
    "Vitamin D Deficiency",
    "UTI",
    "Dengue Fever",
  ],
  general: [
    "Obesity",
    "High Cholesterol",
    "Kidney Stones",
    "Fatty Liver",
    "Migraine",
    "Osteoporosis",
  ],
};

// ── Featured starter topics ───────────────────────────────────
const FEATURED = [
  { label: "Hypertension", icon: "🫀" },
  { label: "Type 2 Diabetes", icon: "🩸" },
  { label: "Depression", icon: "🧠" },
  { label: "Asthma", icon: "🫁" },
  { label: "High Cholesterol", icon: "⚠️" },
  { label: "Migraine", icon: "🤕" },
];

// ── Markdown renderer ─────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text || typeof text !== "string") return null;

  return text.split("\n").map((line, i) => {
    // ## Heading
    if (line.startsWith("## ")) {
      return (
        <p
          key={i}
          className="font-semibold text-white text-sm mt-4 mb-1.5 first:mt-0"
        >
          {line.slice(3)}
        </p>
      );
    }
    // # Heading
    if (line.startsWith("# ")) {
      return (
        <p
          key={i}
          className="font-bold text-white text-base mt-4 mb-2 first:mt-0"
        >
          {line.slice(2)}
        </p>
      );
    }
    // Bullet point
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <div key={i} className="flex items-start gap-2 my-1">
          <span
            className="text-brand-400 flex-shrink-0 mt-1.5"
            style={{ fontSize: 8 }}
          >
            ●
          </span>
          <span className="text-sm text-gray-300 leading-relaxed">
            {renderInline(line.slice(2))}
          </span>
        </div>
      );
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        return (
          <div key={i} className="flex items-start gap-2 my-1">
            <span className="text-brand-400 flex-shrink-0 text-xs font-mono mt-0.5">
              {match[1]}.
            </span>
            <span className="text-sm text-gray-300 leading-relaxed">
              {renderInline(match[2])}
            </span>
          </div>
        );
      }
    }
    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      return <hr key={i} className="border-white/8 my-3" />;
    }
    // Empty line
    if (!line.trim()) {
      return <div key={i} className="h-2" />;
    }
    // Normal text
    return (
      <p key={i} className="text-sm text-gray-300 leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });
};

// Inline bold (**text**) and italic (*text*)
const renderInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-gray-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

// ─────────────────────────────────────────────────────────────
const HealthEducation = () => {
  const [selectedCat, setSelectedCat] = useState("cardiovascular");
  const [searchTerm, setSearchTerm] = useState("");
  const [explanation, setExplanation] = useState(null); // string | null
  const [currentTopic, setCurrentTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const rightPanelRef = useRef(null);

  const cat = CATEGORIES.find((c) => c.id === selectedCat);

  // ── Fetch explanation from Gemini ──────────────────────────
  const fetchExplanation = async (topic) => {
    const trimmed = topic?.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    setCurrentTopic(trimmed);
    setExplanation(null);
    setSearchTerm("");

    // Scroll right panel to top
    setTimeout(() => {
      rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);

    try {
      const { data } = await chatService.explainCondition(trimmed);

      // API returns: { success: true, data: { explanation: "...", condition: "..." } }
      const text = data?.data?.explanation || data?.explanation || null;

      if (!text) throw new Error("No explanation returned");

      setExplanation(text);
      // Add to history (max 8, deduplicated case-insensitively)
      setHistory((prev) =>
        [
          trimmed,
          ...prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, 8),
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to get explanation";
      setError(msg);
      setExplanation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) fetchExplanation(searchTerm.trim());
  };

  const handleClear = () => {
    setExplanation(null);
    setCurrentTopic("");
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-5 h-full pb-6">
        {/* ── LEFT: Categories + Topics ──────────────── */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any condition…"
                className="input-field pl-10 pr-10"
              />
              {searchTerm ? (
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              ) : null}
            </div>
          </form>

          {/* Category grid */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-2 px-1">
              Browse by Category
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const isActive = selectedCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-150 ${
                      isActive
                        ? c.activeCls
                        : "bg-white/3 border-white/8 text-gray-400 hover:bg-white/6 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={`flex-shrink-0 ${isActive ? c.iconCls : ""}`}
                    />
                    <span className="text-xs font-medium leading-tight">
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic chips for selected category */}
          <div className="card !p-4">
            <p className="text-xs font-medium text-white mb-3">{cat?.label}</p>
            <div className="flex flex-wrap gap-2">
              {(QUICK_TOPICS[selectedCat] || []).map((topic) => (
                <motion.button
                  key={topic}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fetchExplanation(topic)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                    currentTopic === topic && explanation
                      ? `${cat?.activeCls}`
                      : "bg-white/3 border-white/8 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/6 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {topic}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent history */}
          {history.length > 0 && (
            <div className="card !p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Recent Lookups
              </p>
              <div className="space-y-0.5">
                {history.map((h) => (
                  <button
                    key={h}
                    onClick={() => fetchExplanation(h)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                  >
                    <BookOpen
                      size={11}
                      className="text-gray-600 flex-shrink-0"
                    />
                    <span className="truncate">{h}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Explanation panel ────────────────── */}
        <div
          ref={rightPanelRef}
          className="flex-1 card overflow-y-auto"
          style={{ minHeight: "400px", maxHeight: "calc(100vh - 140px)" }}
        >
          <AnimatePresence mode="wait">
            {/* ── Loading ── */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.8,
                      ease: "linear",
                    }}
                  >
                    <Brain size={28} className="text-purple-400" />
                  </motion.div>
                </div>
                <p className="text-sm font-semibold text-white mb-1">
                  Explaining "{currentTopic}"…
                </p>
                <p className="text-xs text-gray-500">
                  Powered by Google Gemini AI
                </p>
                <div className="flex gap-1.5 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-purple-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Error ── */}
            {!isLoading && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                  <AlertCircle size={24} className="text-red-400" />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  Could not load explanation
                </p>
                <p className="text-xs text-gray-500 mb-1 max-w-xs">{error}</p>
                <p className="text-xs text-gray-600 mb-5 max-w-xs">
                  Make sure your GEMINI_API_KEY is set in the server .env file
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => fetchExplanation(currentTopic)}
                    className="btn-primary px-5 py-2 text-sm"
                  >
                    <RefreshCw size={13} /> Retry
                  </button>
                  <button
                    onClick={handleClear}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    <X size={13} /> Clear
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Explanation content ── */}
            {!isLoading && !error && explanation && (
              <motion.div
                key={currentTopic}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Topic header */}
                <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-white/6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={18} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">
                        {currentTopic}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Zap size={10} className="text-purple-400" />
                        <p className="text-xs text-gray-500">
                          AI explanation by Gemini
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => fetchExplanation(currentTopic)}
                      className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={handleClear}
                      className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
                      title="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Rendered markdown explanation */}
                <div className="space-y-0.5 leading-relaxed">
                  {renderMarkdown(explanation)}
                </div>

                {/* Disclaimer */}
                <div className="mt-6 p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/15">
                  <p className="text-xs text-brand-400 leading-relaxed">
                    <strong>Educational content only.</strong> This AI-generated
                    explanation is for general health awareness. Always consult
                    a qualified healthcare provider for personal medical advice,
                    diagnosis, or treatment.
                  </p>
                </div>

                {/* Related topics */}
                <div className="mt-5">
                  <p className="text-xs text-gray-500 font-medium mb-2.5">
                    More from {cat?.label || "this category"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(QUICK_TOPICS[selectedCat] || [])
                      .filter(
                        (t) => t.toLowerCase() !== currentTopic.toLowerCase(),
                      )
                      .slice(0, 5)
                      .map((t) => (
                        <button
                          key={t}
                          onClick={() => fetchExplanation(t)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-full bg-white/4 border border-white/8 text-xs text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/8 transition-all disabled:opacity-50"
                        >
                          {t}
                        </button>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Welcome / empty state ── */}
            {!isLoading && !error && !explanation && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                {/* Animated icon */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.5,
                    ease: "easeInOut",
                  }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/15 to-purple-600/10 border border-brand-500/20 flex items-center justify-center mb-5"
                >
                  <BookOpen size={28} className="text-brand-400" />
                </motion.div>

                <h2 className="font-display text-lg font-semibold text-white mb-2">
                  Health Education Library
                </h2>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-6">
                  Select any topic from the left panel, search for a condition,
                  or tap one of the quick-start topics below. Gemini AI will
                  explain it in simple, patient-friendly language.
                </p>

                {/* Featured topics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
                  {FEATURED.map(({ label, icon }) => (
                    <motion.button
                      key={label}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fetchExplanation(label)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-brand-500/30 transition-all duration-150"
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-xs text-gray-300 font-medium text-center leading-tight">
                        {label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <p className="text-xs text-gray-600 mt-6">
                  36 topics across 6 health categories · Powered by Google
                  Gemini AI
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HealthEducation;
