import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo, Component } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import type { EmbeddingPoint, GuessResult } from "@workspace/api-client-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type HintWord = { word: string; x: number; y: number; z: number; similarity: number };
export type HintPhase = "idle" | "loading" | "shooting" | "pulsing" | "revealed";
export type BhPhase = "idle" | "shooting" | "pulling" | "exploding" | "revealed";
export type BhRevealedWord = HintWord;

// ─── Constants ───────────────────────────────────────────────────────────────

const TEMP_COLORS: Record<string, string> = {
  correct: "#ffd700", hot: "#ff4500", warm: "#ffa500",
  cool: "#00ced1", cold: "#4682b4", freezing: "#b0e0e6",
};
const TEMP_COLORS_2D = TEMP_COLORS;

function checkWebGLSupport() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
}

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── 3D Components ───────────────────────────────────────────────────────────

function PointSphere({ position, color, label, sublabel, pulse = false, size = 0.15, isTarget = false }: {
  position: [number, number, number]; color: string; label?: string; sublabel?: string;
  pulse?: boolean; size?: number; isTarget?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (pulse && meshRef.current && matRef.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 3) * 0.15;
      meshRef.current.scale.set(s, s, s);
      matRef.current.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.5;
    }
  });
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color}
          emissiveIntensity={pulse ? 0.8 : 0.4} toneMapped={false} />
      </mesh>
      {label && (
        <Html position={[0, size * 1.5, 0]} center zIndexRange={[100, 0]}>
          <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold select-none pointer-events-none whitespace-nowrap text-center ${isTarget ? "bg-primary/20 text-primary border border-primary/50" : "bg-black/50 text-white border border-white/20"}`}>
            {label}
            {sublabel && <div className="text-[9px] font-normal opacity-60 leading-none mt-0.5">{sublabel}</div>}
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
        <Line key={i}
          points={[[clue.x * 3, clue.y * 3, clue.z * 3], [target.x * 3, target.y * 3, target.z * 3]]}
          color="#ffffff" opacity={0.1} transparent dashed dashScale={10} dashSize={0.5} dashOffset={0} />
      ))}
    </group>
  );
}

const SUN_3D: [number, number, number] = [-45, 28, -20];
const BH_3D: [number, number, number] = [45, -28, 20];

function Sun3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.08);
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

function BlackHole3D({ bhEnergy = 0 }: { bhEnergy?: number }) {
  const d1Ref = useRef<THREE.Mesh>(null);
  const d2Ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (d1Ref.current) d1Ref.current.rotation.z = t * 0.8;
    if (d2Ref.current) d2Ref.current.rotation.z = -t * 0.5;
    if (glowRef.current && glowMatRef.current && bhEnergy >= 1) {
      const pulse = 1 + Math.sin(t * 2) * 0.3;
      glowRef.current.scale.setScalar(pulse);
      glowMatRef.current.opacity = 0.25 + Math.sin(t * 2) * 0.15;
    }
  });
  return (
    <group position={BH_3D}>
      <pointLight color="#7c3aed" intensity={20} distance={80} decay={2} />
      <mesh><sphereGeometry args={[1.6, 16, 16]} /><meshStandardMaterial color="#06000f" /></mesh>
      <mesh ref={d1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.3, 0.1, 4, 64]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.75} />
      </mesh>
      <mesh ref={d2Ref} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[1.8, 0.07, 4, 64]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.5} />
      </mesh>
      {bhEnergy >= 1 && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[2.8, 8, 8]} />
          <meshBasicMaterial ref={glowMatRef} color="#7c3aed" transparent opacity={0.25} />
        </mesh>
      )}
    </group>
  );
}

function SolarProjectile3D({ targetPos }: { targetPos: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startRef = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const p = Math.min((clock.getElapsedTime() - startRef.current) / 1.4, 1);
    if (meshRef.current) {
      meshRef.current.position.set(
        SUN_3D[0] + (targetPos[0] - SUN_3D[0]) * p,
        SUN_3D[1] + (targetPos[1] - SUN_3D[1]) * p,
        SUN_3D[2] + (targetPos[2] - SUN_3D[2]) * p
      );
      meshRef.current.visible = p < 1;
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
    if (meshRef.current) meshRef.current.scale.set(1 + t * 8, 1 + t * 8, 1);
    if (matRef.current) matRef.current.opacity = Math.max(0, 1 - t * 1.6);
  });
  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.28, 0.025, 6, 48]} />
      <meshBasicMaterial ref={matRef} color="#FFD700" transparent opacity={1} />
    </mesh>
  );
}

function BhProjectile3D({ targetPos }: { targetPos: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startRef = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const p = Math.min((clock.getElapsedTime() - startRef.current) / 1.4, 1);
    if (meshRef.current) {
      meshRef.current.position.set(
        BH_3D[0] + (targetPos[0] - BH_3D[0]) * p,
        BH_3D[1] + (targetPos[1] - BH_3D[1]) * p,
        BH_3D[2] + (targetPos[2] - BH_3D[2]) * p
      );
      meshRef.current.visible = p < 1;
    }
  });
  return (
    <mesh ref={meshRef} position={BH_3D}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={4} toneMapped={false} />
    </mesh>
  );
}

function BhPullSpheres3D({ guesses, targetPos }: { guesses: GuessResult[]; targetPos: [number, number, number] }) {
  const startRef = useRef<number | null>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const p = Math.min((clock.getElapsedTime() - startRef.current) / 1.5, 1);
    guesses.forEach((g, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      mesh.position.set(
        g.x * 3 + (targetPos[0] - g.x * 3) * p,
        g.y * 3 + (targetPos[1] - g.y * 3) * p,
        g.z * 3 + (targetPos[2] - g.z * 3) * p
      );
    });
  });
  return (
    <>
      {guesses.map((g, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} position={[g.x * 3, g.y * 3, g.z * 3]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={TEMP_COLORS[g.temperature] || "#fff"} />
        </mesh>
      ))}
    </>
  );
}

function BhExplosion3D({ position }: { position: [number, number, number] }) {
  const m1 = useRef<THREE.Mesh>(null); const mat1 = useRef<THREE.MeshBasicMaterial>(null);
  const m2 = useRef<THREE.Mesh>(null); const mat2 = useRef<THREE.MeshBasicMaterial>(null);
  const m3 = useRef<THREE.Mesh>(null); const mat3 = useRef<THREE.MeshBasicMaterial>(null);
  const startRef = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const t = clock.getElapsedTime() - startRef.current;
    const update = (mesh: THREE.Mesh | null, mat: THREE.MeshBasicMaterial | null, off: number) => {
      if (!mesh || !mat) return;
      const p = ((t + off) % 8) / 8;
      const s = Math.max(0.001, (1 - p) * 11);
      mesh.scale.set(s, s, 1);
      mat.opacity = 0.3 + p * 0.65;
    };
    update(m1.current, mat1.current, 0);
    update(m2.current, mat2.current, 2.67);
    update(m3.current, mat3.current, 5.33);
  });
  const ring = (ref: React.RefObject<THREE.Mesh | null>, matRef: React.RefObject<THREE.MeshBasicMaterial | null>, col: string) => (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.3, 0.04, 8, 64]} />
      <meshBasicMaterial ref={matRef} color={col} transparent opacity={0.6} />
    </mesh>
  );
  return <>{ring(m1, mat1, "#a855f7")}{ring(m2, mat2, "#7c3aed")}{ring(m3, mat3, "#c084fc")}</>;
}

function Scene3D({ clues, target, guesses, solved, modelReady, hintWords, hintPhase, bhPhase, bhEnergy, bhRevealedWord, autoRotate, showSimilarity }: {
  clues: EmbeddingPoint[]; target: EmbeddingPoint | null; guesses: GuessResult[];
  solved: boolean; modelReady: boolean; hintWords?: HintWord[]; hintPhase?: HintPhase;
  bhPhase?: BhPhase; bhEnergy?: number; bhRevealedWord?: BhRevealedWord | null; autoRotate?: boolean; showSimilarity?: boolean;
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

  const targetPos3D: [number, number, number] = target ? [target.x * 3, target.y * 3, target.z * 3] : [0, 0, 0];
  const showNormalGuesses = bhPhase === "idle" || bhPhase === "shooting" || !bhPhase;
  const showPullGuesses = bhPhase === "pulling";

  return (
    <Canvas camera={{ position: [5, 5, 8] }} gl={{ antialias: true }}>
      <color attach="background" args={["#05070a"]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <Sun3D />
      <BlackHole3D bhEnergy={bhEnergy} />

      {/* Solar system */}
      {target && hintPhase === "shooting" && <SolarProjectile3D targetPos={targetPos3D} />}
      {target && (hintPhase === "pulsing" || hintPhase === "revealed") && (
        <><SonarRing3D position={targetPos3D} delay={0} /><SonarRing3D position={targetPos3D} delay={0.67} /><SonarRing3D position={targetPos3D} delay={1.33} /></>
      )}
      {hintPhase === "revealed" && hintWords?.map((hw, i) => (
        <PointSphere key={`hint-${i}`} position={[hw.x * 3, hw.y * 3, hw.z * 3]} color="#FFD700" label={hw.word} size={0.13} />
      ))}

      {/* Black hole system */}
      {target && bhPhase === "shooting" && <BhProjectile3D targetPos={targetPos3D} />}
      {target && bhPhase === "pulling" && <BhPullSpheres3D guesses={guesses} targetPos={targetPos3D} />}
      {target && (bhPhase === "exploding" || bhPhase === "revealed") && <BhExplosion3D position={targetPos3D} />}
      {/* bhRevealedWord is shown on the target node above */}

      {/* Target */}
      {target && (() => {
        const isBhActive = bhPhase === "pulling" || bhPhase === "exploding";
        const color = solved ? TEMP_COLORS.correct : isBhActive ? "#3b0764" : "#ffffff";
        const correctWord = guesses.find(g => g.isCorrect)?.word;
        return (
          <PointSphere position={targetPos3D} color={color} label={solved ? (correctWord ?? target.word) : "?"}
            pulse={!solved && !isBhActive}
            size={solved ? 0.3 : 0.2} isTarget={true} />
        );
      })()}

      {/* BH revealed word — separate nearby sphere */}
      {bhPhase === "revealed" && bhRevealedWord && (
        <PointSphere
          position={[targetPos3D[0] + 1.0, targetPos3D[1] + 1.0, targetPos3D[2]]}
          color="#a855f7" label={bhRevealedWord.word} size={0.15}
        />
      )}

      {clues.map((clue, i) => (
        <PointSphere key={`clue-${i}`} position={[clue.x * 3, clue.y * 3, clue.z * 3]}
          color="#888888" label={clue.word}
          sublabel={showSimilarity && clue.similarityScore != null ? `${(clue.similarityScore * 100).toFixed(1)}%` : undefined}
          size={0.15} />
      ))}
      {target && <Connectors clues={clues} target={target} />}

      {/* Normal guesses (hidden during BH pull/explode/reveal) */}
      {showNormalGuesses && guesses.map((g, i) => (
        <PointSphere key={`guess-${i}`} position={[g.x * 3, g.y * 3, g.z * 3]}
          color={TEMP_COLORS[g.temperature] || "#ffffff"} label={g.word}
          sublabel={showSimilarity ? `${(g.similarityScore * 100).toFixed(1)}%` : undefined}
          size={g.isCorrect ? 0.3 : 0.12} pulse={g.isCorrect} />
      ))}
      {showPullGuesses && <BhPullSpheres3D guesses={guesses} targetPos={targetPos3D} />}

      <OrbitControls makeDefault autoRotate={!solved && autoRotate !== false} autoRotateSpeed={0.15} enableDamping dampingFactor={0.05} />
    </Canvas>
  );
}

// ─── 2D Isometric ────────────────────────────────────────────────────────────

function isoProject(x: number, y: number, z: number) {
  const a = Math.PI / 6;
  return { sx: (x - z) * Math.cos(a), sy: -(y - (x + z) * Math.sin(a)) };
}

const SUN_SVG = { x: 645, y: 455 };
const BH_SVG = { x: 200, y: 55 };
const SUN_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function useRafProgress(active: boolean, duration: number, holdWhen?: boolean) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (holdWhen) { setProgress(1); return; }
    if (!active) { setProgress(0); return; }
    startRef.current = null;
    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, holdWhen, duration]);
  return progress;
}

function Scene2D({ clues, target, guesses, solved, hintWords, hintPhase, bhPhase, bhEnergy, bhRevealedWord, showSimilarity }: {
  clues: EmbeddingPoint[]; target: EmbeddingPoint | null; guesses: GuessResult[];
  solved: boolean; hintWords?: HintWord[]; hintPhase?: HintPhase;
  bhPhase?: BhPhase; bhEnergy?: number; bhRevealedWord?: BhRevealedWord | null; showSimilarity?: boolean;
}) {
  const W = 700; const H = 520; const PAD = 60;

  const stars = useMemo(() => Array.from({ length: 140 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 100,
    size: Math.random() * 1.8 + 0.6, opacity: Math.random() * 0.55 + 0.1,
  })), []);

  const allPoints = useMemo(() => {
    const pts: { x: number; y: number; z: number }[] = [
      ...clues, ...(target ? [target] : []), ...guesses,
      ...(hintWords ?? []),
      ...(bhRevealedWord && bhPhase === "revealed" ? [bhRevealedWord] : []),
    ];
    return pts;
  }, [clues, target, guesses, hintWords, bhRevealedWord, bhPhase]);

  const project = useMemo(() => {
    if (allPoints.length === 0) return (_x: number, _y: number, _z: number) => ({ cx: W / 2, cy: H / 2 });
    const projected = allPoints.map(p => isoProject(p.x, p.y, p.z));
    const sxMin = Math.min(...projected.map(p => p.sx)), sxMax = Math.max(...projected.map(p => p.sx));
    const syMin = Math.min(...projected.map(p => p.sy)), syMax = Math.max(...projected.map(p => p.sy));
    const scale = Math.min((W - PAD * 2) / (sxMax - sxMin || 1), (H - PAD * 2) / (syMax - syMin || 1), 80);
    const midSx = (sxMin + sxMax) / 2, midSy = (syMin + syMax) / 2;
    return (x: number, y: number, z: number) => {
      const { sx, sy } = isoProject(x, y, z);
      return { cx: W / 2 + (sx - midSx) * scale, cy: H / 2 + (sy - midSy) * scale };
    };
  }, [allPoints]);

  const sortedGuesses = useMemo(() => [...guesses].sort((a, b) => a.z - b.z), [guesses]);

  // Solar animations
  const solarShooting = hintPhase === "shooting";
  const solarHold = hintPhase === "pulsing" || hintPhase === "revealed";
  const shootProgress = useRafProgress(solarShooting, 1400, solarHold);

  // BH animations
  const bhShooting = bhPhase === "shooting";
  const bhShootHold = bhPhase === "pulling" || bhPhase === "exploding" || bhPhase === "revealed";
  const bhShootProgress = useRafProgress(bhShooting, 1400, bhShootHold);

  const bhPulling = bhPhase === "pulling";
  const bhPullHold = bhPhase === "exploding" || bhPhase === "revealed";
  const bhPullProgress = useRafProgress(bhPulling, 1500, bhPullHold);

  const targetProj = target ? project(target.x, target.y, target.z) : null;
  const bhReady = (bhEnergy ?? 0) >= 1;

  // Guess rendering mode
  const hideGuesses = bhPhase === "exploding" || bhPhase === "revealed";
  const pullGuesses = bhPhase === "pulling";

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#05070a] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {stars.map(s => (
          <div key={s.id} className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.left}%`, top: `${s.top}%`, opacity: s.opacity }} />
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl" style={{ maxHeight: "85vh" }}>
        {/* Axis guides */}
        <g opacity={0.06}>
          {(() => { const o = project(0,0,0), e = project(0.8,0,0); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#ff6666" strokeWidth={1}/>; })()}
          {(() => { const o = project(0,0,0), e = project(0,0.8,0); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#66ff66" strokeWidth={1}/>; })()}
          {(() => { const o = project(0,0,0), e = project(0,0,0.8); return <line x1={o.cx} y1={o.cy} x2={e.cx} y2={e.cy} stroke="#6666ff" strokeWidth={1}/>; })()}
        </g>

        {/* Connector lines (hidden during BH pull) */}
        {target && !pullGuesses && !hideGuesses && clues.map((clue, i) => {
          const s = project(clue.x, clue.y, clue.z), t = project(target.x, target.y, target.z);
          return <line key={i} x1={s.cx} y1={s.cy} x2={t.cx} y2={t.cy} stroke="white" strokeOpacity={0.08} strokeDasharray="5 4" strokeWidth={1} />;
        })}

        {/* BH beam (shooting phase) */}
        {targetProj && (bhPhase === "shooting" || bhShootHold) && (() => {
          const endX = BH_SVG.x + (targetProj.cx - BH_SVG.x) * bhShootProgress;
          const endY = BH_SVG.y + (targetProj.cy - BH_SVG.y) * bhShootProgress;
          const moving = bhPhase === "shooting" && bhShootProgress < 1;
          return (
            <g>
              <line x1={BH_SVG.x} y1={BH_SVG.y} x2={endX} y2={endY}
                stroke="#a855f7" strokeWidth={2} strokeOpacity={0.8} />
              {moving && (
                <circle cx={endX} cy={endY} r={5} fill="#7c3aed" opacity={0.9}>
                  <animate attributeName="r" values="3;7;3" dur="0.25s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })()}

        {/* Solar beam */}
        {targetProj && (hintPhase === "shooting" || solarHold) && (() => {
          const endX = SUN_SVG.x + (targetProj.cx - SUN_SVG.x) * shootProgress;
          const endY = SUN_SVG.y + (targetProj.cy - SUN_SVG.y) * shootProgress;
          const moving = hintPhase === "shooting" && shootProgress < 1;
          return (
            <g>
              <line x1={SUN_SVG.x} y1={SUN_SVG.y} x2={endX} y2={endY}
                stroke="#FFD700" strokeWidth={1.8} strokeOpacity={0.75} />
              {moving && (
                <circle cx={endX} cy={endY} r={4.5} fill="#FFD700" opacity={0.95}>
                  <animate attributeName="r" values="3;6;3" dur="0.3s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })()}

        {/* Guesses */}
        {!hideGuesses && sortedGuesses.map((g, i) => {
          const base = project(g.x, g.y, g.z);
          const tp = targetProj;
          const cx = pullGuesses && tp ? base.cx + (tp.cx - base.cx) * bhPullProgress : base.cx;
          const cy = pullGuesses && tp ? base.cy + (tp.cy - base.cy) * bhPullProgress : base.cy;
          const color = TEMP_COLORS_2D[g.temperature] || "#fff";
          const depthScale = 0.85 + (g.z + 1) * 0.15;
          const r = (g.isCorrect ? 11 : 6) * depthScale;
          // fade out as they approach target during pull
          const opacity = pullGuesses ? Math.max(0, 1 - bhPullProgress * 0.8) : 0.82;
          return (
            <g key={`g-${i}`}>
              <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={opacity} />
              {!pullGuesses && (
                <>
                  {showSimilarity && (
                    <text x={cx} y={cy - r - 14} textAnchor="middle" fill={color}
                      fontSize={8} fontFamily="monospace" opacity={0.55}>
                      {(g.similarityScore * 100).toFixed(1)}%
                    </text>
                  )}
                  <text x={cx} y={cy - r - 4} textAnchor="middle" fill={color}
                    fontSize={9.5} fontFamily="monospace" fontWeight="bold" opacity={0.95}>
                    {g.word}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Clues */}
        {clues.map((clue, i) => {
          const { cx, cy } = project(clue.x, clue.y, clue.z);
          return (
            <g key={`c-${i}`}>
              <circle cx={cx} cy={cy} r={10} fill="#777" fillOpacity={0.9} />
              <text x={cx} y={cy - 16} textAnchor="middle" fill="white" fontSize={11} fontFamily="monospace" fontWeight="bold">{clue.word}</text>
              {showSimilarity && clue.similarityScore != null && (
                <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={8} fontFamily="monospace" opacity={0.55}>
                  {(clue.similarityScore * 100).toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Solar hint words */}
        {hintPhase === "revealed" && hintWords?.map((hw, i) => {
          const { cx, cy } = project(hw.x, hw.y, hw.z);
          return (
            <g key={`hint-${i}`}>
              <circle cx={cx} cy={cy} r={8} fill="#FFD700" fillOpacity={0.22} stroke="#FFD700" strokeWidth={1.5} strokeOpacity={0.8} />
              <circle cx={cx} cy={cy} r={3.5} fill="#FFD700" fillOpacity={0.9} />
              <text x={cx} y={cy - 13} textAnchor="middle" fill="#FFD700" fontSize={10} fontFamily="monospace" fontWeight="bold" opacity={0.95}>{hw.word}</text>
            </g>
          );
        })}

        {/* BH revealed word — separate nearby circle with connector */}
        {bhPhase === "revealed" && bhRevealedWord && targetProj && (() => {
          const rx = targetProj.cx + 54;
          const ry2 = targetProj.cy - 40;
          return (
            <g>
              <line x1={targetProj.cx} y1={targetProj.cy} x2={rx} y2={ry2}
                stroke="#a855f7" strokeWidth={0.9} strokeOpacity={0.45} strokeDasharray="4 3" />
              <circle cx={rx} cy={ry2} r={16} fill="#7c3aed" fillOpacity={0.18} stroke="#a855f7" strokeWidth={1.5} strokeOpacity={0.9} />
              <circle cx={rx} cy={ry2} r={7} fill="#a855f7" fillOpacity={0.92} />
              <text x={rx} y={ry2 - 22} textAnchor="middle" fill="#c084fc"
                fontSize={11} fontFamily="monospace" fontWeight="bold" letterSpacing={3}>
                {bhRevealedWord.word}
              </text>
            </g>
          );
        })()}

        {/* Target */}
        {target && targetProj && (() => {
          const { cx, cy } = targetProj;
          const isBhActive = bhPhase === "pulling" || bhPhase === "exploding";
          const color = solved ? "#ffd700" : isBhActive ? "#7c3aed" : "#ffffff";
          const correctWord = guesses.find(g => g.isCorrect)?.word;
          const label = solved ? (correctWord ?? target.word) : isBhActive ? "✦" : "?";
          return (
            <g>
              <circle cx={cx} cy={cy} r={16} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
              <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={isBhActive ? 0.5 : 0.9} />
              {isBhActive && (
                <>
                  {/* Vertical breathing ellipse — slower than solar (4s vs 1.9s) */}
                  <ellipse cx={cx} cy={cy} rx={22} ry={5} fill="none" stroke="#7c3aed" strokeWidth={1.5} opacity={0.5}>
                    <animate attributeName="ry" values="5;22;5" dur="40s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.72;0.3" dur="40s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx={cx} cy={cy} rx={16} ry={4} fill="none" stroke="#a855f7" strokeWidth={1} opacity={0.3}>
                    <animate attributeName="ry" values="4;16;4" dur="40s" begin="20s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.15;0.5;0.15" dur="40s" begin="20s" repeatCount="indefinite" />
                  </ellipse>
                </>
              )}
              <text x={cx} y={cy - 22} textAnchor="middle" fill={color} fontSize={12} fontFamily="monospace" fontWeight="bold">
                {label}
              </text>
            </g>
          );
        })()}

        {/* Solar sonar rings */}
        {targetProj && (hintPhase === "pulsing" || hintPhase === "revealed") && (
          [0, 0.65, 1.3].map((delay, i) => (
            <circle key={i} cx={targetProj.cx} cy={targetProj.cy} r={14}
              fill="none" stroke="#FFD700" strokeWidth={1.5} opacity={0}>
              <animate attributeName="r" from="14" to="85" dur="1.9s" begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.85" to="0" dur="1.9s" begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          ))
        )}

        {/* BH implosion rings — collapse inward from large radius to 0 */}
        {targetProj && (bhPhase === "exploding" || bhPhase === "revealed") && (
          [0, 0.27, 0.54].map((delay, i) => (
            <circle key={i} cx={targetProj.cx} cy={targetProj.cy} r={140}
              fill="none" stroke={i === 1 ? "#7c3aed" : "#a855f7"} strokeWidth={1.5} opacity={0}>
              <animate attributeName="r" from="140" to="0" dur="8s" begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="1" dur="8s" begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="stroke-width" from="1" to="6" dur="8s" begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          ))
        )}

        {/* ── Sun ── */}
        {allPoints.length > 0 && (
          <g>
            <circle cx={SUN_SVG.x} cy={SUN_SVG.y} r={28} fill="#FFD700" fillOpacity={0.06} />
            <circle cx={SUN_SVG.x} cy={SUN_SVG.y} r={10} fill="#FFD700" fillOpacity={0.92} />
            <circle cx={SUN_SVG.x} cy={SUN_SVG.y} r={16} fill="none" stroke="#FFD700" strokeWidth={1} strokeOpacity={0.3} />
            {SUN_RAY_ANGLES.map(angle => {
              const rad = (angle * Math.PI) / 180;
              return <line key={angle}
                x1={SUN_SVG.x + Math.cos(rad) * 12} y1={SUN_SVG.y + Math.sin(rad) * 12}
                x2={SUN_SVG.x + Math.cos(rad) * 22} y2={SUN_SVG.y + Math.sin(rad) * 22}
                stroke="#FFD700" strokeWidth={1.5} strokeOpacity={0.55} />;
            })}
          </g>
        )}

        {/* ── Black Hole ── */}
        {allPoints.length > 0 && (
          <g transform={`translate(${BH_SVG.x} ${BH_SVG.y})`}>
            {/* Pulsing void aura when charged */}
            {bhReady && (
              <circle r={30} fill="#7c3aed" fillOpacity={0.06}>
                <animate attributeName="r" values="26;36;26" dur="2s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.06;0.16;0.06" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Dark background */}
            <circle r={18} fill="#07000e" stroke="#3b0764" strokeWidth={0.8} />
            {/* Accretion ring 1 */}
            <ellipse rx={22} ry={7} fill="none" stroke="#7c3aed" strokeWidth={1.5} opacity={0.65}>
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
            </ellipse>
            {/* Accretion ring 2 */}
            <ellipse rx={16} ry={5} fill="none" stroke="#a855f7" strokeWidth={1} opacity={0.4}>
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="2.8s" repeatCount="indefinite" />
            </ellipse>
            {/* Singularity */}
            <circle r={9} fill="#0b0015" />
            <circle r={5} fill="#18002e" />
          </g>
        )}

        {/* Axis labels */}
        <g opacity={0.18} fontSize={8} fontFamily="monospace" fill="white">
          {(() => { const e = project(0.9,0,0); return <text x={e.cx+4} y={e.cy}>x</text>; })()}
          {(() => { const e = project(0,0.9,0); return <text x={e.cx+4} y={e.cy}>y</text>; })()}
          {(() => { const e = project(0,0,0.9); return <text x={e.cx+4} y={e.cy}>z</text>; })()}
        </g>
      </svg>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/25 text-xs font-mono">
        ISOMETRIC VIEW — Enable WebGL for interactive 3D
      </div>
    </div>
  );
}

// ─── Main Scene Export ────────────────────────────────────────────────────────

export function Scene({ clues, target, guesses, solved, modelReady, hintWords, hintPhase, bhPhase, bhEnergy, bhRevealedWord, showSimilarity = true }: {
  clues: EmbeddingPoint[]; target: EmbeddingPoint | null; guesses: GuessResult[];
  solved: boolean; modelReady: boolean; hintWords?: HintWord[]; hintPhase?: HintPhase;
  bhPhase?: BhPhase; bhEnergy?: number; bhRevealedWord?: BhRevealedWord | null; showSimilarity?: boolean;
}) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => { setWebglSupported(checkWebGLSupport()); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setAutoRotate(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (webglSupported === null) return <div className="w-full h-full bg-[#05070a]" />;

  const scene2d = (
    <Scene2D clues={clues} target={target} guesses={guesses} solved={solved}
      hintWords={hintWords} hintPhase={hintPhase} bhPhase={bhPhase} bhEnergy={bhEnergy}
      bhRevealedWord={bhRevealedWord} showSimilarity={showSimilarity} />
  );

  const tooltip = (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none select-none items-end">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-white/30">{autoRotate ? 'auto-rotate on' : 'auto-rotate off'}</span>
        <kbd className="text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 rounded px-1 py-0.5 leading-none">R</kbd>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-white/30">{showSimilarity ? 'similarity on' : 'similarity off'}</span>
        <kbd className="text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 rounded px-1 py-0.5 leading-none">S</kbd>
      </div>
    </div>
  );

  if (!webglSupported) {
    return (
      <div className="relative w-full h-full">
        {modelReady ? scene2d : (
          <div className="w-full h-full flex items-center justify-center bg-[#05070a]">
            <div className="text-blue-300 font-mono text-sm animate-pulse">Loading embedding model...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <CanvasErrorBoundary fallback={scene2d}>
        <Scene3D clues={clues} target={target} guesses={guesses} solved={solved} modelReady={modelReady}
          hintWords={hintWords} hintPhase={hintPhase} bhPhase={bhPhase} bhEnergy={bhEnergy}
          bhRevealedWord={bhRevealedWord} autoRotate={autoRotate} showSimilarity={showSimilarity} />
      </CanvasErrorBoundary>
      {tooltip}
    </div>
  );
}
