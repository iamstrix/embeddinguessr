import { useState, useEffect, useCallback, useMemo } from "react";
import { useGetDailyPuzzle, useCreateSession, useSubmitSessionGuess } from "@workspace/api-client-react";
import { getDeviceId } from "@/lib/device";
import { Scene } from "@/components/scene";
import type { HintWord, HintPhase, BhPhase, BhRevealedWord } from "@/components/scene";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Send, Sun } from "lucide-react";
import { Link } from "wouter";

const TEMP_COLORS: Record<string, string> = {
  correct: "bg-yellow-400",
  hot: "bg-orange-500",
  warm: "bg-amber-500",
  cool: "bg-teal-400",
  cold: "bg-blue-500",
  freezing: "bg-cyan-200",
};

const BH_THRESHOLD = 1.5;

function BhIcon() {
  return (
    <svg width="14" height="14" viewBox="-10 -10 20 20" fill="none">
      <ellipse rx="9" ry="3.5" stroke="#a855f7" strokeWidth="1.2" opacity="0.85" />
      <ellipse rx="6.5" ry="2.5" stroke="#7c3aed" strokeWidth="0.8" opacity="0.55" transform="rotate(60)" />
      <circle r="3.5" fill="#0d0018" stroke="#4c1d95" strokeWidth="0.6" />
    </svg>
  );
}

