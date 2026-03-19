import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      className={`relative w-12 h-6 rounded-full border border-white/10 transition-colors duration-300 ${
        isDark ? "bg-dark-100" : "bg-gray-200"
      } ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        animate={{ x: isDark ? 2 : 22 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center"
      >
        {isDark ? (
          <Moon size={10} className="text-gray-700" />
        ) : (
          <Sun size={10} className="text-yellow-500" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
