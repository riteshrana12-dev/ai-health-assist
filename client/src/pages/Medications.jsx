import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pill,
  Clock,
  CheckCircle,
  X,
  Edit3,
  Trash2,
  ChevronDown,
  Loader2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Save,
  Calendar,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import { medicationService } from "../services/medicationService";
import { capitalize, formatDate } from "../utils/formatters";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────
const FREQUENCIES = [
  "once_daily",
  "twice_daily",
  "three_times_daily",
  "four_times_daily",
  "every_other_day",
  "weekly",
  "as_needed",
];
const CATEGORIES = [
  "antibiotic",
  "antihypertensive",
  "antidiabetic",
  "analgesic",
  "antihistamine",
  "vitamin_supplement",
  "cardiac",
  "respiratory",
  "gastrointestinal",
  "hormonal",
  "other",
];
const DOSAGE_UNITS = [
  "mg",
  "mcg",
  "g",
  "ml",
  "IU",
  "tablet",
  "capsule",
  "drop",
  "puff",
];
const DOSAGE_FORMS = [
  "tablet",
  "capsule",
  "liquid",
  "injection",
  "patch",
  "inhaler",
  "drops",
  "cream",
  "other",
];
const MEAL_OPTS = [
  "no_restriction",
  "before_meal",
  "with_meal",
  "after_meal",
  "empty_stomach",
];
const MED_COLORS = [
  "#3B82F6",
  "#22C55E",
  "#7C3AED",
  "#EF4444",
  "#F97316",
  "#06B6D4",
  "#EC4899",
  "#EAB308",
];

