import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Loader2,
  Activity,
  Droplets,
  Scale,
  Heart,
  Thermometer,
} from "lucide-react";

const MEAL_STATES = [
  { value: "fasting", label: "Fasting" },
  { value: "post_meal", label: "Post Meal" },
  { value: "random", label: "Random" },
  { value: "bedtime", label: "Bedtime" },
];

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "number",
  min,
  max,
  unit,
  icon: Icon,
  iconColor,
}) => (
  <div>
    <label className="input-label flex items-center gap-1.5">
      {Icon && <Icon size={12} className={iconColor} />}
      {label}
      {unit && <span className="text-gray-600 font-normal">({unit})</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="input-field"
    />
  </div>
);

const LogVitalsModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState({
    // Blood pressure
    systolic: "",
    diastolic: "",
    pulse: "",
    // Glucose
    glucose: "",
    mealState: "random",
    // Body
    weight: "",
    height: "",
    // Vitals
    heartRate: "",
    oxygenSat: "",
    temperature: "",
    // Misc
    notes: "",
  });

  const set = (field) => (val) => setForm((p) => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {};

    if (form.systolic && form.diastolic) {
      payload.bloodPressure = {
        systolic: parseInt(form.systolic),
        diastolic: parseInt(form.diastolic),
        pulse: form.pulse ? parseInt(form.pulse) : undefined,
      };
    }
    if (form.glucose) {
      payload.glucose = {
        value: parseFloat(form.glucose),
        unit: "mg/dL",
        mealState: form.mealState,
      };
    }
    if (form.weight || form.height) {
      if (form.weight)
        payload.weight = { value: parseFloat(form.weight), unit: "kg" };
      if (form.height)
        payload.height = { value: parseFloat(form.height), unit: "cm" };
    }
    if (form.heartRate || form.oxygenSat || form.temperature) {
      payload.vitals = {};
      if (form.heartRate) payload.vitals.heartRate = parseInt(form.heartRate);
      if (form.oxygenSat)
        payload.vitals.oxygenSaturation = parseFloat(form.oxygenSat);
      if (form.temperature)
        payload.vitals.bodyTemperature = {
          value: parseFloat(form.temperature),
          unit: "celsius",
        };
    }
    if (form.notes) payload.notes = form.notes;

    if (!Object.keys(payload).length) return;

    const result = await onSubmit(payload);
    if (result?.success) {
      setForm({
        systolic: "",
        diastolic: "",
        pulse: "",
        glucose: "",
        mealState: "random",
        weight: "",
        height: "",
        heartRate: "",
        oxygenSat: "",
        temperature: "",
        notes: "",
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-2xl bg-dark-card border border-white/10 rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <Plus size={16} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Log Vitals
                    </p>
                    <p className="text-xs text-gray-500">
                      Fill in what you have — all fields optional
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Blood Pressure */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity size={14} className="text-brand-400" />
                      <p className="text-sm font-medium text-white">
                        Blood Pressure
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <InputField
                        label="Systolic"
                        value={form.systolic}
                        onChange={set("systolic")}
                        placeholder="e.g. 120"
                        min="60"
                        max="300"
                        unit="mmHg"
                      />
                      <InputField
                        label="Diastolic"
                        value={form.diastolic}
                        onChange={set("diastolic")}
                        placeholder="e.g. 80"
                        min="30"
                        max="200"
                        unit="mmHg"
                      />
                      <InputField
                        label="Pulse"
                        value={form.pulse}
                        onChange={set("pulse")}
                        placeholder="e.g. 72"
                        min="30"
                        max="250"
                        unit="bpm"
                      />
                    </div>
                  </div>

                  {/* Glucose */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets size={14} className="text-health-400" />
                      <p className="text-sm font-medium text-white">
                        Blood Glucose
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Glucose Level"
                        value={form.glucose}
                        onChange={set("glucose")}
                        placeholder="e.g. 95"
                        min="20"
                        max="600"
                        unit="mg/dL"
                      />
                      <div>
                        <label className="input-label">Meal State</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {MEAL_STATES.map((ms) => (
                            <button
                              key={ms.value}
                              type="button"
                              onClick={() => set("mealState")(ms.value)}
                              className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-all duration-150 ${
                                form.mealState === ms.value
                                  ? "bg-health-500/20 border-health-500/40 text-health-400"
                                  : "bg-white/3 border-white/8 text-gray-400 hover:border-white/20"
                              }`}
                            >
                              {ms.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Measurements */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Scale size={14} className="text-purple-400" />
                      <p className="text-sm font-medium text-white">
                        Body Measurements
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Weight"
                        value={form.weight}
                        onChange={set("weight")}
                        placeholder="e.g. 70"
                        min="20"
                        max="500"
                        unit="kg"
                      />
                      <InputField
                        label="Height"
                        value={form.height}
                        onChange={set("height")}
                        placeholder="e.g. 170"
                        min="50"
                        max="300"
                        unit="cm"
                      />
                    </div>
                  </div>

                  {/* Other Vitals */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart size={14} className="text-pink-400" />
                      <p className="text-sm font-medium text-white">
                        Other Vitals
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <InputField
                        label="Heart Rate"
                        value={form.heartRate}
                        onChange={set("heartRate")}
                        placeholder="e.g. 72"
                        min="20"
                        max="300"
                        unit="bpm"
                      />
                      <InputField
                        label="SpO₂"
                        value={form.oxygenSat}
                        onChange={set("oxygenSat")}
                        placeholder="e.g. 98"
                        min="50"
                        max="100"
                        unit="%"
                      />
                      <InputField
                        label="Temperature"
                        value={form.temperature}
                        onChange={set("temperature")}
                        placeholder="e.g. 36.6"
                        min="30"
                        max="45"
                        unit="°C"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="input-label">Notes (optional)</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => set("notes")(e.target.value)}
                      placeholder="Any symptoms, context, or observations…"
                      rows={2}
                      maxLength={500}
                      className="input-field resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-dark-200/50">
                  <p className="text-xs text-gray-500">
                    Fill at least one field to log
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-ghost px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={!isLoading ? { scale: 1.02 } : {}}
                      whileTap={!isLoading ? { scale: 0.98 } : {}}
                      className="btn-primary px-6 py-2 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
                          Log Vitals
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LogVitalsModal;
