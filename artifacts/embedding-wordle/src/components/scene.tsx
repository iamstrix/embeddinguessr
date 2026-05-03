import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo, Component } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import type { EmbeddingPoint, GuessResult } from "@workspace/api-client-react";

export type HintWord = { word: string; x: number; y: number; z: number; similarity: number };
export type HintPhase = "idle" | "loading" | "shooting" | "pulsing" | "revealed";

const TEMP_COLORS: Record<string, string> = {
  correct: "#ffd700",
  hot: "#ff4500",
  warm: "#ffa500",
  cool: "#00ced1",
  cold: "#4682b4",
  freezing: "#b0e0e6",
};

const TEMP_COLORS_2D: Record<string, string> = {
  correct: "#ffd700",
  hot: "#ff4500",
  warm: "#ffa500",
  cool: "#00ced1",
  cold: "#4682b4",
  freezing: "#b0e0e6",
};

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!ctx;
  } catch {
    return false;
  }
}

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── 3D components ──────────────────────────────────────────────────────────

function PointSphere({
  position,
  color,
  label,
  pulse = false,
  size = 0.15,
  isTarget = false,
}: {
  position: [number, number, number];
  color: string;
  label?: string;
  pulse?: boolean;
  size?: number;
  isTarget?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (pulse && meshRef.current && materialRef.current) {
      const t = clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 3) * 0.15;
      meshRef.current.scale.set(scale, scale, scale);
      materialRef.current.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={pulse ? 0.8 : 0.4}
          toneMapped={false}
        />
      </mesh>
      {label && (
        <Html position={[0, size * 1.5, 0]} center zIndexRange={[100, 0]}>
          <div
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold select-none pointer-events-none whitespace-nowrap ${isTarget ? "bg-primary/20 text-primary border border-primary/50" : "bg-black/50 text-white border border-white/20"}`}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function Connectors({ clues, target }: { clues: EmbeddingPoint[]; target: EmbeddingPoint }) {
  return (
    <group>
      {clues.map((clue, i) => (
        <Line
          key={i}
          points={[
            [clue.x * 3, clue.y * 3, clue.z * 3],
            [target.x * 3, target.y * 3, target.z * 3],
          ]}
          color="#ffffff"
          opacity={0.1}
          transparent
          dashed
          dashScale={10}
          dashSize={0.5}
          dashOffset={0}
        />
      ))}
    </group>
  );
}

const SUN_3D: [number, number, number] = [-45, 28, -20];

function Sun3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.08);
    }
  });
  return (
    <group position={SUN_3D}>
      <pointLight color="#FFD700" intensity={60} distance={120} decay={2} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial color="#FFD700" emissive="#FF8C00" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AnimatedProjectile3D({ targetPos }: { targetPos: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const progress = Math.min((clock.getElapsedTime() - startRef.current) / 1.4, 1);
    if (meshRef.current) {
      meshRef.current.position.set(
        SUN_3D[0] + (targetPos[0] - SUN_3D[0]) * progress,
        SUN_3D[1] + (targetPos[1] - SUN_3D[1]) * progress,
        SUN_3D[2] + (targetPos[2] - SUN_3D[2]) * progress
      );
      meshRef.current.visible = progress < 1;
    }
  });

  return (
    <mesh ref={meshRef} position={SUN_3D}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={4} toneMapped={false} />
    </mesh>
  );
}

function SonarRing3D({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() + delay) % 2) / 2;
    if (meshRef.current) {
      const s = 1 + t * 8;
      meshRef.current.scale.set(s, s, 1);
    }
    if (matRef.current) matRef.current.opacity = Math.max(0, 1 - t * 1.6);
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.28, 0.025, 6, 48]} />
      <meshBasicMaterial ref={matRef} color="#FFD700" transparent opacity={1} />
    </mesh>
  );
}

function Scene3D({
  clues,
  target,
  guesses,
  solved,
  modelReady,
  hintWords,
  hintPhase,
}: {
  clues: EmbeddingPoint[];
  target: EmbeddingPoint | null;
  guesses: GuessResult[];
  solved: boolean;
  modelReady: boolean;
  hintWords?: HintWord[];
  hintPhase?: HintPhase;
}) {
  if (!modelReady) {
    return (
      <Canvas camera={{ position: [0, 0, 8] }} gl={{ antialias: true }}>
        <color attach="background" args={["#05070a"]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.2} />
        <PointSphere position={[0, 0, 0]} color="#4682b4" label="Loading..." pulse size={0.3} />
        <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} enablePan={false} />
      </Canvas>
    );
  }

  const targetPos3D: [number, number, number] = target
    ? [target.x * 3, target.y * 3, target.z * 3]
    : [0, 0, 0];

  return (
    <Canvas camera={{ position: [5, 5, 8] }} gl={{ antialias: true }}>
      <color attach="background" args={["#05070a"]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <Sun3D />

      {target && hintPhase === "shooting" && (
        <AnimatedProjectile3D targetPos={targetPos3D} />
      )}

      {target && (hintPhase === "pulsing" || hintPhase === "revealed") && (
        <>
          <SonarRing3D position={targetPos3D} delay={0} />
          <SonarRing3D position={targetPos3D} delay={0.67} />
          <SonarRing3D position={targetPos3D} delay={1.33} />
        </>
      )}

      {target && (
        <PointSphere
          position={targetPos3D}
          color={solved ? TEMP_COLORS.correct : "#ffffff"}
          label={solved ? target.word : "?"}
          pulse={!solved}
          size={solved ? 0.3 : 0.2}
          isTarget={true}
        />
      )}

      {clues.map((clue, i) => (
        <PointSphere
          key={`clue-${i}`}
          position={[clue.x * 3, clue.y * 3, clue.z * 3]}
          color="#888888"
          label={clue.word}
          size={0.15}
        />
      ))}

      {target && <Connectors clues={clues} target={target} />}

      {guesses.map((guess, i) => (
        <PointSphere
          key={`guess-${i}`}
          position={[guess.x * 3, guess.y * 3, guess.z * 3]}
          color={TEMP_COLORS[guess.temperature] || "#ffffff"}
          label={guess.word}
          size={guess.isCorrect ? 0.3 : 0.12}
          pulse={guess.isCorrect}
        />
      ))}

      {hintPhase === "revealed" &&
        hintWords?.map((hw, i) => (
          <PointSphere
            key={`hint-${i}`}
            position={[hw.x * 3, hw.y * 3, hw.z * 3]}
            color="#FFD700"
            label={hw.word}
            size={0.13}
          />
        ))}

      <OrbitControls
        makeDefault
        autoRotate={!solved}
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}

// ─── 2D isometric components ─────────────────────────────────────────────────

function isoProject(x: number, y: number, z: number) {
  const angle = Math.PI / 6;
  return {
    sx: (x - z) * Math.cos(angle),
    sy: -(y - (x + z) * Math.sin(angle)),
  };
}

const SUN_SVG = { x: 645, y: 455 };
const SUN_R = 16;
const SUN_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function Scene2D({
  clues,
  target,
  guesses,
  solved,
  hintWords,
  hintPhase,
}: {
  clues: EmbeddingPoint[];
  target: EmbeddingPoint | null;
  guesses: GuessResult[];
  solved: boolean;
  hintWords?: HintWord[];
  hintPhase?: HintPhase;
}) {
  const W = 700;
  const H = 520;
  const PAD = 60;

  const stars = useMemo(() =>
    Array.from({ length: 140 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.55 + 0.1,
    })), []);

  const allPoints = useMemo(() => {
    const pts: { x: number; y: number; z: number }[] = [
      ...clues,
      ...(target ? [target] : []),
      ...guesses,
      ...(hintWords ?? []),
    ];
    return pts;
  }, [clues, target, guesses, hintWords]);

  const project = useMemo(() => {
    if (allPoints.length === 0) return (_x: number, _y: number, _z: number) => ({ cx: W / 2, cy: H / 2 });

    const projected = allPoints.map((p) => isoProject(p.x, p.y, p.z));
    const sxMin = Math.min(...projected.map((p) => p.sx));
    const sxMax = Math.max(...projected.map((p) => p.sx));
    const syMin = Math.min(...projected.map((p) => p.sy));
    const syMax = Math.max(...projected.map((p) => p.sy));

    const rangeX = sxMax - sxMin || 1;
    const rangeY = syMax - syMin || 1;
    const scaleX = (W - PAD * 2) / rangeX;
    const scaleY = (H - PAD * 2) / rangeY;
    const MAX_SCALE = 80;
    const scale = Math.min(scaleX, scaleY, MAX_SCALE);

    const midSx = (sxMin + sxMax) / 2;
    const midSy = (syMin + syMax) / 2;

    return (x: number, y: number, z: number) => {
      const { sx, sy } = isoProject(x, y, z);
      return {
        cx: W / 2 + (sx - midSx) * scale,
        cy: H / 2 + (sy - midSy) * scale,
      };
    };
  }, [allPoints]);

  const sortedGuesses = useMemo(
    () => [...guesses].sort((a, b) => a.z - b.z),
    [guesses]
  );

  // Shoot-progress animation (0→1 over 1.4s during 'shooting' phase)
  const [shootProgress, setShootProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (hintPhase === "pulsing" || hintPhase === "revealed") {
      setShootProgress(1);
      return;
    }
    if (hintPhase !== "shooting") {
      setShootProgress(0);
      return;
    }
    startRef.current = null;
    const DURATION = 1400;
    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / DURATION, 1);
      setShootProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hintPhase]);

  const targetProj = target ? project(target.x, target.y, target.z) : null;

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#05070a] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.left}%`, top: `${s.top}%`, opacity: s.opacity }}
          />
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl" style={{ maxHeight: "85vh" }}>
        {/* Axis guides */}
        <g opacity={0.06}>
          {(() => { const o = project(0,0,0); const e = project(0.8,0,0); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#ff6666" strokeWidth={1}/> })()}
          {(() => { const o = project(0,0,0); const e = project(0,0.8,0); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#66ff66" strokeWidth={1}/> })()}
          {(() => { const o = project(0,0,0); const e = project(0,0,0.8); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#6666ff" strokeWidth={1}/> })()}
        </g>

        {/* Connector lines from clues to target */}
        {target && clues.map((clue, i) => {
          const s = project(clue.x, clue.y, clue.z);
          const t = project(target.x, target.y, target.z);
          return (
            <line key={i} x1={s.cx} y1={s.cy} x2={t.cx} y2={t.cy}
              stroke="white" strokeOpacity={0.08} strokeDasharray="5 4" strokeWidth={1} />
          );
        })}

        {/* Guesses (back-to-front) */}
        {sortedGuesses.map((g, i) => {
          const { cx, cy } = project(g.x, g.y, g.z);
          const color = TEMP_COLORS_2D[g.temperature] || "#fff";
          const depthScale = 0.85 + (g.z + 1) * 0.15;
          const r = (g.isCorrect ? 11 : 6) * depthScale;
          return (
            <g key={`g-${i}`}>
              <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.82} />
              <text x={cx} y={cy - r - 4} textAnchor="middle" fill={color}
                fontSize={9.5} fontFamily="monospace" fontWeight="bold" opacity={0.95}>
                {g.word}
              </text>
            </g>
          );
        })}

        {/* Clue words */}
        {clues.map((clue, i) => {
          const { cx, cy } = project(clue.x, clue.y, clue.z);
          return (
            <g key={`c-${i}`}>
              <circle cx={cx} cy={cy} r={10} fill="#777" fillOpacity={0.9} />
              <text x={cx} y={cy - 15} textAnchor="middle" fill="white"
                fontSize={11} fontFamily="monospace" fontWeight="bold">
                {clue.word}
              </text>
            </g>
          );
        })}

        {/* Hint words (revealed) */}
        {hintPhase === "revealed" && hintWords?.map((hw, i) => {
          const { cx, cy } = project(hw.x, hw.y, hw.z);
          return (
            <g key={`hint-${i}`}>
              <circle cx={cx} cy={cy} r={8} fill="#FFD700" fillOpacity={0.22} stroke="#FFD700" strokeWidth={1.5} strokeOpacity={0.8} />
              <circle cx={cx} cy={cy} r={3.5} fill="#FFD700" fillOpacity={0.9} />
              <text x={cx} y={cy - 13} textAnchor="middle" fill="#FFD700"
                fontSize={10} fontFamily="monospace" fontWeight="bold" opacity={0.95}>
                {hw.word}
              </text>
            </g>
          );
        })}

        {/* Target */}
        {target && targetProj && (() => {
          const { cx, cy } = targetProj;
          const color = solved ? "#ffd700" : "#ffffff";
          return (
            <g>
              <circle cx={cx} cy={cy} r={16} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
              <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.9} />
              <text x={cx} y={cy - 22} textAnchor="middle" fill={color}
                fontSize={12} fontFamily="monospace" fontWeight="bold">
                {solved ? target.word : "?"}
              </text>
            </g>
          );
        })()}

        {/* Sonar pulse rings at target (pulsing / revealed) */}
        {targetProj && (hintPhase === "pulsing" || hintPhase === "revealed") && (
          <>
            {[0, 0.65, 1.3].map((delay, i) => (
              <circle key={i} cx={targetProj.cx} cy={targetProj.cy} r={14}
                fill="none" stroke="#FFD700" strokeWidth={1.5} opacity={0}>
                <animate attributeName="r" from="14" to="85" dur="1.9s" begin={`${delay}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.85" to="0" dur="1.9s" begin={`${delay}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </>
        )}

        {/* Solar projectile: line from sun to target */}
        {targetProj && (hintPhase === "shooting" || hintPhase === "pulsing" || hintPhase === "revealed") && (() => {
          const endX = SUN_SVG.x + (targetProj.cx - SUN_SVG.x) * shootProgress;
          const endY = SUN_SVG.y + (targetProj.cy - SUN_SVG.y) * shootProgress;
          const isMoving = hintPhase === "shooting" && shootProgress < 1;
          return (
            <g>
              <line x1={SUN_SVG.x} y1={SUN_SVG.y} x2={endX} y2={endY}
                stroke="#FFD700" strokeWidth={1.8} strokeOpacity={0.75} />
              {isMoving && (
                <circle cx={endX} cy={endY} r={4.5} fill="#FFD700" opacity={0.95}>
                  <animate attributeName="r" values="3;6;3" dur="0.3s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })()}

        {/* Sun — always visible when data is loaded */}
        {allPoints.length > 0 && (
          <g>
            {/* Glow halo */}
            <circle cx={SUN_SVG.x} cy={SUN_SVG.y} r={SUN_R * 1.9} fill="#FFD700" fillOpacity={0.08} />
            {/* Core */}
            <circle cx={SUN_SVG.x} cy={SUN_SVG.y} r={SUN_R * 0.62} fill="#FFD700" fillOpacity={0.92} />
            {/* Outer ring */}
            <circle cx={SUN_SVG.x} cy={SUN_SVG.y} r={SUN_R} fill="none" stroke="#FFD700" strokeWidth={1} strokeOpacity={0.35} />
            {/* Rays */}
            {SUN_RAY_ANGLES.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const inner = SUN_R * 0.78;
              const outer = SUN_R * 1.55;
              return (
                <line key={angle}
                  x1={SUN_SVG.x + Math.cos(rad) * inner}
                  y1={SUN_SVG.y + Math.sin(rad) * inner}
                  x2={SUN_SVG.x + Math.cos(rad) * outer}
                  y2={SUN_SVG.y + Math.sin(rad) * outer}
                  stroke="#FFD700" strokeWidth={1.5} strokeOpacity={0.55} />
              );
            })}
          </g>
        )}

        {/* Axis labels */}
        <g opacity={0.18} fontSize={8} fontFamily="monospace" fill="white">
          {(() => { const e = project(0.9, 0, 0); return <text x={e.cx + 4} y={e.cy}>x</text> })()}
          {(() => { const e = project(0, 0.9, 0); return <text x={e.cx + 4} y={e.cy}>y</text> })()}
          {(() => { const e = project(0, 0, 0.9); return <text x={e.cx + 4} y={e.cy}>z</text> })()}
        </g>
      </svg>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/25 text-xs font-mono">
        ISOMETRIC VIEW — Enable WebGL for interactive 3D
      </div>
    </div>
  );
}

export function Scene({
  clues,
  target,
  guesses,
  solved,
  modelReady,
  hintWords,
  hintPhase,
}: {
  clues: EmbeddingPoint[];
  target: EmbeddingPoint | null;
  guesses: GuessResult[];
  solved: boolean;
  modelReady: boolean;
  hintWords?: HintWord[];
  hintPhase?: HintPhase;
}) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  if (webglSupported === null) {
    return <div className="w-full h-full bg-[#05070a]" />;
  }

  if (!webglSupported) {
    return (
      <div className="w-full h-full">
        {modelReady ? (
          <Scene2D clues={clues} target={target} guesses={guesses} solved={solved}
            hintWords={hintWords} hintPhase={hintPhase} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#05070a]">
            <div className="text-blue-300 font-mono text-sm animate-pulse">Loading embedding model...</div>
          </div>
        )}
      </div>
    );
  }

  const fallback = (
    <Scene2D clues={clues} target={target} guesses={guesses} solved={solved}
      hintWords={hintWords} hintPhase={hintPhase} />
  );

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Scene3D
        clues={clues}
        target={target}
        guesses={guesses}
        solved={solved}
        modelReady={modelReady}
        hintWords={hintWords}
        hintPhase={hintPhase}
      />
    </CanvasErrorBoundary>
  );
}
