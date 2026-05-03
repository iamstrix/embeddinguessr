import { useRef, useCallback } from 'react';

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') sharedCtx = new AudioContext();
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

const TEMP_FREQ: Record<string, number> = {
  freezing: 220, cold: 294, cool: 370, warm: 494, hot: 659, correct: 880,
};

function makeReverb(ctx: AudioContext, gain = 0.28) {
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.38;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  delay.connect(fb); fb.connect(delay);
  const g = ctx.createGain(); g.gain.value = gain;
  g.connect(delay); delay.connect(ctx.destination);
  return g;
}

export function useGameSounds() {
  const mutedRef = useRef(false);
  const setMuted = useCallback((v: boolean) => { mutedRef.current = v; }, []);

  // ── Sonar ping on guess ────────────────────────────────────────────────────
  const playGuess = useCallback((temperature: string) => {
    if (mutedRef.current) return;
    const ctx = getCtx(); const freq = TEMP_FREQ[temperature] ?? 440; const now = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 1.0);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.22, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    const rev = makeReverb(ctx, 0.18);
    osc.connect(env); env.connect(rev); env.connect(ctx.destination);
    osc.start(now); osc.stop(now + 1.2);
  }, []);

  // ── Hot match shimmer ──────────────────────────────────────────────────────
  const playHotMatch = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx(); const now = ctx.currentTime;
    [659, 880, 1109].forEach((f, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now + i * 0.08);
      env.gain.linearRampToValueAtTime(0.15 - i * 0.03, now + i * 0.08 + 0.015);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.4);
      osc.connect(env); env.connect(ctx.destination);
      osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 1.5);
    });
  }, []);

  // ── Solve arpeggio ────────────────────────────────────────────────────────
  const playSolve = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx(); const now = ctx.currentTime;
    [440, 554, 659, 880, 1109].forEach((f, i) => {
      const t = now + i * 0.14;
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.25, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, t + (i === 4 ? 2.5 : 0.9));
      const rev = makeReverb(ctx, 0.32);
      osc.connect(env); env.connect(rev); env.connect(ctx.destination);
      osc.start(t); osc.stop(t + 2.6);
    });
  }, []);

  // ── Solar Hint: IMPACT — metallic ping when beam hits target ──────────────
  // Called at hintPhase → "pulsing" (beam reaches target)
  const playSolarHit = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx(); const now = ctx.currentTime;

    // Sharp metallic impact tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.35);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.32, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const rev = makeReverb(ctx, 0.42);
    osc.connect(env); env.connect(rev); env.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.6);

    // Harmonic overtone
    const h = ctx.createOscillator();
    h.type = 'sine'; h.frequency.setValueAtTime(2800, now);
    h.frequency.exponentialRampToValueAtTime(1360, now + 0.35);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0, now);
    hg.gain.linearRampToValueAtTime(0.1, now + 0.008);
    hg.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    h.connect(hg); hg.connect(ctx.destination);
    h.start(now); h.stop(now + 0.4);
  }, []);

  // ── Solar Hint: per-word chime — one bell per revealed hint ───────────────
  // delayMs staggers each call. Called once per hint word at reveal time.
  const playHintReveal = useCallback((delayMs = 0) => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const d = delayMs / 1000;
    const now = ctx.currentTime + d;

    // Warm golden bell
    [880, 1109].forEach((f, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now + i * 0.025);
      env.gain.linearRampToValueAtTime(0.13 - i * 0.04, now + i * 0.025 + 0.012);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.025 + 1.1);
      osc.connect(env); env.connect(ctx.destination);
      osc.start(now + i * 0.025); osc.stop(now + i * 0.025 + 1.2);
    });
  }, []);

  // ── Black Hole ────────────────────────────────────────────────────────────
  const playBlackHole = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx(); const now = ctx.currentTime;

    // Phase 1: Low rumble
    const rumbleBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const rd = rumbleBuf.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
    const rumbleSrc = ctx.createBufferSource(); rumbleSrc.buffer = rumbleBuf;
    const rumbleFilt = ctx.createBiquadFilter(); rumbleFilt.type = 'lowpass';
    rumbleFilt.frequency.setValueAtTime(120, now);
    rumbleFilt.frequency.exponentialRampToValueAtTime(60, now + 1.4);
    const rumbleEnv = ctx.createGain();
    rumbleEnv.gain.setValueAtTime(0, now);
    rumbleEnv.gain.linearRampToValueAtTime(0.45, now + 0.3);
    rumbleEnv.gain.setValueAtTime(0.45, now + 1.1);
    rumbleEnv.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    rumbleSrc.connect(rumbleFilt); rumbleFilt.connect(rumbleEnv); rumbleEnv.connect(ctx.destination);
    rumbleSrc.start(now);

    // Phase 2: Gravitational pull sweep
    const pullOsc = ctx.createOscillator(); pullOsc.type = 'sawtooth';
    pullOsc.frequency.setValueAtTime(180, now + 1.4);
    pullOsc.frequency.exponentialRampToValueAtTime(28, now + 2.9);
    const pullEnv = ctx.createGain();
    pullEnv.gain.setValueAtTime(0, now + 1.4);
    pullEnv.gain.linearRampToValueAtTime(0.28, now + 1.6);
    pullEnv.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    const pullFilt = ctx.createBiquadFilter(); pullFilt.type = 'lowpass';
    pullFilt.frequency.setValueAtTime(900, now + 1.4);
    pullFilt.frequency.exponentialRampToValueAtTime(150, now + 2.9);
    pullOsc.connect(pullFilt); pullFilt.connect(pullEnv); pullEnv.connect(ctx.destination);
    pullOsc.start(now + 1.4); pullOsc.stop(now + 3.1);

    // Phase 3: Implosion sweep
    const impOsc = ctx.createOscillator(); impOsc.type = 'sine';
    impOsc.frequency.setValueAtTime(40, now + 2.9);
    impOsc.frequency.exponentialRampToValueAtTime(1800, now + 3.35);
    const impEnv = ctx.createGain();
    impEnv.gain.setValueAtTime(0.3, now + 2.9);
    impEnv.gain.exponentialRampToValueAtTime(0.001, now + 3.4);
    impOsc.connect(impEnv); impEnv.connect(ctx.destination);
    impOsc.start(now + 2.9); impOsc.stop(now + 3.5);

    // Phase 4: Reveal shimmer
    [440, 659, 880].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + 3.6 + i * 0.1);
      g.gain.linearRampToValueAtTime(0.14, now + 3.62 + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + 4.8 + i * 0.1);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + 3.6 + i * 0.1); o.stop(now + 5.0);
    });
  }, []);

  return { playGuess, playHotMatch, playSolve, playSolarHit, playHintReveal, playBlackHole, setMuted };
}
