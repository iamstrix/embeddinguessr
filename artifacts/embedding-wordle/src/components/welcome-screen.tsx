import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "embeddinGuessr_welcomed_v1";

function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 1.8 + 0.5,
    opacity: Math.random() * 0.5 + 0.1,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {stars.map(s => (
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{ width: s.size, height: s.size, left: `${s.left}%`, top: `${s.top}%`, opacity: s.opacity }} />
      ))}
    </div>
  );
}

const steps = [
  {
    icon: "🌌",
    title: "Semantic Space",
    body: "Words with similar meanings live close together in an invisible \"semantic space\". Your goal is to find the hidden target word by navigating this space.",
  },
  {
    icon: "🎯",
    title: "How to Guess",
    body: "Type any word and hit enter. You'll see a similarity % — how close your word is in meaning to the target. 100% means you found it!",
  },
  {
    icon: "🌡️",
    title: "Temperature Colours",
    body: (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" /><span>Hot — very close in meaning</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" /><span>Warm — on the right track</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-400 shrink-0" /><span>Cool — getting colder</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-200 shrink-0" /><span>Freezing — far away</span></div>
      </div>
    ),
  },
  {
    icon: "🌐",
    title: "The 3D Map",
    body: "Three anchor words (clues) show you roughly where the target lives in 3D space. Drag to orbit, scroll to zoom. Watch the word spheres cluster as you get closer.",
  },
  {
    icon: "☀️",
    title: "Solar Hint",
    body: "Fires a solar burst that reveals 3 words near the target — each around 50% similar. Use them as stepping-stones when you're stuck.",
  },
  {
    icon: "🕳️",
    title: "Void Hint",
    body: "Charges up as you make guesses. When full, it reveals the target word with some letters hidden (e.g. p _ i s _ n _ r). Great for a final nudge!",
  },
];

export function WelcomeScreen() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#08090f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <StarField />

            {/* Header */}
            <div className="relative px-7 pt-7 pb-4 border-b border-white/8 text-center">
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                Embeddin<span className="text-primary">Guessr</span>
              </div>
              <div className="text-xs font-mono text-white/35 mt-1 tracking-widest uppercase">How to Play</div>
            </div>

            {/* Step content */}
            <div className="relative px-7 py-6 min-h-[190px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">{current.icon}</span>
                    <h2 className="text-base font-bold font-mono text-white">{current.title}</h2>
                  </div>
                  <div className="text-[13px] font-mono text-white/60 leading-relaxed">
                    {current.body}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pb-2">
              {steps.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === step ? "bg-primary w-4" : "bg-white/20 hover:bg-white/40"}`}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="relative px-7 pb-7 flex items-center justify-between gap-3 pt-3">
              <button
                onClick={prev}
                disabled={step === 0}
                className="text-xs font-mono text-white/30 hover:text-white/60 disabled:opacity-0 transition-colors px-2 py-1"
              >
                ← Back
              </button>

              <button
                onClick={dismiss}
                className="text-xs font-mono text-white/25 hover:text-white/50 transition-colors px-2 py-1"
              >
                Skip
              </button>

              <button
                onClick={next}
                className="flex-1 max-w-[140px] bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-sm rounded-lg px-4 py-2.5 transition-colors shadow-lg"
              >
                {isLast ? "Let's Play!" : "Next →"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
