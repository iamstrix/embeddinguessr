import { Link, useLocation } from "wouter";
import { LayoutDashboard, Trophy, BarChart2, Infinity, Volume2, VolumeX, LogIn, LogOut, User } from "lucide-react";
import { useSpaceAudio } from "../hooks/use-space-audio";
import { WelcomeScreen } from "./welcome-screen";
import { useUser, useClerk } from "@clerk/react";
import { useState } from "react";

export function FloatingNav() {
  const [location] = useLocation();
  const { muted, toggleMute, started, volume, setVolume } = useSpaceAudio();
  const { user, isSignedIn } = useUser();
  const { openSignIn, signOut } = useClerk();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Player";

  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2 items-center">
      <Link href="/" className={`p-2 rounded-full backdrop-blur-md border transition-colors ${location === '/' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'}`}>
        <LayoutDashboard size={20} />
      </Link>
      <Link href="/endless" className={`p-2 rounded-full backdrop-blur-md border transition-colors ${location === '/endless' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'}`}>
        <Infinity size={20} />
      </Link>
      <Link href="/leaderboard" className={`p-2 rounded-full backdrop-blur-md border transition-colors ${location === '/leaderboard' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'}`}>
        <Trophy size={20} />
      </Link>
      <Link href="/stats" className={`p-2 rounded-full backdrop-blur-md border transition-colors ${location === '/stats' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'}`}>
        <BarChart2 size={20} />
      </Link>

      {/* Auth button */}
      {isSignedIn ? (
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono text-xs font-semibold"
          >
            <User size={14} />
            <span className="max-w-[80px] truncate">{displayName}</span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-[49]" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-[#08090f] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Signed in as</p>
                  <p className="font-mono text-sm text-white font-semibold truncate">{displayName}</p>
                </div>
                <button
                  onClick={() => { signOut(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 font-mono text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => openSignIn()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md border border-white/10 bg-black/20 text-white/70 hover:bg-black/40 hover:text-white transition-colors font-mono text-xs font-semibold"
        >
          <LogIn size={14} />
          Sign in
        </button>
      )}

      {/* Volume control */}
      <div className="relative group/vol">
        <button
          onClick={toggleMute}
          title={muted ? "Unmute music (M)" : "Mute music (M)"}
          className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
            !started ? 'opacity-40' : ''
          } ${
            muted
              ? 'bg-black/20 border-white/10 text-white/40 hover:bg-black/40 hover:text-white/70'
              : 'bg-black/20 border-white/10 text-white/70 hover:bg-black/40 hover:text-white'
          }`}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <div className="absolute right-0 top-full mt-2 opacity-0 group-hover/vol:opacity-100 pointer-events-none group-hover/vol:pointer-events-auto transition-opacity duration-200 z-50">
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-3 flex flex-col items-center gap-2 shadow-xl">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Vol</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="w-24 accent-white/70 cursor-pointer"
            />
            <span className="text-[9px] font-mono text-white/30">{volume}%</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070a] text-foreground selection:bg-primary/30">
      <WelcomeScreen />
      <FloatingNav />
      {children}
    </div>
  );
}
