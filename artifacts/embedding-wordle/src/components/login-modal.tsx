import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Lock, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setPassword("");
      const saved = localStorage.getItem("authUsername");
      if (saved && !username) setUsername(saved);
    }
  }, [open]);

  useEffect(() => {
    setError(null);
  }, [tab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !password) return;
    setError(null);
    setLoading(true);
    try {
      if (tab === "login") {
        await login(trimmed, password);
      } else {
        await register(trimmed, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="login-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-sm bg-[#08090f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-white/8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 text-primary mb-3">
                {tab === "login" ? <LogIn size={22} /> : <UserPlus size={22} />}
              </div>
              <h2 className="text-lg font-bold font-mono text-white">
                {tab === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-white/40 font-mono text-xs mt-1">
                {tab === "login" ? "Log in to submit scores" : "Pick a username and password"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-3 pb-0">
              <button
                onClick={() => setTab("login")}
                className={`flex-1 py-2 rounded-lg font-mono text-sm font-semibold transition-all ${
                  tab === "login" ? "bg-primary/15 text-primary" : "text-white/30 hover:text-white/60"
                }`}
              >
                Log in
              </button>
              <button
                onClick={() => setTab("register")}
                className={`flex-1 py-2 rounded-lg font-mono text-sm font-semibold transition-all ${
                  tab === "register" ? "bg-primary/15 text-primary" : "text-white/30 hover:text-white/60"
                }`}
              >
                Register
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value.slice(0, 24)); setError(null); }}
                    placeholder="Username"
                    maxLength={24}
                    autoComplete="username"
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-3 font-mono text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-colors"
                    autoFocus
                  />
                </div>

                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder={tab === "register" ? "Password (min 6 chars)" : "Password"}
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 py-3 font-mono text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {error && (
                  <p className="text-xs font-mono text-red-400 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!username.trim() || !password || loading}
                  className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed font-mono font-bold text-sm text-primary-foreground transition-colors flex items-center justify-center gap-2"
                >
                  {tab === "login" ? <LogIn size={15} /> : <UserPlus size={15} />}
                  {loading ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