// ── Small helpers ─────────────────────────────────────────────
const Label = ({ children }) => (
  <p className="text-xs font-medium text-gray-400 mb-1.5">{children}</p>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    {label && <Label>{label}</Label>}
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field appearance-none pr-8 capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-dark-card capitalize">
            {o.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  </div>
);

// ── Add / Edit Modal ──────────────────────────────────────────
const MedModal = ({ med, onClose, onSaved }) => {
  const isEdit = !!med?._id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: med?.name || "",
    genericName: med?.genericName || "",
    category: med?.category || "other",
    purpose: med?.purpose || "",
    color: med?.color || "#3B82F6",
    dosageAmount: med?.dosage?.amount || "",
    dosageUnit: med?.dosage?.unit || "mg",
    dosageForm: med?.dosage?.form || "tablet",
    frequency: med?.schedule?.frequency || "once_daily",
    times: med?.schedule?.times?.map((t) => t.time).join(", ") || "08:00",
    withMeal: med?.schedule?.withMeal || "no_restriction",
    startDate: med?.startDate
      ? new Date(med.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    endDate: med?.endDate
      ? new Date(med.endDate).toISOString().split("T")[0]
      : "",
    isOngoing: med?.isOngoing ?? false,
    prescribedBy: med?.prescribedBy || "",
    notes: med?.notes || "",
  });

  const set = (f) => (v) => setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Medication name is required");
      return;
    }
    if (!form.dosageAmount) {
      toast.error("Dosage amount is required");
      return;
    }

    setSaving(true);
    try {
      const timeArr = form.times
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => ({ time: t }));

      const payload = {
        name: form.name.trim(),
        genericName: form.genericName || undefined,
        category: form.category,
        purpose: form.purpose || undefined,
        color: form.color,
        dosage: {
          amount: parseFloat(form.dosageAmount),
          unit: form.dosageUnit,
          form: form.dosageForm,
        },
        schedule: {
          frequency: form.frequency,
          times: timeArr,
          withMeal: form.withMeal,
        },
        startDate: form.startDate,
        endDate: form.isOngoing ? undefined : form.endDate || undefined,
        isOngoing: form.isOngoing,
        prescribedBy: form.prescribedBy || undefined,
        notes: form.notes || undefined,
      };

      if (isEdit) {
        const { data } = await medicationService.update(med._id, payload);
        onSaved(data.data.medication, "update");
        toast.success("Medication updated ✅");
      } else {
        const { data } = await medicationService.add(payload);
        onSaved(data.data.medication, "add");
        toast.success("Medication added ✅");
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save medication");
    } finally {
      setSaving(false);
    }
  };

  return (
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
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-dark-card border border-white/10 rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                <Pill size={16} className="text-brand-400" />
              </div>
              <p className="text-sm font-semibold text-white">
                {isEdit ? "Edit Medication" : "Add New Medication"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Name + Color */}
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Label>Medication Name *</Label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="e.g. Metformin"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div className="flex-shrink-0">
                <Label>Colour</Label>
                <div className="flex gap-1.5 flex-wrap mt-0.5">
                  {MED_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("color")(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        form.color === c
                          ? "scale-125 border-white/60"
                          : "border-transparent hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Category + Purpose */}
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField
                label="Category"
                value={form.category}
                onChange={set("category")}
                options={CATEGORIES}
              />
              <div>
                <Label>Purpose / Indication</Label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={(e) => set("purpose")(e.target.value)}
                  placeholder="e.g. Blood sugar control"
                  className="input-field"
                />
              </div>
            </div>

            {/* Dosage */}
            <div>
              <Label>Dosage *</Label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  value={form.dosageAmount}
                  onChange={(e) => set("dosageAmount")(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  className="input-field"
                />
                <SelectField
                  value={form.dosageUnit}
                  onChange={set("dosageUnit")}
                  options={DOSAGE_UNITS}
                />
                <SelectField
                  value={form.dosageForm}
                  onChange={set("dosageForm")}
                  options={DOSAGE_FORMS}
                />
              </div>
            </div>

            {/* Schedule */}
            <div>
              <Label>Schedule</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <SelectField
                  value={form.frequency}
                  onChange={set("frequency")}
                  options={FREQUENCIES}
                />
                <div>
                  <input
                    type="text"
                    value={form.times}
                    onChange={(e) => set("times")(e.target.value)}
                    placeholder="Times e.g. 08:00, 14:00, 20:00"
                    className="input-field"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">
                    Comma-separated 24h times
                  </p>
                </div>
              </div>
            </div>

            {/* Meal timing */}
            <SelectField
              label="With Meal"
              value={form.withMeal}
              onChange={set("withMeal")}
              options={MEAL_OPTS}
            />

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate")(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>End Date</Label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isOngoing}
                      onChange={(e) => set("isOngoing")(e.target.checked)}
                      className="w-3 h-3 accent-brand-500"
                    />
                    Ongoing
                  </label>
                </div>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate")(e.target.value)}
                  disabled={form.isOngoing}
                  className="input-field disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Extra fields */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Prescribed By</Label>
                <input
                  type="text"
                  value={form.prescribedBy}
                  onChange={(e) => set("prescribedBy")(e.target.value)}
                  placeholder="Doctor name"
                  className="input-field"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="Special instructions"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5 bg-dark-200/40">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-6 py-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> {isEdit ? "Update" : "Add Medication"}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ── Medication Card ───────────────────────────────────────────
const MedCard = ({ med, index, onEdit, onDelete, onToggle, onLogDose }) => {
  const [logging, setLogging] = useState(null); // 'taken'|'missed'|'skipped'|null
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLog = async (status) => {
    setLogging(status);
    await onLogDose(med._id, { status, scheduledTime: new Date() });
    setLogging(null);
  };

  const times = med.schedule?.times || [];
  const nextTime = times[0]?.time || null;

  const adherence = med.adherenceRate ?? 100;
  const adherenceColor =
    adherence >= 80 ? "#22C55E" : adherence >= 50 ? "#EAB308" : "#EF4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`card group relative ${!med.isActive ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${med.color || "#3B82F6"}20`,
            border: `1.5px solid ${med.color || "#3B82F6"}35`,
          }}
        >
          <Pill size={18} style={{ color: med.color || "#3B82F6" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {med.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {med.dosage?.amount}
            {med.dosage?.unit}
            {med.dosage?.form ? ` · ${capitalize(med.dosage.form)}` : ""}
            {med.category && med.category !== "other"
              ? ` · ${capitalize(med.category)}`
              : ""}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(med)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
            title="Edit"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => onDelete(med._id)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Active toggle — always visible */}
        <button
          onClick={() => onToggle(med._id, !med.isActive)}
          className="flex-shrink-0 p-1"
        >
          {med.isActive ? (
            <ToggleRight size={22} style={{ color: med.color || "#3B82F6" }} />
          ) : (
            <ToggleLeft size={22} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Schedule row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {nextTime && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} /> {nextTime}
          </span>
        )}
        <span className="text-xs text-gray-500 capitalize">
          {med.schedule?.frequency?.replace(/_/g, " ")}
        </span>
        {med.purpose && (
          <span className="text-xs text-gray-600 truncate max-w-[130px]">
            {med.purpose}
          </span>
        )}
        {med.isOngoing && (
          <span className="badge badge-green text-[10px]">Ongoing</span>
        )}
        {med.endDate && !med.isOngoing && (
          <span className="text-[10px] text-gray-600">
            Until {formatDate(med.endDate)}
          </span>
        )}
      </div>

      {/* Adherence bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>Adherence</span>
          <span style={{ color: adherenceColor }}>{adherence}%</span>
        </div>
        <div className="h-1 bg-white/6 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${adherence}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: adherenceColor }}
          />
        </div>
      </div>

      {/* Dose log buttons — only for active meds */}
      {med.isActive && (
        <div className="flex gap-2 pt-3 border-t border-white/5">
          {[
            {
              status: "taken",
              label: "Taken",
              icon: CheckCircle,
              cls: "bg-health-500/10 border-health-500/20 text-health-400 hover:bg-health-500/20",
            },
            {
              status: "missed",
              label: "Missed",
              icon: X,
              cls: "bg-white/4 border-white/8 text-gray-400 hover:bg-white/8",
            },
            {
              status: "skipped",
              label: "Skip",
              icon: AlertCircle,
              cls: "bg-white/4 border-white/8 text-gray-400 hover:bg-white/8",
            },
          ].map(({ status, label, icon: Icon, cls }) => (
            <button
              key={status}
              onClick={() => handleLog(status)}
              disabled={!!logging}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-colors ${cls}`}
            >
              {logging === status ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Icon size={12} />
              )}
              {label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
const Medications = () => {
  const [meds, setMeds] = useState([]);
  const [todayMeds, setTodayMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch medications and today schedule in parallel
      const [medsRes, todayRes] = await Promise.allSettled([
        medicationService.getAll(),
        medicationService.getToday(),
      ]);

      if (!mountedRef.current) return;

      if (medsRes.status === "fulfilled") {
        setMeds(medsRes.value.data.data.medications || []);
      } else {
        console.error("Medications fetch failed:", medsRes.reason);
        setError(
          medsRes.reason?.response?.data?.message ||
            "Failed to load medications",
        );
      }

      if (todayRes.status === "fulfilled") {
        setTodayMeds(todayRes.value.data.data.schedule || []);
      }
      // today failing silently is fine
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.message || "Failed to load medications");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // ── CRUD handlers ─────────────────────────────────────────
  const handleSaved = (med, type) => {
    if (type === "add") setMeds((p) => [med, ...p]);
    if (type === "update")
      setMeds((p) => p.map((m) => (m._id === med._id ? med : m)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await medicationService.delete(id);
      setMeds((p) => p.filter((m) => m._id !== id));
      toast.success("Medication deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      const { data } = await medicationService.update(id, { isActive });
      setMeds((p) =>
        p.map((m) =>
          m._id === id ? { ...m, isActive: data.data.medication.isActive } : m,
        ),
      );
      toast.success(isActive ? "Medication activated" : "Medication paused");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleLogDose = async (id, payload) => {
    try {
      await medicationService.logDose(id, payload);
      toast.success(`Dose marked as ${payload.status}`);
    } catch {
      toast.error("Failed to log dose");
    }
  };

  // ── Filtered list ─────────────────────────────────────────
  const filtered = meds.filter((m) => {
    if (filter === "active") return m.isActive;
    if (filter === "inactive") return !m.isActive;
    return true;
  });

  const activeCnt = meds.filter((m) => m.isActive).length;
  const inactiveCnt = meds.filter((m) => !m.isActive).length;
  const avgAdherence =
    activeCnt > 0
      ? Math.round(
          meds
            .filter((m) => m.isActive)
            .reduce((s, m) => s + (m.adherenceRate ?? 100), 0) / activeCnt,
        )
      : null;

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-5 pb-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 skeleton rounded-lg" />
            <div className="h-9 w-36 skeleton rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-xl" />
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-80 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">
              Failed to load medications
            </p>
            <p className="text-xs text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => loadAll()}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-6 max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Medications
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeCnt} active · {inactiveCnt} inactive
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAll(true)}
              disabled={refreshing}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setEditingMed(null);
                setShowModal(true);
              }}
              className="btn-primary px-4 py-2 text-sm"
            >
              <Plus size={15} /> Add Medication
            </motion.button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Active Medications",
              value: activeCnt,
              color: "text-health-400",
            },
            {
              label: "Avg Adherence",
              value: avgAdherence !== null ? `${avgAdherence}%` : "—",
              color: avgAdherence >= 80 ? "text-health-400" : "text-yellow-400",
            },
            {
              label: "Due Today",
              value: todayMeds.length,
              color: "text-brand-400",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="metric-card p-4 text-center">
              <p className={`font-display text-2xl font-bold ${color}`}>
                {value ?? "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Today's schedule ── */}
        {todayMeds.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-brand-400" />
              <p className="text-sm font-semibold text-white">
                Today's Schedule
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {todayMeds.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color || "#3B82F6" }}
                  />
                  <p className="flex-1 text-sm text-white">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.dosage}</p>
                  <p
                    className={`text-xs font-mono font-medium ${s.isPast ? "text-gray-600 line-through" : "text-brand-400"}`}
                  >
                    {s.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className="flex gap-1.5">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium capitalize transition-all duration-150 ${
                filter === f
                  ? "bg-brand-500/20 border border-brand-500/30 text-brand-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {f}
              {f === "active" && activeCnt > 0 && (
                <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                  {activeCnt}
                </span>
              )}
              {f === "inactive" && inactiveCnt > 0 && (
                <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                  {inactiveCnt}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Medications grid ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
              <Pill size={26} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">
                {meds.length === 0
                  ? "No medications added yet"
                  : filter === "active"
                    ? "No active medications"
                    : "No inactive medications"}
              </p>
              <p className="text-xs text-gray-600 mb-4">
                {meds.length === 0
                  ? "Add your first medication to start tracking doses and adherence"
                  : 'Switch to "All" to see all medications'}
              </p>
              {meds.length === 0 && (
                <button
                  onClick={() => {
                    setEditingMed(null);
                    setShowModal(true);
                  }}
                  className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Add your first medication
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((med, i) => (
              <MedCard
                key={med._id}
                med={med}
                index={i}
                onEdit={(m) => {
                  setEditingMed(m);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onLogDose={handleLogDose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <MedModal
            med={editingMed}
            onClose={() => {
              setShowModal(false);
              setEditingMed(null);
            }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Medications;
