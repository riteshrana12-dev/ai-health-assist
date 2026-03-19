/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        health: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        purple: {
          500: "#a855f7",
          600: "#9333ea",
          700: "#7c3aed",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
        dark: {
          100: "#1E1E2F",
          200: "#16162A",
          300: "#0F0F23",
          400: "#0D0D0D",
          bg: "#0D0D0D",
          card: "#1E1E2F",
          border: "#2A2A3F",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      /* ✅ ADD THIS (fixes opacity issues cleanly) */
      backgroundColor: {
        "white-8": "rgba(255,255,255,0.08)",
        "white-3": "rgba(255,255,255,0.03)",
      },

      boxShadow: {
        "glow-blue":
          "0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.1)",
        "glow-green": "0 0 20px rgba(34,197,94,0.3)",
        "glow-purple":
          "0 0 20px rgba(124,58,237,0.3), 0 0 40px rgba(124,58,237,0.1)",
        "glow-cyan": "0 0 20px rgba(0,212,255,0.3)",
      },

      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(59,130,246,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(59,130,246,0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },

  plugins: [],
};
