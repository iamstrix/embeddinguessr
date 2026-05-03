import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSubmitLeaderboardScore, useGetStreak } from "@workspace/api-client-react";
import { Trophy, Flame, X, Check, LogIn } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";

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
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [submitted, setSubmitted] = useState(false);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);

  const { data: streak } = useGetStreak(deviceId || "unknown");
  const { mutate: submitScore, isPending } = useSubmitLeaderboardScore();

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Player";

  const handleSubmit = () => {
    if (!isSignedIn || isPending) return;

    submitScore(
      { data: { sessionId, playerName: displayName } },
      {
        onSuccess: (entry) => {
          setSubmitted(true);
          setSubmittedRank(entry.rank);
        },
      },
    );
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
              ) : !isSignedIn ? (
                /* Not signed in */
                <div className="space-y-4 text-center">
                  <p className="text-white/50 font-mono text-sm leading-relaxed">
                    Sign in to submit your score to today's leaderboard.
                  </p>
                  <button
                    onClick={() => { onClose(); openSignIn(); }}
                    className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 font-mono font-bold text-sm text-primary-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn size={15} />
                    Sign in to submit
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-xs font-mono text-white/25 hover:text-white/50 transition-colors"
                  >
                    Skip — don't submit
                  </button>
                </div>
              ) : (
                /* Signed in — one-click submit */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-primary/5 border border-primary/15">
                    <Trophy size={16} className="text-primary shrink-0" />
                    <div className="text-left">
                      <p className="font-mono text-sm text-white/60">Submitting as</p>
                      <p className="font-mono text-sm font-bold text-white">{displayName}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed font-mono font-bold text-sm text-primary-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    <Trophy size={15} />
                    {isPending ? "Submitting…" : "Submit to leaderboard"}
                  </button>

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
