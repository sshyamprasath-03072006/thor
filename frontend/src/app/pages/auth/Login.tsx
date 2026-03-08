import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Globe, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/TranslationContext";
import { useTheme } from "../../context/ThemeContext";

import { API_URL } from "../../config/api";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { language, setLanguage, supportedLanguages } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { setError("All fields are required"); return; }
        setLoading(true); setError("");

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Login failed");

            login(data.access_token, data.user);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Mobile brand */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
                <Zap className="w-7 h-7" style={{ color: "var(--thor-brand)" }} fill="currentColor" />
                <span className="text-heading" style={{ fontWeight: 900, letterSpacing: "0.15em", background: "linear-gradient(135deg, var(--thor-brand), #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>THOR</span>
            </div>

            <div className="flex justify-between items-start mb-2">
                <h2 className="text-display" style={{ color: "var(--thor-text)" }}>Welcome back</h2>
                <button type="button" onClick={toggleTheme} className="p-2 rounded-xl transition-all bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10" style={{ color: "var(--thor-text-secondary)", border: "1px solid var(--thor-border)" }}>
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
            <p className="text-body mb-8" style={{ color: "var(--thor-text-muted)" }}>Sign in to your account to continue</p>

            {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg mb-6"
                    style={{ background: "var(--thor-danger-muted)", color: "var(--thor-danger)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-caption">{error}</span>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-caption block mb-2" style={{ color: "var(--thor-text-secondary)" }}>Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--thor-text-disabled)" }} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com" className="input" style={{ paddingLeft: "2.5rem" }} />
                    </div>
                </div>

                <div>
                    <label className="text-caption block mb-2" style={{ color: "var(--thor-text-secondary)" }}>Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--thor-text-disabled)" }} />
                        <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password" className="input" style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }} />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--thor-text-disabled)" }}>
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-caption block mb-2" style={{ color: "var(--thor-text-secondary)" }}>Preferred Language</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--thor-text-disabled)" }} />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="input appearance-none bg-black"
                            style={{ paddingLeft: "2.5rem" }}
                        >
                            {supportedLanguages.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit" disabled={loading}
                    className="btn btn-brand btn-lg w-full" style={{ marginTop: "1.5rem" }}>
                    {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Zap className="w-5 h-5" fill="currentColor" />
                        </motion.div>
                    ) : (
                        <>Sign in <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </form>

            <p className="text-body text-center mt-8" style={{ color: "var(--thor-text-muted)" }}>
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold" style={{ color: "var(--thor-brand)" }}>Create account</Link>
            </p>
        </motion.div>
    );
}
