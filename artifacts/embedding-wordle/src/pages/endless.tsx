import { useState, useEffect, useCallback } from "react";
import { useCreateSession, useSubmitSessionGuess, useCreateEndlessPuzzle } from "@workspace/api-client-react";
import type { Puzzle, GameSession } from "@workspace/api-client-react";
import { getDeviceId } from "@/lib/device";
import { Scene } from "@/components/scene";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Send, RefreshCw, Infinity } from "lucide-react";

const TEMP_COLORS: Record<string, string> = {
  correct: "bg-yellow-400",
  hot: "bg-orange-500",
  warm: "bg-amber-500",
  cool: "bg-teal-400",
  cold: "bg-blue-500",
  freezing: "bg-cyan-200",
};

export default function Endless() {
  const [deviceId, setDeviceId] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  const { mutate: createEndlessPuzzle } = useCreateEndlessPuzzle();
  const { mutate: createSession } = useCreateSession();
  const { mutate: submitGuess, isPending: isSubmitting } = useSubmitSessionGuess();

  const startNewGame = useCallback(() => {
    if (!deviceId) return;
    setIsStarting(true);
    setPuzzle(null);
    setSession(null);
    setGuessInput("");

    createEndlessPuzzle(undefined, {
      onSuccess: (newPuzzle) => {
        setPuzzle(newPuzzle);
        createSession(
          { data: { deviceId, puzzleId: newPuzzle.id } },
          {
            onSuccess: (newSession) => {
              setSession(newSession);
              setIsStarting(false);
            },
            onError: () => setIsStarting(false),
          }
        );
      },
      onError: () => setIsStarting(false),
    });
  }, [deviceId, createEndlessPuzzle, createSession]);

  useEffect(() => {
    if (deviceId) startNewGame();
  }, [deviceId]);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || !session || !puzzle || isSubmitting) return;
    submitGuess(
      { sessionId: session.id, data: { word: guessInput.trim().toLowerCase(), puzzleId: puzzle.id } },
      {
        onSuccess: (result) => {
          setSession(result.session);
          setGuessInput("");
        },
      }
    );
  };

  const isSolved = session?.solved ?? false;
  const modelReady = !!puzzle;
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
          />
        </div>

        {isStarting && !puzzle && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
              <Infinity size={36} className="text-primary mx-auto mb-3 animate-pulse" />
              <p className="text-white/70 font-mono text-sm">Generating puzzle...</p>
            </div>
          </div>
        )}

        {modelReady && session && (
          <div className="absolute inset-y-0 left-0 w-full md:w-96 z-10 flex flex-col pointer-events-none p-4 md:p-8">
            <div className="pointer-events-auto w-full max-w-sm mx-auto md:mx-0 flex flex-col h-full gap-4">

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl shrink-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                    <Infinity size={20} className="text-primary" /> ENDLESS
                  </h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startNewGame}
                    disabled={isStarting}
                    className="text-white/50 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
                  >
                    <RefreshCw size={13} className={isStarting ? "animate-spin" : ""} />
                    New Game
                  </Button>
                </div>
                <p className="text-sm text-white/60 mb-6">Find the target word based on semantic distance in 3D space.</p>

                {isSolved ? (
                  <div className="space-y-4 text-center py-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 text-primary mb-1">
                      <Trophy size={28} />
                    </div>
                    <h2 className="text-lg font-bold text-white">Puzzle Solved!</h2>
                    <p className="text-white/70 text-sm">
                      You found{" "}
                      <span className="font-bold text-primary">"{puzzle?.target.word === "?" ? "it" : puzzle?.target.word}"</span>{" "}
                      in {session.attemptCount} guess{session.attemptCount !== 1 ? "es" : ""}.
                    </p>
                    <Button
                      onClick={startNewGame}
                      disabled={isStarting}
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <RefreshCw size={15} className={isStarting ? "animate-spin" : ""} />
                      Play Again
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleGuess} className="flex gap-2">
                    <Input
                      placeholder="Type a word..."
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      className="bg-black/50 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-primary"
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSubmitting || !guessInput.trim()}
                      className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send size={18} />
                    </Button>
                  </form>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 shadow-2xl"
              >
                <div className="p-4 border-b border-white/10 bg-black/40 shrink-0">
                  <h3 className="font-mono text-sm font-bold text-white/80">
                    GUESS HISTORY ({sortedGuesses.length})
                  </h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {sortedGuesses.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-white/40 text-sm font-mono"
                        >
                          No guesses yet. Enter a word to start.
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
                            <span className={`font-mono ${g.isCorrect ? "font-bold text-yellow-400" : "text-white"}`}>
                              {g.word}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-white/50">
                            {(g.similarityScore * 100).toFixed(1)}%
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
