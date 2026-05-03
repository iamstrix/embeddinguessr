import { useState, useEffect } from "react";
import { useGetDailyPuzzle, useCreateSession, useSubmitSessionGuess } from "@workspace/api-client-react";
import { getDeviceId } from "@/lib/device";
import { Scene } from "@/components/scene";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Send, Play, AlertCircle } from "lucide-react";
import { Link } from "wouter";

const TEMP_COLORS: Record<string, string> = {
  correct: "bg-yellow-400",
  hot: "bg-orange-500",
  warm: "bg-amber-500",
  cool: "bg-teal-400",
  cold: "bg-blue-500",
  freezing: "bg-cyan-200",
};

export default function Home() {
  const [deviceId, setDeviceId] = useState("");
  const [guessInput, setGuessInput] = useState("");
  
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  const { data: puzzle, isLoading: isLoadingPuzzle, refetch: refetchPuzzle } = useGetDailyPuzzle({
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
      {
        onSuccess: () => {
          setGuessInput("");
        }
      }
    );
  };

  const isLoading = isLoadingPuzzle || !puzzle;
  const modelReady = puzzle?.modelReady ?? false;
  const isSolved = session?.solved ?? false;

  const sortedGuesses = session?.guesses ? [...session.guesses].sort((a, b) => a.distanceToTarget - b.distanceToTarget) : [];

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
                    <p className="text-white/70">You found <span className="font-bold text-primary">"{puzzle?.target.word}"</span> in {session.attemptCount} guesses.</p>
                    <Link href="/leaderboard" className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
                      <Trophy size={16} /> View Leaderboard
                    </Link>
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
                    <Button type="submit" size="icon" disabled={isSubmitting || !guessInput.trim()} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
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
                  <h3 className="font-mono text-sm font-bold text-white/80">GUESS HISTORY ({sortedGuesses.length})</h3>
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
                            <span className={`font-mono ${g.isCorrect ? 'font-bold text-yellow-400' : 'text-white'}`}>{g.word}</span>
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
