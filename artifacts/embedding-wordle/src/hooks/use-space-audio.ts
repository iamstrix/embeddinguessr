import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Design ───────────────────────────────────────────────────────────────────
// Film-score space ambient: layered triangle-wave pads + slow melodic motif.
// No close-frequency beating → no buzz.
// Architecture:
//   • Deep bass  — pure octaves (C1/C2), sine, heavily lowpassed
//   • Mid pad    — triangle waves, wide voicing, long ADSR
//   • High shimmer — very quiet sine pairs, slow tremolo
//   • Melody     — stochastic A-minor pentatonic line, one note ~every 9s
//   • Reverb     — three-tap delay feedback network

// Chord definitions for the mid pad layer (Hz, wide voicing)
// All notes are separated by ≥ a minor third to avoid audible beating.
const CHORDS: number[][] = [
  [130.8, 220.0, 329.6, 493.9],  // Cmaj7 (C3, A3, E4, B4)
  [110.0, 196.0, 293.7, 440.0],  // Am7   (A2, G3, D4, A4)
  [87.3,  174.6, 261.6, 392.0],  // Fmaj  (F2, F3, C4, G4)
  [98.0,  196.0, 293.7, 392.0],  // Gsus4 (G2, G3, D4, G4)
];

// A minor pentatonic: A3 C4 D4 E4 G4 A4 C5
const MELODY_NOTES = [220, 261.6, 293.7, 329.6, 392, 440, 523.3];

const CHORD_DURATION = 24000; // ms

// Build a simple three-tap reverb; returns the input gain node
function buildReverb(ctx: AudioContext, out: AudioNode): GainNode {
  const input = ctx.createGain();
  input.gain.value = 1;

  [[0.55, 0.42], [0.72, 0.36], [0.91, 0.28]].forEach(([t, fb]) => {
    const delay = ctx.createDelay(2);
    delay.delayTime.value = t;
    const fbg = ctx.createGain();
    fbg.gain.value = fb;
    delay.connect(fbg);
    fbg.connect(delay);
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    input.connect(delay);
    delay.connect(wet);
    wet.connect(out);
  });

  return input;
}

// Play one triangle-wave note with ADSR and optional route to reverb
function playNote(
  ctx: AudioContext,
  freq: number,
  volume: number,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  dest: AudioNode,
  start = ctx.currentTime,
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(volume, start + attack);
  env.gain.linearRampToValueAtTime(volume * sustain, start + attack + decay);

  osc.connect(env);
  env.connect(dest);
  osc.start(start);

  // Return osc so caller can schedule stop / release
  return osc;
}

