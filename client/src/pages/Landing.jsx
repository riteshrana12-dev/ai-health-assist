import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useAnimation } from "framer-motion";
import {
  Heart,
  Brain,
  BarChart3,
  Shield,
  FileSearch,
  Pill,
  ArrowRight,
  Star,
  Zap,
  CheckCircle,
  ChevronDown,
} from "lucide-react";

// ── Animation variants ────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

// ── Animated section helper ───────────────────────────────────
const AnimatedSection = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ── Feature cards data ────────────────────────────────────────
const FEATURES = [
  {
    icon: Brain,
    title: "AI Health Chatbot",
    desc: "Describe symptoms and get intelligent AI-powered insights. Emergency detection built in.",
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
  },
  {
    icon: FileSearch,
    title: "Report Analyzer",
    desc: "Upload lab reports & medical PDFs. AI explains results in plain language instantly.",
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
  },
  {
    icon: BarChart3,
    title: "Health Dashboard",
    desc: "Track BMI, blood pressure, glucose, and heart rate. Visualize trends over time.",
    color: "from-brand-500/20 to-brand-600/5",
    border: "border-brand-500/20",
    iconBg: "bg-brand-500/15",
    iconColor: "text-brand-400",
  },
  {
    icon: Shield,
    title: "Risk Prediction",
    desc: "AI-powered risk assessment for cardiovascular, diabetes, and metabolic conditions.",
    color: "from-health-500/20 to-health-600/5",
    border: "border-health-500/20",
    iconBg: "bg-health-500/15",
    iconColor: "text-health-400",
  },
  {
    icon: Pill,
    title: "Medication Tracker",
    desc: "Never miss a dose. Smart reminders and drug interaction checking powered by AI.",
    color: "from-orange-500/20 to-orange-600/5",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/15",
    iconColor: "text-orange-400",
  },
  {
    icon: Heart,
    title: "Health Education",
    desc: "AI explains diseases, symptoms, and preventive care in language you can understand.",
    color: "from-pink-500/20 to-pink-600/5",
    border: "border-pink-500/20",
    iconBg: "bg-pink-500/15",
    iconColor: "text-pink-400",
  },
];

const STATS = [
  { value: "10K+", label: "Health Reports Analyzed" },
  { value: "98%", label: "AI Accuracy Rate" },
  { value: "24/7", label: "AI Assistant Available" },
  { value: "50+", label: "Health Metrics Tracked" },
];

const BENEFITS = [
  "Personalized AI health insights",
  "Medical report analysis in seconds",
  "Emergency symptom detection",
  "Medication interaction checker",
  "Trend analysis with visual charts",
  "Preventive healthcare guidance",
];

