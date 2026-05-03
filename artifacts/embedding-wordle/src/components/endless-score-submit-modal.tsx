import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubmitEndlessScore } from "@workspace/api-client-react";
import { Trophy, Infinity, X, Check, User, Lock, Eye, EyeOff } from "lucide-react";

interface EndlessScoreSubmitModalProps {
  open: boolean;
  onClose: () => void;
  guessCount: number;
  targetWord: string;
}

export function EndlessScoreSubmitModal({
  open,
  onClose,
  guessCount,
  targetWord,
}: EndlessScoreSubmitModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [submittedStats, setSubmittedStats] = useState<{ gamesPlayed: number; avgGuesses: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutate: submitScore, isPending } = useSubmitEndlessScore();

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setSubmittedRank(null);
      setSubmittedStats(null);
      setErrorMsg(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !password || isPending) return;
    setErrorMsg(null);

    submitScore(
      {
        data: { username: trimmed, password, guessCount },
      },
      {
        onSuccess: (entry) => {
          setSubmitted(true);
          setSubmittedRank(entry.rank);
          setSubmittedStats({ gamesPlayed: entry.gamesPlayed, avgGuesses: entry.avgGuesses });
          const saved = JSON.parse(localStorage.getItem("endlessAuth") ?? "{}");
          if (!saved.username) {
            localStorage.setItem("endlessAuth", JSON.stringify({ username: trimmed }));
          }
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Something went wrong. Try again.";
          if (msg.includes("401") || msg.toLowerCase().includes("wrong password")) {
            setErrorMsg("Wrong password for that username. Try again.");
          } else if (msg.includes("400")) {
            setErrorMsg("Username must be 2–24 characters.");
          } else {
            setErrorMsg("Something went wrong. Try again.");
          }
        },
      },
    );
  };

  useEffect(() => {
    if (open) {
      try {
        const saved = JSON.parse(localStorage.getItem("endlessAuth") ?? "{}");
        if (saved.username && !username) setUsername(saved.username);
      } catch {}
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="endless-score-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full sm:max-w-md bg-[#08090f] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
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
                <Infinity size={24} />
              </div>
              <h2 className="text-lg font-bold font-mono text-white">Puzzle Solved!</h2>
              <p className="text-white/50 font-mono text-sm mt-1">
                <span className="text-yellow-400 font-bold">"{targetWord}"</span>
                {" "}in{" "}
                <span className="text-primary font-bold">{guessCount}</span>
                {" "}{guessCount === 1 ? "guess" : "guesses"}
              </p>
            </div>

            <div className="px-6 py-5">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                    <Check size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-white">Score recorded!</p>
                    {submittedRank !== null && (
                      <p className="text-white/50 font-mono text-sm mt-1">
                        You're ranked{" "}
                        <span className="text-primary font-bold">#{submittedRank}</span>{" "}
                        on the endless leaderboard
                      </p>
                    )}
                    {submittedStats && (
                      <div className="flex items-center justify-center gap-4 mt-3 py-3 bg-white/3 rounded-xl border border-white/8">
                        <div className="text-center">
                          <div className="font-mono text-xl font-bold text-white">{submittedStats.gamesPlayed}</div>
                          <div className="text-xs text-white/35 font-mono uppercase tracking-widest">Games</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                          <div className="font-mono text-xl font-bold text-primary">{submittedStats.avgGuesses.toFixed(1)}</div>
                          <div className="text-xs text-white/35 font-mono uppercase tracking-widest">Avg Guesses</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full mt-2 py-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Submit to endless leaderboard</p>
                    <p className="text-xs font-mono text-white/25 mt-1">New here? We'll create your account. Returning? We'll verify your password.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.slice(0, 24));
                          setErrorMsg(null);
                        }}
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
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="Password"
                        autoComplete="current-password"
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

                    {errorMsg && (
                      <p className="text-xs font-mono text-red-400 text-center">{errorMsg}</p>
                    )}

                    <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-primary/5 border border-primary/15">
                      <Trophy size={13} className="text-primary shrink-0" />
                      <p className="text-xs font-mono text-white/50">
                        This adds <span className="text-primary font-bold">{guessCount} guesses</span> to your endless total
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={!username.trim() || !password || isPending}
                      className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed font-mono font-bold text-sm text-primary-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      <Infinity size={15} />
                      {isPending ? "Submitting…" : "Submit score"}
                    </button>
                  </form>

                  <button
                    onClick={onClose}
                    className="w-full py-2 text-xs font-mono text-white/25 hover:text-white/50 transition-colors"
                  >
                    Skip — don't submit
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
