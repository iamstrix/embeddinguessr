import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo, Component } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import type { EmbeddingPoint, GuessResult } from "@workspace/api-client-react";

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

function Scene3D({
  clues,
  target,
  guesses,
  solved,
  modelReady,
}: {
  clues: EmbeddingPoint[];
  target: EmbeddingPoint | null;
  guesses: GuessResult[];
  solved: boolean;
  modelReady: boolean;
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

  return (
    <Canvas camera={{ position: [5, 5, 8] }} gl={{ antialias: true }}>
      <color attach="background" args={["#05070a"]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {target && (
        <PointSphere
          position={[target.x * 3, target.y * 3, target.z * 3]}
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

// Isometric projection: maps (x,y,z) → 2D screen coords using all 3 axes
function isoProject(x: number, y: number, z: number) {
  const angle = Math.PI / 6; // 30°
  return {
    sx: (x - z) * Math.cos(angle),
    sy: -(y - (x + z) * Math.sin(angle)),
  };
}

function Scene2D({
  clues,
  target,
  guesses,
  solved,
}: {
  clues: EmbeddingPoint[];
  target: EmbeddingPoint | null;
  guesses: GuessResult[];
  solved: boolean;
}) {
  const W = 700;
  const H = 520;
  const PAD = 60;

  // Stable star field — generated once per mount
  const stars = useMemo(() =>
    Array.from({ length: 140 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.55 + 0.1,
    })), []);

  // Collect all points for auto-fit
  const allPoints = useMemo(() => {
    const pts: { x: number; y: number; z: number }[] = [
      ...clues,
      ...(target ? [target] : []),
      ...guesses,
    ];
    return pts;
  }, [clues, target, guesses]);

  // Compute projected coords for every point, then build a scale/offset that
  // fits all of them within [PAD, W-PAD] × [PAD, H-PAD]
  const project = useMemo(() => {
    if (allPoints.length === 0) return (x: number, y: number, z: number) => ({ cx: W / 2, cy: H / 2 });

    const projected = allPoints.map((p) => isoProject(p.x, p.y, p.z));
    const sxMin = Math.min(...projected.map((p) => p.sx));
    const sxMax = Math.max(...projected.map((p) => p.sx));
    const syMin = Math.min(...projected.map((p) => p.sy));
    const syMax = Math.max(...projected.map((p) => p.sy));

    const rangeX = sxMax - sxMin || 1;
    const rangeY = syMax - syMin || 1;
    const scaleX = (W - PAD * 2) / rangeX;
    const scaleY = (H - PAD * 2) / rangeY;
    const scale = Math.min(scaleX, scaleY);

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

  // Sort guesses back-to-front by z for painter's algorithm
  const sortedGuesses = useMemo(
    () => [...guesses].sort((a, b) => a.z - b.z),
    [guesses]
  );

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
        {/* Axis guides to show the 3D nature */}
        <g opacity={0.06}>
          {/* X axis */}
          {(() => { const o = project(0,0,0); const e = project(0.8,0,0); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#ff6666" strokeWidth={1}/> })()}
          {/* Y axis */}
          {(() => { const o = project(0,0,0); const e = project(0,0.8,0); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#66ff66" strokeWidth={1}/> })()}
          {/* Z axis */}
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
          // z in [-1,1]: closer z (higher) = slightly larger
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

        {/* Target */}
        {target && (() => {
          const { cx, cy } = project(target.x, target.y, target.z);
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
}: {
  clues: EmbeddingPoint[];
  target: EmbeddingPoint | null;
  guesses: GuessResult[];
  solved: boolean;
  modelReady: boolean;
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
          <Scene2D clues={clues} target={target} guesses={guesses} solved={solved} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#05070a]">
            <div className="text-blue-300 font-mono text-sm animate-pulse">Loading embedding model...</div>
          </div>
        )}
      </div>
    );
  }

  const fallback = (
    <Scene2D clues={clues} target={target} guesses={guesses} solved={solved} />
  );

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Scene3D
        clues={clues}
        target={target}
        guesses={guesses}
        solved={solved}
        modelReady={modelReady}
      />
    </CanvasErrorBoundary>
  );
}