export default function Home() {
  const [deviceId, setDeviceId] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [hintPhase, setHintPhase] = useState<HintPhase>("idle");
  const [hintWords, setHintWords] = useState<HintWord[]>([]);
  const [bhPhase, setBhPhase] = useState<BhPhase>("idle");
  const [bhRevealedWord, setBhRevealedWord] = useState<BhRevealedWord | null>(null);

  useEffect(() => { setDeviceId(getDeviceId()); }, []);

  const { data: puzzle, isLoading: isLoadingPuzzle } = useGetDailyPuzzle({
    query: {
      refetchInterval: (data) => {
        if (data?.modelReady === false) return 3000;
        return false;
      }
    }
  });

  const { data: session, mutate: createSession, isPending: isCreatingSession } = useCreateSession();

  useEffect(() => {
    if (deviceId && puzzle && puzzle.modelReady && !session && !isCreatingSession) {
      createSession({ data: { deviceId, puzzleId: puzzle.id } });
    }
  }, [deviceId, puzzle, session, createSession, isCreatingSession]);

  const { mutate: submitGuess, isPending: isSubmitting } = useSubmitSessionGuess();

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || !session || !puzzle || isSubmitting) return;
    submitGuess(
      { sessionId: session.id, data: { word: guessInput.trim().toLowerCase(), puzzleId: puzzle.id } },
      { onSuccess: () => setGuessInput("") }
    );
  };

  const triggerHint = useCallback(async () => {
    if (!puzzle || !session || hintPhase !== "idle") return;
    setHintPhase("loading");
    try {
      const excludeWords = (session.guesses ?? []).map((g) => g.word);
      const res = await fetch("/api/game/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId: puzzle.id, excludeWords }),
      });
      const data = await res.json();
      setHintWords(data.hints ?? []);
      setHintPhase("shooting");
      setTimeout(() => setHintPhase("pulsing"), 1500);
      setTimeout(() => setHintPhase("revealed"), 2350);
    } catch {
      setHintPhase("idle");
    }
  }, [puzzle, session, hintPhase]);

  const bhEnergy = useMemo(() => {
    const total = (session?.guesses ?? []).reduce((sum, g) => sum + g.similarityScore, 0);
    return Math.min(1, total / BH_THRESHOLD);
  }, [session?.guesses]);

  const bhReady = bhEnergy >= 1;

  const triggerBlackHole = useCallback(async () => {
    if (!bhReady || bhPhase !== "idle" || !puzzle || !session) return;
    setBhPhase("shooting");
    fetch("/api/game/black-hole", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId: puzzle.id }),
    })
      .then((r) => r.json())
      .then((data) => setBhRevealedWord(data))
      .catch(() => {});

    setTimeout(() => setBhPhase("pulling"), 1400);
    setTimeout(() => setBhPhase("exploding"), 2900);
    setTimeout(() => setBhPhase("revealed"), 3600);
  }, [bhReady, bhPhase, puzzle, session, hintWords]);

  const isLoading = isLoadingPuzzle || !puzzle;
  const modelReady = puzzle?.modelReady ?? false;
  const isSolved = session?.solved ?? false;
  const sortedGuesses = session?.guesses
    ? [...session.guesses].sort((a, b) => a.distanceToTarget - b.distanceToTarget)
    : [];

  return (
    <Layout>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <Scene
            clues={puzzle?.clues ?? []}
            target={puzzle?.target ?? null}
            guesses={session?.guesses ?? []}
            solved={isSolved}
            modelReady={modelReady}
            hintWords={hintWords}
            hintPhase={hintPhase}
            bhPhase={bhPhase}
            bhEnergy={bhEnergy}
            bhRevealedWord={bhRevealedWord}
          />
        </div>

        {modelReady && session && (
          <div className="absolute inset-y-0 left-0 w-full md:w-96 z-10 flex flex-col pointer-events-none p-4 md:p-8">
            <div className="pointer-events-auto w-full max-w-sm mx-auto md:mx-0 flex flex-col h-full gap-4">

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl shrink-0"
              >
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2 font-mono">EMBEDDING WORDLE</h1>
                <p className="text-sm text-white/60 mb-6">Find the target word based on semantic distance in 3D space.</p>

                {isSolved ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-2">
                      <Trophy size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Puzzle Solved!</h2>
                    <p className="text-white/70">You found <span className="font-bold text-primary">"{session.guesses.find(g => g.isCorrect)?.word ?? "?"}"</span> in {session.attemptCount} guesses.</p>
                    <Link href="/leaderboard" className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
                      <Trophy size={16} /> View Leaderboard
                    </Link>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleGuess} className="flex gap-2">
                      <Input
                        placeholder="Type a word..."
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        className="bg-black/50 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-primary"
                        disabled={isSubmitting}
                        autoFocus
                      />
                      <Button type="submit" size="icon" disabled={isSubmitting || !guessInput.trim()} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Send size={18} />
                      </Button>
                    </form>

                    {/* Solar Hint */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={triggerHint}
                      disabled={hintPhase !== "idle"}
                      className="mt-2 w-full gap-2 border border-yellow-500/25 text-yellow-400/70 hover:bg-yellow-500/10 hover:text-yellow-300 hover:border-yellow-500/50 disabled:opacity-40 transition-colors"
                    >
                      <Sun size={14} className={hintPhase === "loading" ? "animate-spin" : hintPhase === "shooting" ? "animate-pulse" : ""} />
                      {hintPhase === "idle" && "Solar Hint"}
                      {hintPhase === "loading" && "Charging..."}
                      {hintPhase === "shooting" && "Firing..."}
                      {hintPhase === "pulsing" && "Pulsing..."}
                      {hintPhase === "revealed" && "Hints Revealed"}
                    </Button>

                    {/* Black Hole */}
                    <button
                      type="button"
                      onClick={triggerBlackHole}
                      disabled={!bhReady || bhPhase !== "idle"}
                      className={`relative mt-1 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium border overflow-hidden transition-all duration-300 ${
                        bhReady && bhPhase === "idle"
                          ? "border-purple-500/50 text-purple-300 bg-purple-900/10 hover:bg-purple-900/20 cursor-pointer"
                          : "border-purple-500/12 text-purple-400/30 cursor-default"
                      }`}
                    >
                      {/* Pulsing void aura when ready */}
                      {bhReady && bhPhase === "idle" && (
                        <span className="pointer-events-none absolute inset-0 rounded-md border border-purple-500/40 animate-pulse" />
                      )}
                      {/* Energy fill bar */}
                      <span
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-900 via-purple-500 to-purple-300 transition-all duration-700"
                        style={{ width: `${bhEnergy * 100}%` }}
                      />
                      <BhIcon />
                      <span>
                        {bhPhase === "idle" && !bhReady && `Black Hole ${Math.round(bhEnergy * 100)}%`}
                        {bhPhase === "idle" && bhReady && "Black Hole"}
                        {bhPhase === "shooting" && "Firing..."}
                        {bhPhase === "pulling" && "Pulling..."}
                        {bhPhase === "exploding" && "Imploding..."}
                        {bhPhase === "revealed" && "Revealed ✦"}
                      </span>
                    </button>
                  </>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 shadow-2xl"
              >
                <div className="p-4 border-b border-white/10 bg-black/40 shrink-0">
                  <h3 className="font-mono text-sm font-bold text-white/80">GUESS HISTORY ({sortedGuesses.length})</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {sortedGuesses.length === 0 && hintPhase !== "revealed" && bhPhase === "idle" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-white/40 text-sm font-mono"
                        >
                          No guesses yet. Enter a word to see its semantic position.
                        </motion.div>
                      )}
                      {sortedGuesses.map((g, i) => (
                        <motion.div
                          key={g.word + i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] ${TEMP_COLORS[g.temperature]}`} />
                            <span className={`font-mono ${g.isCorrect ? "font-bold text-yellow-400" : "text-white"}`}>{g.word}</span>
                          </div>
                          <div className="text-xs font-mono text-white/50">
                            {(g.similarityScore * 100).toFixed(1)}%
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {hintPhase === "revealed" && hintWords.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 pt-3 border-t border-yellow-500/20"
                      >
                        <p className="text-xs font-mono text-yellow-500/60 mb-2 flex items-center gap-1.5">
                          <Sun size={11} /> SOLAR HINTS
                        </p>
                        {hintWords.map((hw, i) => (
                          <motion.div
                            key={hw.word}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex items-center justify-between py-1.5 px-2 rounded bg-yellow-500/5 border border-yellow-500/10 mb-1"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-400" />
                              <span className="font-mono text-yellow-300 text-sm">{hw.word}</span>
                            </div>
                            <span className="text-xs font-mono text-yellow-500/70">{(hw.similarity * 100).toFixed(1)}%</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {bhPhase === "revealed" && bhRevealedWord && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="mt-3 pt-3 border-t border-purple-500/20"
                      >
                        <p className="text-xs font-mono text-purple-400/60 mb-2 flex items-center gap-1.5">
                          <BhIcon /> BLACK HOLE REVEAL
                        </p>
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-purple-500/8 border border-purple-500/20">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="font-mono text-purple-200 font-bold tracking-widest">{bhRevealedWord.word}</span>
                          </div>
                          <span className="text-xs font-mono text-purple-400/50 italic">partial</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
