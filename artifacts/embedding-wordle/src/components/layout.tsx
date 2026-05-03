import { Link, useLocation } from "wouter";
import { LayoutDashboard, Trophy, Settings, BarChart2 } from "lucide-react";

export function FloatingNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2">
      <Link href="/" className={`p-2 rounded-full backdrop-blur-md border transition-colors ${location === '/' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'}`}>
        <LayoutDashboard size={20} />
      </Link>
      <Link href="/leaderboard" className={`p-2 rounded-full backdrop-blur-md border transition-colors ${location === '/leaderboard' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'}`}>
        <Trophy size={20} />
      </Link>
      <Link href="/stats" className={`p-2 rounded-full backdrop-blur-md border transition-colors ${location === '/stats' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'}`}>
        <BarChart2 size={20} />
      </Link>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070a] text-foreground selection:bg-primary/30">
      <FloatingNav />
      {children}
    </div>
  );
}
