import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay, ease: "easeOut" },
  },
});

// Password strength checker
const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  const map = {
    0: { label: "", color: "bg-transparent" },
    1: { label: "Weak", color: "bg-red-500" },
    2: { label: "Fair", color: "bg-orange-500" },
    3: { label: "Good", color: "bg-yellow-500" },
    4: { label: "Strong", color: "bg-health-500" },
  };
  return { score, ...map[score] };
};

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
const BLOOD_GRP = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];

const Signup = () => {
  const [step, setStep] = useState(1); // 1 = account, 2 = health profile
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    bloodGroup: "unknown",
  });

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length < 2)
      e.name = "Name must be at least 2 characters";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      age: form.age ? parseInt(form.age) : undefined,
      gender: form.gender || undefined,
      bloodGroup: form.bloodGroup || "unknown",
    };
    const result = await register(payload);
    if (result.success) navigate("/dashboard", { replace: true });
  };

  const strength = getPasswordStrength(form.password);

  const BENEFITS = [
    "AI-powered health insights",
    "Medical report analyzer",
    "Emergency symptom detection",
    "Medication reminders",
  ];

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* ── Left decorative panel ───────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 bg-gradient-to-br from-dark-card via-dark-200 to-dark-bg border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-health-500/8 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-xs">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-health-500 to-brand-500 flex items-center justify-center mb-6 shadow-glow-green"
          >
            <Heart size={28} className="text-white" fill="currentColor" />
          </motion.div>

          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Start your health journey
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Create your free account and get personalised AI health insights in
            minutes.
          </p>

          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                className="flex items-center gap-2.5"
              >
                <CheckCircle
                  size={16}
                  className="text-health-400 flex-shrink-0"
                />
                <span className="text-sm text-gray-300">{b}</span>
              </motion.div>
            ))}
          </div>

          {/* Step progress indicator */}
          <div className="mt-10 flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    step >= s
                      ? "bg-brand-500 text-white"
                      : "bg-white/8 text-gray-500"
                  }`}
                >
                  {step > s ? <CheckCircle size={14} /> : s}
                </div>
                <span
                  className={`text-xs transition-colors ${step >= s ? "text-gray-300" : "text-gray-600"}`}
                >
                  {s === 1 ? "Account" : "Health Profile"}
                </span>
                {s < 2 && <div className="w-8 h-px bg-white/10 ml-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div {...fadeUp(0)} className="flex items-center gap-2.5 mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-blue">
                <Heart size={18} className="text-white" fill="currentColor" />
              </div>
              <span className="font-display font-semibold text-white">
                AI Health Assist
              </span>
            </Link>
          </motion.div>

          {/* Heading */}
          <motion.div {...fadeUp(0.05)} className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-1">
              {step === 1 ? "Create your account" : "Complete your profile"}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 1
                ? "Free forever · No credit card required"
                : "Help us personalise your AI health insights"}
            </p>
          </motion.div>

          {/* Mobile step indicator */}
          <div className="flex gap-2 mb-6 lg:hidden">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= s ? "bg-brand-500" : "bg-white/10"}`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Account details ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Name */}
                  <div>
                    <label className="input-label">Full name</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="Riya Sharma"
                        autoComplete="name"
                        className={`input-field pl-10 ${errors.name ? "border-red-500/50" : ""}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="input-label">Email address</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={form.email}
                        onChange={handleChange("email")}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`input-field pl-10 ${errors.email ? "border-red-500/50" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="input-label">Password</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange("password")}
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                        className={`input-field pl-10 pr-10 ${errors.password ? "border-red-500/50" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((p) => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {errors.password}
                      </p>
                    )}

                    {/* Strength meter */}
                    {form.password && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2"
                      >
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength.score
                                  ? strength.color
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        {strength.label && (
                          <p
                            className={`text-xs ${
                              strength.score === 4
                                ? "text-health-400"
                                : strength.score === 3
                                  ? "text-yellow-400"
                                  : strength.score === 2
                                    ? "text-orange-400"
                                    : "text-red-400"
                            }`}
                          >
                            {strength.label} password
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{
                      scale: 1.01,
                      boxShadow: "0 0 24px rgba(59,130,246,0.35)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full py-3.5"
                  >
                    Continue
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 2: Health profile ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Age */}
                    <div>
                      <label className="input-label">Age (optional)</label>
                      <input
                        type="number"
                        value={form.age}
                        onChange={handleChange("age")}
                        placeholder="e.g. 28"
                        min="1"
                        max="120"
                        className="input-field"
                      />
                    </div>

                    {/* Blood Group */}
                    <div>
                      <label className="input-label">Blood Group</label>
                      <div className="relative">
                        <select
                          value={form.bloodGroup}
                          onChange={handleChange("bloodGroup")}
                          className="input-field appearance-none pr-8"
                        >
                          {BLOOD_GRP.map((bg) => (
                            <option
                              key={bg}
                              value={bg}
                              className="bg-dark-card"
                            >
                              {bg === "unknown" ? "Unknown" : bg}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="input-label">Gender (optional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, gender: g }))}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 capitalize ${
                            form.gender === g
                              ? "bg-brand-500/20 border-brand-500/50 text-brand-400"
                              : "bg-white/3 border-white/8 text-gray-400 hover:border-white/20"
                          }`}
                        >
                          {g.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="p-3.5 rounded-xl bg-brand-500/5 border border-brand-500/15">
                    <p className="text-xs text-brand-400 font-medium mb-1">
                      Why we ask
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This helps our AI provide more accurate and personalised
                      health insights. You can always update this later in your
                      profile.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-secondary flex-1 py-3.5"
                    >
                      Back
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={
                        !isLoading
                          ? {
                              scale: 1.01,
                              boxShadow: "0 0 24px rgba(59,130,246,0.35)",
                            }
                          : {}
                      }
                      whileTap={!isLoading ? { scale: 0.98 } : {}}
                      className="btn-primary flex-1 py-3.5"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />{" "}
                          Creating…
                        </>
                      ) : (
                        <>
                          Create Account <ArrowRight size={18} />
                        </>
                      )}
                    </motion.button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-xs text-gray-500 hover:text-gray-400 transition-colors py-1"
                  >
                    Skip for now — fill profile later
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
