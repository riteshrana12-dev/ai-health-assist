import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 4 }}
    transition={{ duration: 0.2 }}
    className="flex gap-3 items-end"
  >
    {/* Bot avatar */}
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-health-500/20 to-brand-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
      <Bot size={14} className="text-health-400" />
    </div>

    {/* Bubble */}
    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-dark-100 border border-white/8 flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-500"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">HealthBot is thinking…</span>
    </div>
  </motion.div>
);

export default TypingIndicator;
