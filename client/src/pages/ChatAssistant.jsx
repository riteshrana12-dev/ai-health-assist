import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  AlertTriangle,
  Zap,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  Mic,
  Paperclip,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import MessageBubble from "../components/chat/MessageBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import { useChat } from "../hooks/useChat";

// ── Quick prompt chips ────────────────────────────────────────
const QUICK_PROMPTS = [
  {
    label: "Check my BP",
    text: "My blood pressure is 145/90 mmHg. Is this concerning?",
    icon: "🫀",
  },
  {
    label: "High blood sugar",
    text: "My fasting glucose is 130 mg/dL. What does this mean?",
    icon: "🩸",
  },
  {
    label: "Chest pain",
    text: "I have mild chest tightness and shortness of breath. What should I do?",
    icon: "⚠️",
  },
  {
    label: "Sleep tips",
    text: "I only sleep 5 hours a night. How does this affect my health?",
    icon: "😴",
  },
  {
    label: "Weight loss",
    text: "What is the healthiest way to lose 10 kg in 3 months?",
    icon: "⚖️",
  },
  {
    label: "Diabetes risk",
    text: "My father has diabetes. Am I at risk? What can I do to prevent it?",
    icon: "🧬",
  },
  {
    label: "Headache causes",
    text: "I get frequent headaches in the morning. What could be causing this?",
    icon: "🤕",
  },
  {
    label: "Hypertension diet",
    text: "What foods should I avoid and eat if I have high blood pressure?",
    icon: "🥗",
  },
];

// ── Emergency banner ──────────────────────────────────────────
const EmergencyBanner = ({ onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="mx-4 mb-3 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between gap-3"
  >
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
        <AlertTriangle size={16} className="text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-red-400">Emergency Detected</p>
        <p className="text-xs text-red-400/70">
          Please call emergency services (112 / 911) or go to your nearest
          hospital immediately.
        </p>
      </div>
    </div>
    <button
      onClick={onDismiss}
      className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
    >
      Dismiss
    </button>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
const ChatAssistant = () => {
  const {
    messages,
    isLoading,
    isEmergency,
    sendMessage,
    clearChat,
    addWelcomeMessage,
  } = useChat();

  const [input, setInput] = useState("");
  const [showScrollBtn, setScrollBtn] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const [emergencyDismissed, setEmergencyDismissed] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Add welcome message on mount
  useEffect(() => {
    if (messages.length === 0) addWelcomeMessage();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Show scroll-to-bottom button when scrolled up
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setScrollBtn(distFromBottom > 200);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    setShowQuick(false);
    setEmergencyDismissed(false);
    await sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (text) => {
    setInput(text);
    setShowQuick(false);
    inputRef.current?.focus();
  };

  const handleClear = async () => {
    await clearChat();
    addWelcomeMessage();
    setShowQuick(true);
    setEmergencyDismissed(false);
  };

  const showEmergencyBanner = isEmergency && !emergencyDismissed;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 lg:-m-6">
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-3.5 border-b border-white/5 bg-dark-card/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Animated bot icon */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-health-500/20 to-brand-500/20 border border-white/10 flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-health-500 border-2 border-dark-bg" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">HealthBot</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-health-500 animate-pulse" />
                <p className="text-xs text-gray-500">
                  {isLoading ? "Thinking…" : "Online · Powered by Gemini AI"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mr-2">
              <Zap size={10} className="text-purple-400" />
              <span className="text-[10px] text-purple-400 font-medium">
                Gemini AI
              </span>
            </div>
            <button
              onClick={handleClear}
              title="Clear conversation"
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* ── Emergency banner ───────────────────────── */}
        <AnimatePresence>
          {showEmergencyBanner && (
            <EmergencyBanner onDismiss={() => setEmergencyDismissed(true)} />
          )}
        </AnimatePresence>

        {/* ── Messages area ──────────────────────────── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() =>
                bottomRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-dark-100 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white shadow-lg z-10"
            >
              <ChevronDown size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Quick prompts ───────────────────────────── */}
        <AnimatePresence>
          {showQuick && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 lg:px-6 pb-3 flex-shrink-0"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <Lightbulb size={12} className="text-yellow-400" />
                <p className="text-xs text-gray-500 font-medium">
                  Quick questions
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {QUICK_PROMPTS.map(({ label, text, icon }) => (
                  <motion.button
                    key={label}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuickPrompt(text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 text-xs text-gray-300 hover:text-white hover:border-brand-500/40 hover:bg-brand-500/8 transition-all duration-150"
                  >
                    <span>{icon}</span>
                    {label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input bar ───────────────────────────────── */}
        <div className="px-4 lg:px-6 pb-4 flex-shrink-0 border-t border-white/5 pt-3">
          {/* Disclaimer */}
          <p className="text-[10px] text-gray-600 text-center mb-2">
            HealthBot provides general health information only — not medical
            advice. Always consult a doctor.
          </p>

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms or ask a health question…"
                rows={1}
                maxLength={2000}
                disabled={isLoading}
                className="input-field pr-12 resize-none min-h-[46px] max-h-32 py-3 leading-relaxed"
                style={{ height: "auto" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 128) + "px";
                }}
              />
              {/* Char count */}
              {input.length > 1800 && (
                <span
                  className={`absolute right-3 bottom-2 text-[10px] ${input.length > 1950 ? "text-red-400" : "text-gray-500"}`}
                >
                  {2000 - input.length}
                </span>
              )}
            </div>

            {/* Send button */}
            <motion.button
              whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
              whileTap={input.trim() && !isLoading ? { scale: 0.93 } : {}}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                input.trim() && !isLoading
                  ? "bg-brand-500 hover:bg-brand-600 text-white shadow-glow-blue"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </motion.button>
          </div>

          {/* Keyboard hint */}
          <p className="text-[10px] text-gray-700 text-right mt-1 hidden sm:block">
            Press{" "}
            <kbd className="px-1 py-0.5 rounded bg-white/5 text-gray-600 font-mono text-[9px]">
              Enter
            </kbd>{" "}
            to send ·
            <kbd className="px-1 py-0.5 rounded bg-white/5 text-gray-600 font-mono text-[9px] ml-1">
              Shift+Enter
            </kbd>{" "}
            for new line
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatAssistant;
