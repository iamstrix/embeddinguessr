import { useEffect, useRef, useState, useCallback } from 'react';

export function useSpaceAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const startedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  const buildGraph = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const sr = ctx.sampleRate;
    const bufLen = sr * 6;
    const buf = ctx.createBuffer(2, bufLen, sr);

    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufLen; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }

    const master = ctx.createGain();
    master.gain.value = 0.0;
    masterRef.current = master;
    master.connect(ctx.destination);

    // Layer 1 — low cosmic rumble
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = buf;
    rumbleSrc.loop = true;
    const rumbleFilt = ctx.createBiquadFilter();
    rumbleFilt.type = 'lowpass';
    rumbleFilt.frequency.value = 100;
    rumbleFilt.Q.value = 0.7;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.5;
    rumbleSrc.connect(rumbleFilt);
    rumbleFilt.connect(rumbleGain);
    rumbleGain.connect(master);
    rumbleSrc.start();

    // Layer 2 — wide static hiss
    const hissSrc = ctx.createBufferSource();
    hissSrc.buffer = buf;
    hissSrc.loop = true;
    hissSrc.loopStart = 1.3;
    const hissFilt = ctx.createBiquadFilter();
    hissFilt.type = 'highpass';
    hissFilt.frequency.value = 1800;
    hissFilt.Q.value = 0.4;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.18;
    hissSrc.connect(hissFilt);
    hissFilt.connect(hissGain);
    hissGain.connect(master);
    hissSrc.start();

    // Layer 3 — mid-band crackle texture
    const crklSrc = ctx.createBufferSource();
    crklSrc.buffer = buf;
    crklSrc.loop = true;
    crklSrc.loopStart = 3.1;
    const crklFilt = ctx.createBiquadFilter();
    crklFilt.type = 'bandpass';
    crklFilt.frequency.value = 800;
    crklFilt.Q.value = 1.5;
    const crklGain = ctx.createGain();
    crklGain.gain.value = 0.12;
    crklSrc.connect(crklFilt);
    crklFilt.connect(crklGain);
    crklGain.connect(master);
    crklSrc.start();

    // Slow LFO tremolo — makes it feel like a distant signal fading in/out
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.04;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();
    lfoRef.current = lfo;

    // Fade in
    master.gain.setTargetAtTime(0.045, ctx.currentTime, 3.0);

    setStarted(true);
  }, []);

  // Start on first user interaction
  useEffect(() => {
    const handle = () => {
      buildGraph();
      window.removeEventListener('click', handle);
      window.removeEventListener('keydown', handle);
    };
    window.addEventListener('click', handle);
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('click', handle);
      window.removeEventListener('keydown', handle);
    };
  }, [buildGraph]);

  // M key mute toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setMuted(prev => {
          const next = !prev;
          const ctx = ctxRef.current;
          const master = masterRef.current;
          if (ctx && master) {
            if (next) {
              master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
            } else {
              master.gain.setTargetAtTime(0.045, ctx.currentTime, 0.5);
            }
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
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (ctx && master) {
        if (next) {
          master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        } else {
          master.gain.setTargetAtTime(0.045, ctx.currentTime, 0.5);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => { ctxRef.current?.close(); };
  }, []);

  return { muted, toggleMute, started };
}
