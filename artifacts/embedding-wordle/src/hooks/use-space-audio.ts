import { useEffect, useRef, useState, useCallback } from 'react';

// Chord voicings in Hz (open, stacked fifths / minor thirds)
// Each array = [osc0, osc1, osc2, osc3, osc4, osc5]
const VOICINGS = [
  [55.0,  82.4,  110.0, 164.8, 220.0, 329.6], // Am
  [73.4, 110.0,  146.8, 220.0, 293.7, 440.0], // Dm
  [65.4,  98.0,  130.8, 196.0, 261.6, 392.0], // C
  [82.4, 123.5,  164.8, 196.0, 246.9, 329.6], // Em
];
// LFO speeds per oscillator (Hz) — each voice breathes at its own rate
const LFO_RATES = [0.031, 0.047, 0.019, 0.053, 0.037, 0.023];
// LFO depth in Hz — subtle pitch wobble
const LFO_DEPTHS = [0.4,   0.6,   0.5,   0.7,   0.5,   0.4];
// Per-oscillator gain (bass is louder)
const OSC_GAINS  = [0.18,  0.14,  0.13,  0.11,  0.09,  0.06];

const CHORD_INTERVAL = 22000; // ms between chord changes

export function useSpaceAudio() {
  const ctxRef     = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  const oscsRef    = useRef<OscillatorNode[]>([]);
  const chordIdxRef = useRef(0);
  const chordTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const [muted, setMuted]   = useState(false);
  const [started, setStarted] = useState(false);

  const buildGraph = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // ── Master gain ────────────────────────────────────────────
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    masterRef.current = master;

    // ── Reverb: two delay taps ─────────────────────────────────
    const makeDelay = (t: number, fb: number) => {
      const delay   = ctx.createDelay(2);
      const fbGain  = ctx.createGain();
      delay.delayTime.value   = t;
      fbGain.gain.value       = fb;
      delay.connect(fbGain);
      fbGain.connect(delay);
      return delay;
    };
    const delay1 = makeDelay(0.42, 0.38);
    const delay2 = makeDelay(0.68, 0.30);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.35;
    master.connect(delay1);
    master.connect(delay2);
    delay1.connect(reverbGain);
    delay2.connect(reverbGain);
    reverbGain.connect(ctx.destination);
    master.connect(ctx.destination);

    // ── Low-cut to keep it clean ───────────────────────────────
    const hipass = ctx.createBiquadFilter();
    hipass.type = 'highpass';
    hipass.frequency.value = 40;

    // ── Oscillators with LFO vibrato ───────────────────────────
    const voicing = VOICINGS[0];
    const oscs: OscillatorNode[] = [];

    voicing.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      osc.type   = 'sine';
      osc.frequency.value = freq;

      const lfo  = ctx.createOscillator();
      lfo.type   = 'sine';
      lfo.frequency.value = LFO_RATES[i];

      const lfoG = ctx.createGain();
      lfoG.gain.value = LFO_DEPTHS[i];
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);

      const gain = ctx.createGain();
      gain.gain.value = OSC_GAINS[i] * 0.38; // master mix level

      osc.connect(gain);
      gain.connect(hipass);
      hipass.connect(master);

      osc.start();
      lfo.start();
      oscs.push(osc);
    });
    oscsRef.current = oscs;

    // ── Subtle low-freq pulse (heartbeat) ─────────────────────
    const pulse = ctx.createOscillator();
    pulse.type = 'sine';
    pulse.frequency.value = 0.6; // very slow
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.008;
    pulse.connect(pulseGain);
    pulseGain.connect(master.gain);
    pulse.start();

    // ── Fade in over 5 seconds ─────────────────────────────────
    master.gain.setTargetAtTime(0.55, ctx.currentTime, 3.5);

    // ── Chord scheduler ───────────────────────────────────────
    chordTimer.current = setInterval(() => {
      const ctx2 = ctxRef.current;
      if (!ctx2) return;
      chordIdxRef.current = (chordIdxRef.current + 1) % VOICINGS.length;
      const nextVoicing = VOICINGS[chordIdxRef.current];
      oscsRef.current.forEach((o, i) => {
        o.frequency.setTargetAtTime(nextVoicing[i], ctx2.currentTime, 4.5);
      });
    }, CHORD_INTERVAL);

    setStarted(true);
  }, []);

  // ── Start on first user interaction ───────────────────────────
  useEffect(() => {
    const handle = () => {
      buildGraph();
      window.removeEventListener('click',   handle);
      window.removeEventListener('keydown', handle);
    };
    window.addEventListener('click',   handle);
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('click',   handle);
      window.removeEventListener('keydown', handle);
    };
  }, [buildGraph]);

  // ── M key toggle ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setMuted(prev => {
          const next = !prev;
          const ctx  = ctxRef.current;
          const m    = masterRef.current;
          if (ctx && m) {
            m.gain.setTargetAtTime(next ? 0 : 0.55, ctx.currentTime, 0.4);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      const ctx  = ctxRef.current;
      const m    = masterRef.current;
      if (ctx && m) {
        m.gain.setTargetAtTime(next ? 0 : 0.55, ctx.currentTime, 0.4);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (chordTimer.current) clearInterval(chordTimer.current);
      ctxRef.current?.close();
    };
  }, []);

  return { muted, toggleMute, started };
}
