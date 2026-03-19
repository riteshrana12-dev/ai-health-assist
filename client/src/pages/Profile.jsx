import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit3,
  Save,
  X,
  Camera,
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  Lock,
  AlertTriangle,
  Heart,
  Activity,
  Pill,
  Phone,
  Calendar,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { getInitials, capitalize, formatDate } from "../utils/formatters";
import toast from "react-hot-toast";

// ── Constants ─────────────────────────────────────────────────
const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "unknown",
];
const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
const SMOKING_OPTS = ["never", "former", "current", "unknown"];
const ALCOHOL_OPTS = ["none", "occasional", "moderate", "heavy", "unknown"];
const EXERCISE_OPTS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
  "unknown",
];
const COND_STATUSES = ["active", "resolved", "chronic"];

// ── Helpers ───────────────────────────────────────────────────
const Label = ({ children }) => (
  <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
    {children}
  </p>
);

const Value = ({ children, placeholder = "—" }) => (
  <p className="text-sm text-white">{children || placeholder}</p>
);

const Field = ({ label, children }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

const Select = ({ value, onChange, options, disabled }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="input-field appearance-none pr-8 capitalize disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-dark-card capitalize">
          {o.replace(/_/g, " ")}
        </option>
      ))}
    </select>
    {!disabled && (
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    )}
  </div>
);

// ── Section wrapper ───────────────────────────────────────────
const Section = ({
  title,
  icon: Icon,
  iconColor = "text-brand-400",
  children,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="card space-y-5"
  >
    <div className="flex items-center gap-2.5 pb-3 border-b border-white/6">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center bg-white/5`}
      >
        <Icon size={15} className={iconColor} />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
    </div>
    {children}
  </motion.div>
);

// ── Tag pill ──────────────────────────────────────────────────
const Tag = ({ text, color = "brand", onRemove }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
    bg-${color}-500/15 text-${color}-400 border border-${color}-500/20`}
  >
    {text}
    {onRemove && (
      <button
        onClick={() => onRemove(text)}
        className="hover:opacity-60 transition-opacity"
      >
        <X size={10} />
      </button>
    )}
  </span>
);

