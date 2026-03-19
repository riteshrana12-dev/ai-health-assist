import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  },
});

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password.trim()) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const result = await login(form.email, form.password);
    if (result.success) navigate(from, { replace: true });
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* ── Left panel — form ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            {...fadeUp(0)}
            className="flex items-center gap-2.5 mb-10"
          >
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-blue group-hover:scale-105 transition-transform">
                <Heart size={18} className="text-white" fill="currentColor" />
              </div>
              <span className="font-display font-semibold text-white">
                AI Health Assist
              </span>
            </Link>
          </motion.div>

          {/* Heading */}
          <motion.div {...fadeUp(0.05)} className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-400">Sign in to your health dashboard</p>
          </motion.div>

          {/* Form */}
          <motion.form
            {...fadeUp(0.1)}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
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
                  className={`input-field pl-10 ${errors.email ? "border-red-500/50 focus:border-red-500" : ""}`}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1.5"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Password</label>
                <button
                  type="button"
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`input-field pl-10 pr-10 ${errors.password ? "border-red-500/50 focus:border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1.5"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={
                !isLoading
                  ? { scale: 1.01, boxShadow: "0 0 24px rgba(59,130,246,0.4)" }
                  : {}
              }
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              className="btn-primary w-full py-3.5 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Divider */}
          <motion.div {...fadeUp(0.15)} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-dark-bg px-3 text-xs text-gray-500">or</span>
            </div>
          </motion.div>

          {/* Demo credentials */}
          <motion.div
            {...fadeUp(0.18)}
            className="p-4 rounded-xl border border-brand-500/20 bg-brand-500/5 mb-6"
          >
            <p className="text-xs font-medium text-brand-400 mb-2">
              Demo Account
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>
                <span className="text-gray-500">Email: </span>
                <button
                  type="button"
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={() =>
                    setForm((p) => ({ ...p, email: "demo@aihealth.com" }))
                  }
                >
                  demo@aihealth.com
                </button>
              </div>
              <div>
                <span className="text-gray-500">Password: </span>
                <button
                  type="button"
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={() =>
                    setForm((p) => ({ ...p, password: "demo1234" }))
                  }
                >
                  demo1234
                </button>
              </div>
            </div>
          </motion.div>

          {/* Sign up link */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-center text-sm text-gray-400"
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Create one free
            </Link>
          </motion.p>
        </div>
      </div>

      {/* ── Right panel — decorative (desktop only) ──── */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gradient-to-br from-dark-card via-dark-200 to-dark-bg relative overflow-hidden border-l border-white/5">
        {/* BG glows */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-sm text-center">
          {/* Icon */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-blue"
          >
            <Heart size={36} className="text-white" fill="currentColor" />
          </motion.div>

          <h2 className="font-display text-2xl font-bold text-white mb-4">
            Your health, intelligently managed
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            AI-powered insights, report analysis, and personalized health
            guidance — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "AI Chatbot",
              "Report Analysis",
              "Risk Detection",
              "Vitals Tracking",
              "Medications",
              "Health Score",
            ].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-xs text-gray-400"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
