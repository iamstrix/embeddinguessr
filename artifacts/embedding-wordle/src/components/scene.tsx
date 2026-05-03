import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import { useRef, useState, useEffect, Component } from "react";
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
  const W = 600;
  const H = 500;
  const toSvg = (x: number, y: number) => ({
    cx: W / 2 + x * W * 0.38,
    cy: H / 2 - y * H * 0.38,
  });

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#05070a] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 120 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.1,
            }}
          />
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl" style={{ maxHeight: "80vh" }}>
        {target &&
          clues.map((clue, i) => {
            const s = toSvg(clue.x, clue.y);
            const t = toSvg(target.x, target.y);
            return (
              <line
                key={i}
                x1={s.cx}
                y1={s.cy}
                x2={t.cx}
                y2={t.cy}
                stroke="white"
                strokeOpacity={0.08}
                strokeDasharray="6 4"
                strokeWidth={1}
              />
            );
          })}

        {guesses.map((g, i) => {
          const { cx, cy } = toSvg(g.x, g.y);
          const color = TEMP_COLORS_2D[g.temperature] || "#fff";
          return (
            <g key={`g-${i}`}>
              <circle cx={cx} cy={cy} r={g.isCorrect ? 12 : 7} fill={color} fillOpacity={0.85} />
              <text x={cx} y={cy - 14} textAnchor="middle" fill={color} fontSize={10} fontFamily="monospace" fontWeight="bold">
                {g.word}
              </text>
            </g>
          );
        })}

        {clues.map((clue, i) => {
          const { cx, cy } = toSvg(clue.x, clue.y);
          return (
            <g key={`c-${i}`}>
              <circle cx={cx} cy={cy} r={10} fill="#888888" fillOpacity={0.9} />
              <text x={cx} y={cy - 16} textAnchor="middle" fill="white" fontSize={11} fontFamily="monospace" fontWeight="bold">
                {clue.word}
              </text>
            </g>
          );
        })}

        {target && (() => {
          const { cx, cy } = toSvg(target.x, target.y);
          const color = solved ? "#ffd700" : "#ffffff";
          return (
            <g>
              <circle cx={cx} cy={cy} r={14} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
              <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.9} />
              <text x={cx} y={cy - 20} textAnchor="middle" fill={color} fontSize={12} fontFamily="monospace" fontWeight="bold">
                {solved ? target.word : "?"}
              </text>
            </g>
          );
        })()}
      </svg>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono">
        2D VIEW — Enable WebGL for the full 3D experience
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
