import { useGetGameStats } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { BarChart2, Users, Target, Activity, Orbit } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

function StatCard({ title, value, icon: Icon, delay }: { title: string, value: string | number, icon: any, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-start gap-4 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute -right-8 -top-8 text-white/5 group-hover:text-primary/10 transition-colors duration-500">
        <Icon size={120} />
      </div>
      <div className="p-3 rounded-xl bg-white/5 text-primary shrink-0 relative z-10 border border-white/10">
        <Icon size={24} />
      </div>
      <div className="relative z-10">
        <h3 className="text-sm font-mono text-white/50 mb-1">{title}</h3>
        <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const { data: stats, isLoading } = useGetGameStats();

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-6">
            <BarChart2 size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono mb-4">GLOBAL TELEMETRY</h1>
          <p className="text-white/60 max-w-xl mx-auto">Aggregate data from all observatories in the semantic network.</p>
        </motion.div>

        {isLoading ? (
          <div className="py-24 text-center text-white/40 flex flex-col items-center gap-4">
            <Orbit className="animate-spin text-primary" size={32} />
            <p className="font-mono">Processing telemetry...</p>
          </div>
        ) : !stats ? (
          <div className="py-24 text-center text-white/40 font-mono">
            Telemetry unavailable.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              title="TOTAL OBSERVERS" 
              value={stats.totalPlayers} 
              icon={Users} 
              delay={0.1} 
            />
            <StatCard 
              title="SUCCESSFUL DISCOVERIES" 
              value={stats.solvedCount} 
              icon={Target} 
              delay={0.2} 
            />
            <StatCard 
              title="SOLVE RATE" 
              value={`${(stats.solveRate * 100).toFixed(1)}%`} 
              icon={Activity} 
              delay={0.3} 
            />
            <StatCard 
              title="AVERAGE GUESSES" 
              value={stats.averageGuesses.toFixed(1)} 
              icon={BarChart2} 
              delay={0.4} 
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
