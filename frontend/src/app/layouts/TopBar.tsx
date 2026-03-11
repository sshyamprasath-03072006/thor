import { useState, useRef, useEffect } from "react";
import { Bell, User, LogOut, ChevronDown, Settings, Zap, Map } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function TopBar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <header
            className="mx-4 mt-6 mb-2 rounded-2xl flex items-center justify-between px-5 flex-shrink-0 relative z-20"
            style={{ height: "64px", background: "var(--thor-surface)", border: "1px solid var(--thor-border)", boxShadow: "var(--thor-shadow-solid)" }}
        >
            {/* Branding */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
                <Zap className="w-5 h-5 text-yellow-500" fill="currentColor" />
                <span className="text-xl font-bold tracking-tight" style={{ color: "var(--thor-text)" }}>THOR</span>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button
                    className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:bg-zinc-800"
                    style={{ color: "var(--thor-text-secondary)" }}
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </button>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 p-1 rounded-xl transition-all hover:bg-zinc-800"
                        style={{ color: "var(--thor-text-secondary)" }}
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                            {user?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showProfile ? "rotate-180" : ""}`} />
                    </button>

                    {showProfile && (
                        <div
                            className="absolute right-0 top-full mt-3 w-56 rounded-xl overflow-hidden z-50 text-sm"
                            style={{ background: "var(--thor-surface-2)", border: "1px solid var(--thor-border)", boxShadow: "0 10px 40px -10px rgba(0,0,0,1)" }}
                        >
                            <div className="px-4 py-3 border-b border-zinc-800">
                                <p className="font-semibold truncate" style={{ color: "var(--thor-text)" }}>{user?.name || "Traveler"}</p>
                                <p className="text-xs text-zinc-500 truncate mt-0.5">{user?.email || ""}</p>
                            </div>
                            <div className="py-1">
                                {[
                                    { icon: User, label: "Profile", action: () => navigate("/profile") },
                                    { icon: Map, label: "Offline Maps", action: () => navigate("/offline-maps") },
                                    { icon: Settings, label: "Settings", action: () => navigate("/settings") },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button key={item.label} onClick={() => { item.action(); setShowProfile(false); }}
                                            className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-all hover:opacity-75"
                                            style={{ color: "var(--thor-text)" }}
                                        >
                                            <Icon className="w-4 h-4" />{item.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="py-1 border-t border-zinc-800">
                                <button onClick={() => { logout(); navigate("/login"); setShowProfile(false); }}
                                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-all text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                >
                                    <LogOut className="w-4 h-4" />Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
