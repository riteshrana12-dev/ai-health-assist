import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquareHeart,
  FileUp,
  BarChart3,
  User,
  BookOpen,
  Pill,
  X,
  Heart,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/formatters";

const NAV_ITEMS = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-brand-400",
  },
  {
    path: "/chat",
    label: "AI Assistant",
    icon: MessageSquareHeart,
    color: "text-purple-400",
  },
  { path: "/reports", label: "Reports", icon: FileUp, color: "text-cyan-400" },
  {
    path: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "text-health-400",
  },
  {
    path: "/medications",
    label: "Medications",
    icon: Pill,
    color: "text-orange-400",
  },
  {
    path: "/education",
    label: "Health Learn",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  { path: "/profile", label: "Profile", icon: User, color: "text-pink-400" },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-blue">
            <Heart size={18} className="text-white" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-semibold text-white text-sm leading-tight">
              AI Health
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">Assist</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Nav Items ──────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon, color }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                font-medium text-sm transition-all duration-200 group
                ${
                  isActive
                    ? "bg-white/8 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-500 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors ${isActive ? color : "text-gray-500 group-hover:text-gray-300"}`}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight size={14} className={`${color} opacity-70`} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User Card ──────────────────────────────────── */}
      <div className="px-3 pb-4 border-t border-white/5 pt-4">
        <NavLink
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <div
            className="w-2 h-2 rounded-full bg-health-500 flex-shrink-0"
            title="Online"
          />
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-dark-card border-r border-white/5 fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-dark-card border-r border-white/5 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
