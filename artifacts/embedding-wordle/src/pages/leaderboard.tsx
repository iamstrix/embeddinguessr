import { useState } from "react";
import { useGetLeaderboard, useGetEndlessLeaderboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Medal, Orbit, BadgeCheck, Infinity, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "daily" | "endless";

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>("daily");
  const { data: dailyBoard, isLoading: dailyLoading } = useGetLeaderboard();
  const { data: endlessBoard, isLoading: endlessLoading } = useGetEndlessLeaderboard();

  const isLoading = tab === "daily" ? dailyLoading : endlessLoading;

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-6">
            <Trophy size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono mb-4">LEADERBOARD</h1>
          <p className="text-white/60 max-w-xl mx-auto">The sharpest minds in semantic space.</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl mb-6 max-w-xs mx-auto"
        >
          <button
            onClick={() => setTab("daily")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-sm font-semibold transition-all ${
              tab === "daily"
                ? "bg-primary text-primary-foreground shadow"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <CalendarDays size={14} />
            Daily
          </button>
          <button
            onClick={() => setTab("endless")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-sm font-semibold transition-all ${
              tab === "endless"
                ? "bg-primary text-primary-foreground shadow"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Infinity size={14} />
            Endless
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {isLoading ? (
              <div className="p-12 text-center text-white/40 flex flex-col items-center gap-4">
                <Orbit className="animate-spin text-primary" size={32} />
                <p className="font-mono">Loading data...</p>
              </div>
            ) : tab === "daily" ? (
              <DailyBoard entries={dailyBoard ?? []} />
            ) : (
              <EndlessBoard entries={endlessBoard ?? []} />
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-xs text-white/20 font-mono mt-6">
          {tab === "daily"
            ? "Solve today's puzzle and submit your name to appear here"
            : "Sign in and submit after each endless game to climb the ranks"}
        </p>
      </div>
    </Layout>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="text-yellow-400" size={28} />;
  if (rank === 2) return <Medal className="text-zinc-400" size={24} />;
  if (rank === 3) return <Medal className="text-amber-600" size={24} />;
  return <span className="text-white/40 text-base font-mono">#{rank}</span>;
}

type DailyEntry = { rank: number; playerName: string; isVerified: boolean; attemptCount: number; solvedAt: string };
type EndlessEntry = { rank: number; playerName: string; isVerified: boolean; gamesPlayed: number; totalGuesses: number; avgGuesses: number; lastPlayedAt: string };

function DailyBoard({ entries }: { entries: DailyEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-white/40 font-mono">No scores submitted yet today.</p>
        <p className="text-white/25 font-mono text-sm">Solve today's puzzle and submit your name to appear here!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {/* Column header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white/2">
        <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Player</span>
        <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Guesses</span>
      </div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-5 hover:bg-white/3 transition-colors"
        >
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-lg shrink-0">
              <RankBadge rank={entry.rank} />
            </div>
            <div>
              <div className="font-mono font-medium text-white flex items-center gap-1.5">
                {entry.playerName}
                {entry.isVerified && (
                  <span title="Verified account">
                    <BadgeCheck size={14} className="text-primary shrink-0" />
                  </span>
                )}
              </div>
              <div className="text-xs text-white/35 font-mono mt-0.5">
                Solved {formatDistanceToNow(new Date(entry.solvedAt))} ago
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-white">{entry.attemptCount}</div>
            <div className="text-xs text-white/35 font-mono uppercase tracking-widest">Guesses</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EndlessBoard({ entries }: { entries: EndlessEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <Infinity className="text-white/20 mx-auto mb-2" size={32} />
        <p className="text-white/40 font-mono">No endless scores yet.</p>
        <p className="text-white/25 font-mono text-sm">Sign in and play endless mode — submit after each solve to track your stats!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {/* Column header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white/2">
        <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">Player</span>
        <div className="flex items-center gap-6 text-right">
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest w-14">Games</span>
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest w-16">Total</span>
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest w-14">Avg</span>
        </div>
      </div>
      {entries.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-5 hover:bg-white/3 transition-colors"
        >
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-lg shrink-0">
              <RankBadge rank={entry.rank} />
            </div>
            <div>
              <div className="font-mono font-medium text-white flex items-center gap-1.5">
                {entry.playerName}
                {entry.isVerified && (
                  <span title="Verified account">
                    <BadgeCheck size={14} className="text-primary shrink-0" />
                  </span>
                )}
              </div>
              <div className="text-xs text-white/35 font-mono mt-0.5">
                Last played {formatDistanceToNow(new Date(entry.lastPlayedAt))} ago
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div className="w-14">
              <div className="font-mono text-lg font-bold text-white/70">{entry.gamesPlayed}</div>
              <div className="text-[10px] text-white/25 font-mono uppercase tracking-widest">games</div>
            </div>
            <div className="w-16">
              <div className="font-mono text-lg font-bold text-white/70">{entry.totalGuesses}</div>
              <div className="text-[10px] text-white/25 font-mono uppercase tracking-widest">total</div>
            </div>
            <div className="w-14">
              <div className="font-mono text-2xl font-bold text-primary">{entry.avgGuesses.toFixed(1)}</div>
              <div className="text-[10px] text-white/25 font-mono uppercase tracking-widest">avg</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