export function useSpaceAudio() {
  const ctxRef       = useRef<AudioContext | null>(null);
  const masterRef    = useRef<GainNode | null>(null);
  const chordOscsRef = useRef<{ osc: OscillatorNode; env: GainNode }[]>([]);
  const melodyTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chordTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const chordIdxRef  = useRef(0);
  const startedRef   = useRef(false);
  const [muted, setMuted]     = useState(false);
  const [started, setStarted] = useState(false);

  const buildGraph = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // ── Master output + highpass (cut sub-30Hz rumble) ────────────────────
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    masterRef.current = master;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 35;
    master.connect(hpf);
    hpf.connect(ctx.destination);

    // Reverb feeds directly to destination (bypassing highpass is fine for wet)
    const reverb = buildReverb(ctx, ctx.destination);

    // ── Deep bass — pure octaves, no beating ─────────────────────────────
    [65.4, 130.8].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.07 : 0.045;
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 220;
      osc.connect(lpf);
      lpf.connect(g);
      g.connect(master);
      osc.start();
    });

    // ── Mid pad — triangle waves, first chord ────────────────────────────
    const startChord = (chordFreqs: number[], fadeDuration = 0) => {
      // Fade out old oscs
      chordOscsRef.current.forEach(({ osc, env }) => {
        const t = ctx.currentTime;
        env.gain.setTargetAtTime(0, t, fadeDuration > 0 ? fadeDuration / 4 : 0.1);
        osc.stop(t + fadeDuration + 1);
      });

      const newOscs: { osc: OscillatorNode; env: GainNode }[] = [];
      chordFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Micro-pitch LFO — very slow, very shallow (avoids beating)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.008 + i * 0.003; // 0.008–0.017 Hz
        const lfoG = ctx.createGain();
        lfoG.gain.value = freq * 0.0015; // ±0.15% — imperceptible as buzz
        lfo.connect(lfoG);
        lfoG.connect(osc.frequency);
        lfo.start();

        const env = ctx.createGain();
        const targetVol = [0.11, 0.09, 0.08, 0.06][i] ?? 0.06;
        env.gain.setValueAtTime(0, ctx.currentTime);
        // Staggered attack — pads breathe in one by one
        const atkDelay = i * 1.2;
        env.gain.setTargetAtTime(targetVol, ctx.currentTime + atkDelay, fadeDuration > 0 ? 3.5 : 5);

        osc.connect(env);
        env.connect(master);
        env.connect(reverb);
        osc.start();
        newOscs.push({ osc, env });
      });
      chordOscsRef.current = newOscs;
    };

    startChord(CHORDS[0]);

    // ── Chord sequencer ──────────────────────────────────────────────────
    chordTimer.current = setInterval(() => {
      chordIdxRef.current = (chordIdxRef.current + 1) % CHORDS.length;
      startChord(CHORDS[chordIdxRef.current], 6);
    }, CHORD_DURATION);

    // ── High shimmer — two quiet sines with slow tremolo ─────────────────
    [[1046.5, 0.022], [1318.5, 0.016]].forEach(([f, vol], i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;

      const trem = ctx.createOscillator();
      trem.type = 'sine';
      trem.frequency.value = 0.012 + i * 0.007;
      const tremG = ctx.createGain();
      tremG.gain.value = vol * 0.6;
      trem.connect(tremG);

      const g = ctx.createGain();
      g.gain.value = vol;
      tremG.connect(g.gain);

      osc.connect(g);
      g.connect(reverb);
      osc.start();
      trem.start();
    });

    // ── Stochastic melody — one note every 8–14 seconds ──────────────────
    const scheduleMelodyNote = () => {
      if (!ctxRef.current) return;
      const c = ctxRef.current;
      const freq = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)];
      const now  = c.currentTime;

      const osc = c.createOscillator();
      osc.type  = 'triangle';
      osc.frequency.value = freq;

      const env = c.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.055, now + 0.6);  // soft attack
      env.gain.setTargetAtTime(0.018, now + 1.2, 1.8);     // long decay
      env.gain.setTargetAtTime(0, now + 5, 2.0);           // gentle release

      osc.connect(env);
      env.connect(reverb);
      osc.start(now);
      osc.stop(now + 10);

      const nextIn = 8000 + Math.random() * 6000;
      melodyTimer.current = setTimeout(scheduleMelodyNote, nextIn);
    };
    // First melody note after a short pause
    melodyTimer.current = setTimeout(scheduleMelodyNote, 5000);

    // ── Fade in the master over 6 seconds ────────────────────────────────
    master.gain.setTargetAtTime(0.7, ctx.currentTime, 3.5);

    setStarted(true);
  }, []);

  // ── Start on first user interaction ──────────────────────────────────────
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

  // ── M key mute toggle ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setMuted(prev => {
          const next = !prev;
          const ctx  = ctxRef.current;
          const m    = masterRef.current;
          if (ctx && m) m.gain.setTargetAtTime(next ? 0 : 0.7, ctx.currentTime, 0.5);
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
      if (ctx && m) m.gain.setTargetAtTime(next ? 0 : 0.7, ctx.currentTime, 0.5);
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (melodyTimer.current) clearTimeout(melodyTimer.current);
      if (chordTimer.current)  clearInterval(chordTimer.current);
      ctxRef.current?.close();
    };
  }, []);

  return { muted, toggleMute, started };
}
