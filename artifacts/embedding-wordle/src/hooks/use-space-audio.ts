import { useEffect, useRef, useState, useCallback } from 'react';

// "Interstellar (Space Sounds)" by Dhe Perissann — 18M views
const VIDEO_ID = '5gO0xpY_Y3E';
const CONTAINER_ID = 'yt-bg-audio-player';

// Minimal YT types so we don't need @types/youtube
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(v: number): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: object
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export function useSpaceAudio() {
  const playerRef     = useRef<YTPlayer | null>(null);
  const startedRef    = useRef(false);
  const pendingPlay   = useRef(false);
  const [muted, setMuted]     = useState(false);
  const [started, setStarted] = useState(false);

  // ── Bootstrap: hidden container + YT IFrame API script ────────────────────
  useEffect(() => {
    // Create an off-screen div for the iframe
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      container.style.cssText =
        'position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;' +
        'opacity:0;pointer-events:none;overflow:hidden;';
      document.body.appendChild(container);
    }

    const initPlayer = () => {
      if (playerRef.current) return; // already created
      playerRef.current = new window.YT.Player(CONTAINER_ID, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: VIDEO_ID, // required for loop
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            playerRef.current!.setVolume(75);
            // If the user already clicked before the player was ready, start now
            if (pendingPlay.current) {
              playerRef.current!.playVideo();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      // API already loaded (e.g. HMR / second mount)
      initPlayer();
    } else {
      // Queue our init so we don't overwrite another potential handler
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };

      if (!document.getElementById('yt-iframe-api-script')) {
        const script = document.createElement('script');
        script.id  = 'yt-iframe-api-script';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
    }

    return () => {
      // Destroy player on unmount; leave the API script (no cost to keep it)
      playerRef.current?.destroy();
      playerRef.current = null;
      document.getElementById(CONTAINER_ID)?.remove();
    };
  }, []);

  // ── Start playback on first user interaction ───────────────────────────────
  useEffect(() => {
    const handle = (e: Event) => {
      // Don't trigger on M key (that's the mute toggle)
      if (e instanceof KeyboardEvent && e.key.toLowerCase() === 'm') return;
      if (startedRef.current) return;
      startedRef.current = true;
      setStarted(true);

      if (playerRef.current) {
        playerRef.current.playVideo();
      } else {
        // Player not ready yet — flag it so onReady picks it up
        pendingPlay.current = true;
      }

      window.removeEventListener('click',   handle);
      window.removeEventListener('keydown', handle);
    };
    window.addEventListener('click',   handle);
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('click',   handle);
      window.removeEventListener('keydown', handle);
    };
  }, []);

  // ── M key mute toggle ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() !== 'm' ||
        ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) return;
      setMuted(prev => {
        const next = !prev;
        if (playerRef.current) {
          next ? playerRef.current.mute() : playerRef.current.unMute();
        }
        return next;
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      if (playerRef.current) {
        next ? playerRef.current.mute() : playerRef.current.unMute();
      }
      return next;
    });
  }, []);

  return { muted, toggleMute, started };
}
