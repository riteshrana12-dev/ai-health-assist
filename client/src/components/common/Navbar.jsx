import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, Bell, LogOut, Sun, Moon, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getInitials } from "../../utils/formatters";

const PAGE_TITLES = {
  "/dashboard": { title: "Dashboard", subtitle: "Your health overview" },
  "/chat": { title: "AI Assistant", subtitle: "Chat with HealthBot" },
  "/reports": {
    title: "Medical Reports",
    subtitle: "Upload & analyze reports",
  },
  "/analytics": { title: "Analytics", subtitle: "Health trends & insights" },
  "/medications": { title: "Medications", subtitle: "Track your medications" },
  "/education": { title: "Health Learn", subtitle: "Understand your health" },
  "/profile": { title: "Profile", subtitle: "Manage your health profile" },
};

const Navbar = ({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const page = PAGE_TITLES[location.pathname] || {
    title: "AI Health Assist",
    subtitle: "",
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="h-16 bg-dark-card/80 backdrop-blur-md border-b border-white/5 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-semibold text-white text-base leading-tight truncate">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="text-xs text-gray-500 leading-tight hidden sm:block">
            {page.subtitle}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotif((p) => !p)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-colors relative"
          >
            <Bell size={18} />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-500" />
          </motion.button>

          {showNotif && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotif(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-full mt-2 w-72 bg-dark-100 border border-white/8 rounded-2xl shadow-card overflow-hidden z-40"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white">
                    Notifications
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    {
                      icon: "💊",
                      text: "Medication reminder: Metformin 500mg",
                      time: "2m ago",
                      color: "bg-orange-500/10",
                    },
                    {
                      icon: "📊",
                      text: "Weekly health report is ready",
                      time: "1h ago",
                      color: "bg-brand-500/10",
                    },
                    {
                      icon: "🤖",
                      text: "AI analysis complete for your report",
                      time: "3h ago",
                      color: "bg-purple-500/10",
                    },
                  ].map((n, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-2.5 rounded-xl ${n.color} cursor-pointer hover:bg-white/5 transition-colors`}
                    >
                      <span className="text-base flex-shrink-0">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-200 leading-relaxed">
                          {n.text}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {n.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* User avatar / menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((p) => !p)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/8 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 top-full mt-2 w-48 bg-dark-100 border border-white/8 rounded-2xl shadow-card overflow-hidden z-40"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
