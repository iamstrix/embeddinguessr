import { useGetLeaderboard } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Medal, Orbit } from "lucide-react";
import { motion } from "framer-motion";
import { getDeviceId } from "@/lib/device";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const deviceId = getDeviceId();

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-6">
            <Trophy size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono mb-4">TODAY'S TOP OBSERVERS</h1>
          <p className="text-white/60 max-w-xl mx-auto">The most precise minds exploring today's semantic space.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          {isLoading ? (
            <div className="p-12 text-center text-white/40 flex flex-col items-center gap-4">
              <Orbit className="animate-spin text-primary" size={32} />
              <p className="font-mono">Loading data...</p>
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="p-12 text-center text-white/40 font-mono">
              No one has solved today's puzzle yet. Be the first!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {leaderboard.map((entry, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-6 transition-colors ${entry.deviceId === deviceId ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-lg shrink-0">
                      {entry.rank === 1 ? <Medal className="text-yellow-400" size={28} /> : 
                       entry.rank === 2 ? <Medal className="text-zinc-400" size={24} /> : 
                       entry.rank === 3 ? <Medal className="text-amber-600" size={24} /> : 
                       <span className="text-white/40">#{entry.rank}</span>}
                    </div>
                    <div>
                      <div className="font-mono font-medium text-white flex items-center gap-2">
                        Observer {entry.deviceId.substring(0, 8)}
                        {entry.deviceId === deviceId && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">YOU</span>
                        )}
                      </div>
                      <div className="text-sm text-white/40">
                        Solved {formatDistanceToNow(new Date(entry.solvedAt))} ago
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl font-bold text-white">{entry.attemptCount}</div>
                    <div className="text-xs text-white/40 font-mono uppercase tracking-widest">Guesses</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
