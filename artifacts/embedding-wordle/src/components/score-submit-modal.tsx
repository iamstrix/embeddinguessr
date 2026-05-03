import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@clerk/react";
import { useSubmitLeaderboardScore, useGetStreak } from "@workspace/api-client-react";
import { Trophy, Flame, Star, LogIn, X, Check } from "lucide-react";

interface ScoreSubmitModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  targetWord: string;
  attemptCount: number;
  deviceId: string;
}

export function ScoreSubmitModal({
  open,
  onClose,
  sessionId,
  targetWord,
  attemptCount,
  deviceId,
}: ScoreSubmitModalProps) {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);

  const { data: streak } = useGetStreak(deviceId || "unknown");

  const { mutate: submitScore, isPending } = useSubmitLeaderboardScore();

  // Pre-fill name from Clerk user
  useEffect(() => {
    if (user && isLoaded && !playerName) {
      setPlayerName(user.firstName ?? user.username ?? user.fullName ?? "");
    }
  }, [user, isLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isPending) return;

    submitScore(
      {
        data: {
          sessionId,
          playerName: playerName.trim(),
          clerkUserId: user?.id,
        },
      },
      {
        onSuccess: (entry) => {
          setSubmitted(true);
          setSubmittedRank(entry.rank);
        },
      },
    );
  };

  const handleSignIn = () => {
    openSignIn();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="score-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full sm:max-w-md bg-[#08090f] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-white/8">
              <div className="text-3xl mb-1">🎉</div>
              <h2 className="text-lg font-bold font-mono text-white">You found it!</h2>
              <p className="text-white/50 font-mono text-sm mt-1">
                <span className="text-yellow-400 font-bold">"{targetWord}"</span>
                {" "}in {attemptCount} {attemptCount === 1 ? "guess" : "guesses"}
              </p>
            </div>

            {/* Streak badge */}
            {(streak?.currentStreak ?? 0) > 0 && (
              <div className="flex items-center justify-center gap-2 py-3 border-b border-white/5 bg-orange-500/5">
                <Flame size={16} className="text-orange-400" />
                <span className="font-mono text-sm text-orange-300 font-bold">
                  {streak!.currentStreak}-day streak
                </span>
                {(streak?.longestStreak ?? 0) > 1 && (
                  <span className="text-xs text-white/30 font-mono">
                    · best {streak!.longestStreak}
                  </span>
                )}
              </div>
            )}

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
                    <p className="font-mono font-bold text-white">Score submitted!</p>
                    {submittedRank !== null && (
                      <p className="text-white/50 font-mono text-sm mt-1">
                        You're ranked <span className="text-primary font-bold">#{submittedRank}</span> on today's leaderboard
                      </p>
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
                  <p className="text-xs font-mono text-white/40 text-center uppercase tracking-widest">
                    Add your name to the leaderboard
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.slice(0, 32))}
                        placeholder="Your display name"
                        maxLength={32}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-colors"
                        autoFocus
                      />
                      {user && (
                        <Star size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary opacity-60" />
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!playerName.trim() || isPending}
                      className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed font-mono font-bold text-sm text-primary-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      <Trophy size={15} />
                      {isPending ? "Submitting…" : user ? "Submit (verified)" : "Submit score"}
                    </button>
                  </form>

                  {/* Clerk sign-in prompt */}
                  {!user && isLoaded && (
                    <div className="pt-1">
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-white/8" />
                        <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-white/8" />
                      </div>
                      <button
                        type="button"
                        onClick={handleSignIn}
                        className="w-full py-2.5 rounded-lg border border-white/10 bg-white/3 hover:bg-white/8 font-mono text-sm text-white/60 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <LogIn size={14} />
                        Sign in with Replit / GitHub
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">✓ verified</span>
                      </button>
                      <p className="text-center text-[10px] text-white/25 font-mono mt-2">
                        Verified players get a badge on the leaderboard
                      </p>
                    </div>
                  )}

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