// ── Floating health metric cards ──────────────────────────────
const FloatingCard = ({ className, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
    className={`absolute glass-card px-4 py-3 shadow-card ${className}`}
  >
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
const Landing = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-blue">
              <Heart size={16} className="text-white" fill="currentColor" />
            </div>
            <span className="font-display font-semibold text-white">
              AI Health Assist
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-health-500/4 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero text */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-medium mb-6"
            >
              <Zap size={12} />
              Powered by Google Gemini AI
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Your AI-Powered <span className="gradient-text-blue">Health</span>
              <br />
              Companion
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-gray-400 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Track vitals, analyze medical reports, detect risks early, and get
              personalized health insights — all in one intelligent platform.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10"
            >
              <Link to="/signup">
                <motion.button
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 0 30px rgba(59,130,246,0.4)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto"
                >
                  Start for Free
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto"
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>

            {/* Benefits checklist */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              {BENEFITS.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 text-sm text-gray-400"
                >
                  <CheckCircle
                    size={14}
                    className="text-health-400 flex-shrink-0"
                  />
                  {b}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Visual demo */}
          <div className="relative h-[480px] hidden lg:block">
            {/* Main dashboard card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
              className="absolute inset-0 glass-card p-6 overflow-hidden"
            >
              {/* Mini dashboard preview */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                  <Heart size={12} className="text-white" fill="currentColor" />
                </div>
                <span className="text-sm font-medium text-white">
                  Health Dashboard
                </span>
                <div className="ml-auto flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === 0 ? "bg-red-400" : i === 1 ? "bg-yellow-400" : "bg-green-400"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Health score ring */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-white/3 rounded-xl border border-white/5">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="163"
                      initial={{ strokeDashoffset: 163 }}
                      animate={{ strokeDashoffset: 41 }}
                      transition={{
                        delay: 0.8,
                        duration: 1.2,
                        ease: "easeOut",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">87</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Health Score</p>
                  <p className="text-sm font-semibold text-health-400">
                    Excellent
                  </p>
                  <p className="text-xs text-gray-500">↑ 4 pts this week</p>
                </div>
              </div>

              {/* Vitals grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  {
                    label: "Blood Pressure",
                    value: "118/76",
                    unit: "mmHg",
                    color: "text-brand-400",
                    status: "Normal",
                  },
                  {
                    label: "Blood Glucose",
                    value: "94",
                    unit: "mg/dL",
                    color: "text-health-400",
                    status: "Normal",
                  },
                  {
                    label: "BMI",
                    value: "22.4",
                    unit: "kg/m²",
                    color: "text-cyan-400",
                    status: "Normal",
                  },
                  {
                    label: "Heart Rate",
                    value: "72",
                    unit: "bpm",
                    color: "text-pink-400",
                    status: "Normal",
                  },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="p-2.5 bg-white/3 rounded-xl border border-white/5"
                  >
                    <p className="text-[10px] text-gray-500 mb-1">{v.label}</p>
                    <p className={`text-sm font-bold ${v.color}`}>
                      {v.value}{" "}
                      <span className="text-[10px] font-normal text-gray-500">
                        {v.unit}
                      </span>
                    </p>
                    <p className="text-[10px] text-health-400 mt-0.5">
                      {v.status}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mini chart bars */}
              <div className="p-3 bg-white/3 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 mb-2">
                  7-day glucose trend
                </p>
                <div className="flex items-end gap-1 h-8">
                  {[65, 80, 72, 90, 78, 85, 94].map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${(v / 100) * 32}px` }}
                      transition={{
                        delay: 1 + i * 0.08,
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                      className="flex-1 rounded-sm bg-brand-500/60"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating badges */}
            <FloatingCard className="-top-4 -right-4" delay={0.6}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-health-500/20 flex items-center justify-center">
                  <Brain size={12} className="text-health-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">AI Analysis</p>
                  <p className="text-xs font-semibold text-white">
                    Report Ready
                  </p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard className="-bottom-4 -left-4" delay={0.8}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Pill size={12} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Reminder</p>
                  <p className="text-xs font-semibold text-white">
                    Medication Due
                  </p>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 flex flex-col items-center gap-1"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown size={16} />
        </motion.div>
      </section>

      {/* ── STATS ──────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5 bg-dark-card/30">
        <AnimatedSection className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <motion.div key={label} variants={fadeUp} className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-bold gradient-text-blue mb-1">
                {value}
              </p>
              <p className="text-gray-400 text-sm">{label}</p>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <motion.p
              variants={fadeUp}
              className="text-brand-400 text-sm font-medium uppercase tracking-wider mb-3"
            >
              Features
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Everything you need for
              <br />
              <span className="gradient-text-purple">smarter healthcare</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-gray-400 max-w-xl mx-auto"
            >
              AI Health Assist combines cutting-edge AI with clinical knowledge
              to give you a complete health companion.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(
              ({
                icon: Icon,
                title,
                desc,
                color,
                border,
                iconBg,
                iconColor,
              }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${color} border ${border} overflow-hidden group cursor-pointer`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon size={20} className={iconColor} />
                  </div>
                  <h3 className="font-display font-semibold text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {desc}
                  </p>

                  {/* Hover glow */}
                  <div
                    className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 bg-gradient-to-br ${color}`}
                  />
                </motion.div>
              ),
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* ── TESTIMONIAL / TRUST ────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-dark-card/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <motion.div
              variants={fadeUp}
              className="flex justify-center gap-1 mb-6"
            >
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className="text-yellow-400 fill-yellow-400"
                />
              ))}
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="font-display text-2xl sm:text-3xl text-white leading-relaxed mb-6"
            >
              "AI Health Assist helped me understand my lab results in seconds.
              The risk prediction feature flagged my pre-diabetic trend before
              my doctor did."
            </motion.p>
            <motion.div
              variants={fadeIn}
              className="flex items-center justify-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                RK
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Rajesh Kumar</p>
                <p className="text-xs text-gray-500">Software Engineer, Pune</p>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-brand-500/10 via-purple-600/5 to-health-500/10 border border-white/10 overflow-hidden"
          >
            {/* BG glow */}
            <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 to-transparent pointer-events-none" />

            <motion.div
              variants={fadeUp}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-blue"
            >
              <Heart size={28} className="text-white" fill="currentColor" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="font-display text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Start your health journey today
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 mb-8 text-lg">
              Join thousands of people who are taking control of their health
              with AI.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link to="/signup">
                <motion.button
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 0 40px rgba(59,130,246,0.5)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary px-10 py-4 text-base"
                >
                  Create Free Account
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
            </motion.div>
            <p className="text-xs text-gray-600 mt-4">
              No credit card required · Free forever plan available
            </p>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Heart size={12} className="text-white" fill="currentColor" />
            </div>
            <span className="text-sm font-medium text-gray-400">
              AI Health Assist
            </span>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} AI Health Assist. For educational
            purposes only — not a substitute for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