// ── Tag input ─────────────────────────────────────────────────
const TagInput = ({
  label,
  items = [],
  onAdd,
  onRemove,
  placeholder,
  color = "brand",
}) => {
  const [val, setVal] = useState("");
  const add = () => {
    const trimmed = val.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onAdd(trimmed);
    setVal("");
  };
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
        {items.length > 0 ? (
          items.map((item) => (
            <Tag key={item} text={item} color={color} onRemove={onRemove} />
          ))
        ) : (
          <span className="text-xs text-gray-600">None added</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="input-field flex-1 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </Field>
  );
};

// ─────────────────────────────────────────────────────────────
const Profile = () => {
  const { user: ctxUser, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [user, setUser] = useState(ctxUser);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState({ current: "", newPass: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  // ── Form state (mirrors User schema) ──────────────────────
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    bloodGroup: "unknown",
    heightValue: "",
    weightValue: "",
    allergies: [],
    currentMedications: [],
    medicalHistory: [],
    smokingStatus: "unknown",
    alcoholConsumption: "unknown",
    exerciseFrequency: "unknown",
    sleepHours: "",
    ecName: "",
    ecRelationship: "",
    ecPhone: "",
  });

  // ── Load fresh profile from API ────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingProfile(true);
      try {
        const { data } = await authService.getProfile();
        const u = data.data.user;
        setUser(u);
        syncFormFromUser(u);
      } catch {
        // Fall back to context user
        if (ctxUser) syncFormFromUser(ctxUser);
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, []);

  const syncFormFromUser = (u) => {
    setForm({
      name: u.name || "",
      phone: u.phone || "",
      age: u.age ?? "",
      gender: u.gender || "",
      bloodGroup: u.bloodGroup || "unknown",
      heightValue: u.height?.value ?? "",
      weightValue: u.weight?.value ?? "",
      allergies: u.allergies || [],
      currentMedications: u.currentMedications || [],
      medicalHistory: u.medicalHistory || [],
      smokingStatus: u.lifestyle?.smokingStatus || "unknown",
      alcoholConsumption: u.lifestyle?.alcoholConsumption || "unknown",
      exerciseFrequency: u.lifestyle?.exerciseFrequency || "unknown",
      sleepHours: u.lifestyle?.sleepHours ?? "",
      ecName: u.emergencyContact?.name || "",
      ecRelationship: u.emergencyContact?.relationship || "",
      ecPhone: u.emergencyContact?.phone || "",
    });
  };

  const set = (field) => (val) => setForm((p) => ({ ...p, [field]: val }));

  // ── Save profile ───────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone || undefined,
        age: form.age !== "" ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup,
        height:
          form.heightValue !== ""
            ? { value: Number(form.heightValue), unit: "cm" }
            : undefined,
        weight:
          form.weightValue !== ""
            ? { value: Number(form.weightValue), unit: "kg" }
            : undefined,
        allergies: form.allergies,
        currentMedications: form.currentMedications,
        medicalHistory: form.medicalHistory,
        lifestyle: {
          smokingStatus: form.smokingStatus,
          alcoholConsumption: form.alcoholConsumption,
          exerciseFrequency: form.exerciseFrequency,
          sleepHours:
            form.sleepHours !== "" ? Number(form.sleepHours) : undefined,
        },
        emergencyContact: {
          name: form.ecName,
          relationship: form.ecRelationship,
          phone: form.ecPhone,
        },
      };

      const { data } = await authService.updateProfile(payload);
      const updated = data.data.user;
      setUser(updated);
      updateUser(updated);
      syncFormFromUser(updated);
      setEditing(false);
      toast.success("Profile updated ✅");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel edit ────────────────────────────────────────────
  const handleCancel = () => {
    if (user) syncFormFromUser(user);
    setEditing(false);
  };

  // ── Avatar upload ──────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const { data } = await authService.updateAvatar(fd);
      setUser((p) => ({ ...p, profilePic: data.profilePic }));
      updateUser({ profilePic: data.profilePic });
      toast.success("Avatar updated ✅");
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  };

  // ── Password change ────────────────────────────────────────
  const handlePasswordChange = async () => {
    if (!pw.current || !pw.newPass || !pw.confirm) {
      toast.error("Fill all fields");
      return;
    }
    if (pw.newPass !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (pw.newPass.length < 6) {
      toast.error("Min 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword({
        currentPassword: pw.current,
        newPassword: pw.newPass,
      });
      toast.success("Password changed ✅");
      setShowPwForm(false);
      setPw({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Medical history helpers ────────────────────────────────
  const addCondition = () =>
    set("medicalHistory")([
      ...form.medicalHistory,
      { condition: "", status: "active", notes: "" },
    ]);

  const removeCondition = (i) =>
    set("medicalHistory")(form.medicalHistory.filter((_, idx) => idx !== i));

  const updateCondition = (i, field, val) =>
    set("medicalHistory")(
      form.medicalHistory.map((c, idx) =>
        idx === i ? { ...c, [field]: val } : c,
      ),
    );

  // ── Input class ────────────────────────────────────────────
  const iCls = (extra = "") =>
    `input-field ${!editing ? "opacity-60 cursor-not-allowed bg-white/2" : ""} ${extra}`;

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 skeleton rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5 pb-10">
        {/* ── Avatar + Name header ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-glow-blue">
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-white text-2xl">
                    {getInitials(user?.name)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shadow-lg transition-colors"
              >
                {avatarLoading ? (
                  <Loader2 size={13} className="text-white animate-spin" />
                ) : (
                  <Camera size={13} className="text-white" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold text-white">
                {user?.name}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user?.bloodGroup && user.bloodGroup !== "unknown" && (
                  <span className="badge badge-red">{user.bloodGroup}</span>
                )}
                {user?.age && (
                  <span className="badge badge-blue">{user.age} yrs</span>
                )}
                {user?.gender && (
                  <span className="badge badge-gray capitalize">
                    {user.gender.replace(/_/g, " ")}
                  </span>
                )}
                {user?.height?.value && user?.weight?.value && (
                  <span className="badge badge-purple">
                    BMI{" "}
                    {(
                      user.weight.value / Math.pow(user.height.value / 100, 2)
                    ).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Member since {formatDate(user?.createdAt)}
              </p>
            </div>

            {/* Edit / Save buttons */}
            <div className="flex gap-2 flex-shrink-0 self-start">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="btn-ghost px-3 py-2 text-sm flex items-center gap-1.5"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Save
                      </>
                    )}
                  </motion.button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary px-4 py-2 text-sm flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Personal Information ── */}
        <Section
          title="Personal Information"
          icon={User}
          iconColor="text-brand-400"
          delay={0.05}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              {editing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  className={iCls()}
                  placeholder="Your full name"
                />
              ) : (
                <Value>{form.name}</Value>
              )}
            </Field>

            <Field label="Phone Number">
              {editing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  className={iCls()}
                  placeholder="+91 9876543210"
                />
              ) : (
                <Value>{form.phone}</Value>
              )}
            </Field>

            <Field label="Age">
              {editing ? (
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => set("age")(e.target.value)}
                  className={iCls()}
                  placeholder="28"
                  min="1"
                  max="120"
                />
              ) : (
                <Value>{form.age ? `${form.age} years` : ""}</Value>
              )}
            </Field>

            <Field label="Gender">
              {editing ? (
                <Select
                  value={form.gender || "prefer_not_to_say"}
                  onChange={set("gender")}
                  options={GENDERS}
                />
              ) : (
                <Value>
                  {form.gender
                    ? capitalize(form.gender.replace(/_/g, " "))
                    : ""}
                </Value>
              )}
            </Field>

            <Field label="Height (cm)">
              {editing ? (
                <input
                  type="number"
                  value={form.heightValue}
                  onChange={(e) => set("heightValue")(e.target.value)}
                  className={iCls()}
                  placeholder="170"
                  min="50"
                  max="300"
                />
              ) : (
                <Value>
                  {form.heightValue ? `${form.heightValue} cm` : ""}
                </Value>
              )}
            </Field>

            <Field label="Weight (kg)">
              {editing ? (
                <input
                  type="number"
                  value={form.weightValue}
                  onChange={(e) => set("weightValue")(e.target.value)}
                  className={iCls()}
                  placeholder="65"
                  min="20"
                  max="500"
                />
              ) : (
                <Value>
                  {form.weightValue ? `${form.weightValue} kg` : ""}
                </Value>
              )}
            </Field>
          </div>
        </Section>

        {/* ── Medical Profile ── */}
        <Section
          title="Medical Profile"
          icon={Heart}
          iconColor="text-red-400"
          delay={0.1}
        >
          <Field label="Blood Group">
            {editing ? (
              <Select
                value={form.bloodGroup}
                onChange={set("bloodGroup")}
                options={BLOOD_GROUPS}
              />
            ) : (
              <Value>
                {form.bloodGroup === "unknown" ? "Unknown" : form.bloodGroup}
              </Value>
            )}
          </Field>

          {/* Allergies */}
          {editing ? (
            <TagInput
              label="Allergies"
              items={form.allergies}
              onAdd={(v) => set("allergies")([...form.allergies, v])}
              onRemove={(v) =>
                set("allergies")(form.allergies.filter((a) => a !== v))
              }
              placeholder="e.g. Penicillin, Peanuts"
              color="red"
            />
          ) : (
            <Field label="Allergies">
              <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                {form.allergies.length > 0 ? (
                  form.allergies.map((a) => (
                    <Tag key={a} text={a} color="red" />
                  ))
                ) : (
                  <span className="text-xs text-gray-600">None recorded</span>
                )}
              </div>
            </Field>
          )}

          {/* Current Medications */}
          {editing ? (
            <TagInput
              label="Current Medications (general)"
              items={form.currentMedications}
              onAdd={(v) =>
                set("currentMedications")([...form.currentMedications, v])
              }
              onRemove={(v) =>
                set("currentMedications")(
                  form.currentMedications.filter((m) => m !== v),
                )
              }
              placeholder="e.g. Metformin, Lisinopril"
              color="orange"
            />
          ) : (
            <Field label="Current Medications">
              <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                {form.currentMedications.length > 0 ? (
                  form.currentMedications.map((m) => (
                    <Tag key={m} text={m} color="orange" />
                  ))
                ) : (
                  <span className="text-xs text-gray-600">None recorded</span>
                )}
              </div>
            </Field>
          )}

          {/* Medical History */}
          <Field label="Medical History">
            {editing && (
              <button
                type="button"
                onClick={addCondition}
                className="mb-2 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                <Plus size={13} /> Add condition
              </button>
            )}
            <div className="space-y-2">
              {form.medicalHistory.length === 0 && (
                <p className="text-xs text-gray-600">No conditions recorded</p>
              )}
              {form.medicalHistory.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/6"
                >
                  {editing ? (
                    <>
                      <input
                        type="text"
                        value={c.condition}
                        onChange={(e) =>
                          updateCondition(i, "condition", e.target.value)
                        }
                        placeholder="Condition name"
                        className="input-field flex-1 py-1.5 text-xs"
                      />
                      <select
                        value={c.status}
                        onChange={(e) =>
                          updateCondition(i, "status", e.target.value)
                        }
                        className="input-field w-28 py-1.5 text-xs appearance-none"
                      >
                        {COND_STATUSES.map((s) => (
                          <option
                            key={s}
                            value={s}
                            className="bg-dark-card capitalize"
                          >
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeCondition(i)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm text-white">
                        {c.condition || "—"}
                      </p>
                      <span
                        className={`badge text-[10px] capitalize ${
                          c.status === "active"
                            ? "badge-red"
                            : c.status === "chronic"
                              ? "badge-yellow"
                              : "badge-green"
                        }`}
                      >
                        {c.status}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── Lifestyle ── */}
        <Section
          title="Lifestyle"
          icon={Activity}
          iconColor="text-green-400"
          delay={0.15}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Smoking Status">
              {editing ? (
                <Select
                  value={form.smokingStatus}
                  onChange={set("smokingStatus")}
                  options={SMOKING_OPTS}
                />
              ) : (
                <Value>
                  {capitalize(form.smokingStatus.replace(/_/g, " "))}
                </Value>
              )}
            </Field>

            <Field label="Alcohol Consumption">
              {editing ? (
                <Select
                  value={form.alcoholConsumption}
                  onChange={set("alcoholConsumption")}
                  options={ALCOHOL_OPTS}
                />
              ) : (
                <Value>
                  {capitalize(form.alcoholConsumption.replace(/_/g, " "))}
                </Value>
              )}
            </Field>

            <Field label="Exercise Frequency">
              {editing ? (
                <Select
                  value={form.exerciseFrequency}
                  onChange={set("exerciseFrequency")}
                  options={EXERCISE_OPTS}
                />
              ) : (
                <Value>
                  {capitalize(form.exerciseFrequency.replace(/_/g, " "))}
                </Value>
              )}
            </Field>

            <Field label="Sleep Hours / night">
              {editing ? (
                <input
                  type="number"
                  value={form.sleepHours}
                  onChange={(e) => set("sleepHours")(e.target.value)}
                  className={iCls()}
                  placeholder="7.5"
                  min="0"
                  max="24"
                  step="0.5"
                />
              ) : (
                <Value>{form.sleepHours ? `${form.sleepHours} hrs` : ""}</Value>
              )}
            </Field>
          </div>
        </Section>

        {/* ── Emergency Contact ── */}
        <Section
          title="Emergency Contact"
          icon={AlertTriangle}
          iconColor="text-orange-400"
          delay={0.2}
        >
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                label: "Contact Name",
                field: "ecName",
                placeholder: "Full name",
              },
              {
                label: "Relationship",
                field: "ecRelationship",
                placeholder: "e.g. Spouse",
              },
              {
                label: "Phone Number",
                field: "ecPhone",
                placeholder: "+91 9876543210",
              },
            ].map(({ label, field, placeholder }) => (
              <Field key={field} label={label}>
                {editing ? (
                  <input
                    type="text"
                    value={form[field]}
                    onChange={(e) => set(field)(e.target.value)}
                    className={iCls()}
                    placeholder={placeholder}
                  />
                ) : (
                  <Value>{form[field]}</Value>
                )}
              </Field>
            ))}
          </div>
        </Section>

        {/* ── Security ── */}
        <Section
          title="Security"
          icon={Lock}
          iconColor="text-purple-400"
          delay={0.25}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Password</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Change your account password
              </p>
            </div>
            <button
              onClick={() => setShowPwForm((p) => !p)}
              className="btn-secondary px-4 py-2 text-sm"
            >
              {showPwForm ? "Cancel" : "Change Password"}
            </button>
          </div>

          <AnimatePresence>
            {showPwForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/6 space-y-3">
                  {[
                    {
                      label: "Current Password",
                      key: "current",
                      placeholder: "Your current password",
                    },
                    {
                      label: "New Password",
                      key: "newPass",
                      placeholder: "Min 6 characters",
                    },
                    {
                      label: "Confirm Password",
                      key: "confirm",
                      placeholder: "Repeat new password",
                    },
                  ].map(({ label, key, placeholder }) => (
                    <Field key={key} label={label}>
                      <input
                        type="password"
                        value={pw[key]}
                        onChange={(e) =>
                          setPw((p) => ({ ...p, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        className="input-field"
                      />
                    </Field>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePasswordChange}
                    disabled={pwLoading}
                    className="btn-primary w-full py-2.5"
                  >
                    {pwLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Updating…
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Update Password
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* ── Account Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Account Info
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <Label>Account ID</Label>
              <p className="text-xs text-gray-500 font-mono truncate">
                {user?._id || user?.id}
              </p>
            </div>
            <div>
              <Label>Member Since</Label>
              <Value>{formatDate(user?.createdAt)}</Value>
            </div>
            <div>
              <Label>Last Login</Label>
              <Value>{formatDate(user?.lastLogin)}</Value>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
