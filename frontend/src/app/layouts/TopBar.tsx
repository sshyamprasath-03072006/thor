import { useState, useRef, useEffect } from "react";
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MapPin,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface Notification {
  id: string;
  type: "hazard" | "safety" | "update";
  title: string;
  description: string;
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

// Mock active notifications
const ACTIVE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "hazard",
    title: "Heavy Rainfall Alert",
    description: "Nilgiris district - avoid trekking routes",
    timestamp: new Date(Date.now() - 30 * 60000), // 30 mins ago
    severity: "high",
  },
  {
    id: "2",
    type: "safety",
    title: "Safety Pulse Check-In",
    description: "Your 30-min auto-check-in is ready",
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    severity: "medium",
  },
  {
    id: "3",
    type: "update",
    title: "New Safe Zone Added",
    description: "Ooty botanical garden area now has expanded safe zones",
    timestamp: new Date(Date.now() - 5 * 60 * 60000), // 5 hours ago
    severity: "low",
  },
];

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(ACTIVE_NOTIFICATIONS);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "hazard":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "safety":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "update":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationBg = (severity: string) => {
    const isDark = theme === "dark";
    switch (severity) {
      case "high":
        return isDark
          ? "bg-red-500/10 border-red-500/20"
          : "bg-red-50 border-red-200";
      case "medium":
        return isDark
          ? "bg-orange-500/10 border-orange-500/20"
          : "bg-orange-50 border-orange-200";
      case "low":
      default:
        return isDark
          ? "bg-blue-500/10 border-blue-500/20"
          : "bg-blue-50 border-blue-200";
    }
  };

  return (
    <header
      className="mx-4 mt-4 mb-3 rounded-16 flex items-center justify-between px-6 flex-shrink-0 relative z-20 backdrop-blur-sm"
      style={{
        height: "70px",
        background: "var(--thor-surface)",
        border: "1px solid var(--thor-border)",
        boxShadow: "var(--thor-shadow)",
      }}
    >
      {/* Branding */}
      <div
        className="flex items-center gap-3 cursor-pointer group/brand transition-all"
        onClick={() => navigate("/dashboard")}
      >
        <div
          className="p-2.5 rounded-lg transition-all group-hover/brand:shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, var(--thor-brand) 0%, var(--thor-brand-dark) 100%)",
          }}
        >
          <Zap className="w-5 h-5 text-black" fill="currentColor" />
        </div>
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--thor-text)" }}
        >
          THOR
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all"
            style={{
              color: "var(--thor-text-secondary)",
              backgroundColor: showNotifications
                ? "var(--thor-surface-2)"
                : "transparent",
            }}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-3 w-96 rounded-16 overflow-hidden z-50 border backdrop-blur-lg"
              style={{
                background: "var(--thor-surface-2)",
                border: "1px solid var(--thor-border)",
                boxShadow: "var(--thor-shadow-xl)",
              }}
            >
              {/* Header */}
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "var(--thor-border)" }}
              >
                <p
                  className="font-semibold"
                  style={{ color: "var(--thor-text)" }}
                >
                  Active Notifications{" "}
                  {notifications.length > 0 && `(${notifications.length})`}
                </p>
              </div>

              {/* Notifications List */}
              {notifications.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b transition-colors flex gap-3 ${getNotificationBg(notif.severity)}`}
                      style={{ borderColor: "var(--thor-border)" }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "var(--thor-text)" }}
                        >
                          {notif.title}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--thor-text-muted)" }}
                        >
                          {notif.description}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--thor-text-muted)" }}
                        >
                          {Math.floor(
                            (Date.now() - notif.timestamp.getTime()) / 60000,
                          )}{" "}
                          mins ago
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-black/20"
                        style={{ color: "var(--thor-text-muted)" }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p style={{ color: "var(--thor-text-muted)" }}>
                    No active notifications
                  </p>
                </div>
              )}

              {/* Footer */}
              {notifications.length > 0 && (
                <div
                  className="px-4 py-2 border-t"
                  style={{ borderColor: "var(--thor-border)" }}
                >
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setShowNotifications(false);
                    }}
                    className="w-full text-sm py-1.5 rounded transition-colors"
                    style={{
                      color: "var(--thor-info)",
                      backgroundColor: "var(--thor-info)" + "15",
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1 rounded-xl transition-all"
            style={{
              color: "var(--thor-text-secondary)",
              backgroundColor: showProfile
                ? "var(--thor-surface-2)"
                : "transparent",
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
              {user?.name?.charAt(0)?.toUpperCase() || "T"}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showProfile ? "rotate-180" : ""}`}
            />
          </button>

          {showProfile && (
            <div
              className="absolute right-0 top-full mt-3 w-56 rounded-xl overflow-hidden z-50 text-sm"
              style={{
                background: "var(--thor-surface-2)",
                border: "1px solid var(--thor-border)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,1)",
              }}
            >
              <div className="px-4 py-3 border-b border-zinc-800">
                <p
                  className="font-semibold truncate"
                  style={{ color: "var(--thor-text)" }}
                >
                  {user?.name || "Traveler"}
                </p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {user?.email || ""}
                </p>
              </div>
              <div className="py-1">
                {[
                  {
                    icon: User,
                    label: "Profile",
                    action: () => navigate("/profile"),
                  },
                  {
                    icon: Settings,
                    label: "Settings",
                    action: () => navigate("/settings"),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setShowProfile(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-all hover:opacity-75"
                      style={{ color: "var(--thor-text)" }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="py-1 border-t border-zinc-800">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                    setShowProfile(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-all text-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
