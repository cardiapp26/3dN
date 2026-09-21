import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { IcosahedronGeometry, LatheGeometry, Vector2, Vector3, type Group } from "three";
import { nerveById } from "@/lib/cranial-nerves";
import {
  NERVE_BRANCHES,
  NERVE_PATHS,
  NUCLEI,
  TARGETS,
  curveFrom,
  mirrorX,
  type Vec3,
} from "@/lib/anatomy-paths";
import { useStudio } from "@/lib/studio-store";

const BG = "#0b0d10";
const tmp = new Vector3();

function gyriGeometry(radius: number, detail = 4) {
  const geo = new IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const gyri =
      Math.sin(v.x * 7.4) * Math.sin(v.y * 6.2) * Math.cos(v.z * 5.6);
    const sulci = Math.sin(v.x * 15.1) * Math.cos(v.y * 12.4) * 0.035;
    v.setLength(radius + gyri * 0.075 + sulci);
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.5;
    v.x *= 0.93;
    v.y *= 0.86;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function skullGeometry() {
  const pts = [
    [0.02, 2.55],
    [0.55, 2.48],
    [1.15, 2.28],
    [1.65, 1.85],
    [1.92, 1.25],
    [2.02, 0.55],
    [1.98, 0.05],
    [1.78, -0.35],
    [1.52, -0.55],
    [1.48, -0.85],
    [1.35, -1.25],
    [1.18, -1.75],
    [1.05, -2.15],
    [0.85, -2.45],
    [0.4, -2.62],
    [0.02, -2.66],
  ].map(([r, y]) => new Vector2(r, y));
  return new LatheGeometry(pts, 48);
}

function Brain() {
  const visible = useStudio((s) => s.layers.brain);
  const selected = useStudio((s) => s.selectedId);
  const geo = useMemo(() => gyriGeometry(1.82, 4), []);
  const cereb = useMemo(() => gyriGeometry(1.05, 3), []);
  const dim = selected !== null;
  return (
    <group visible={visible}>
      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          geometry={geo}
          position={[side * 1.02, 1.08, 0.08]}
        >
          <meshStandardMaterial
            color="#c9a394"
            roughness={0.62}
            metalness={0.02}
            transparent
            opacity={dim ? 0.38 : 0.72}
          />
        </mesh>
      ))}
      <mesh geometry={cereb} position={[0, -0.28, -1.48]} scale={[1.35, 0.85, 0.95]}>
        <meshStandardMaterial
          color="#b49284"
          roughness={0.58}
          transparent
          opacity={dim ? 0.35 : 0.7}
        />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <mesh key={`t${side}`} position={[side * 1.48, 0.22, 0.42]} scale={[0.55, 0.7, 0.85]}>
          <sphereGeometry args={[0.85, 24, 18]} />
          <meshStandardMaterial color="#c3a092" roughness={0.65} transparent opacity={dim ? 0.35 : 0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Brainstem() {
  const visible = useStudio((s) => s.layers.brainstem);
  return (
    <group visible={visible}>
      <mesh position={[0, 0.32, -0.32]}>
        <cylinderGeometry args={[0.42, 0.48, 0.7, 20]} />
        <meshStandardMaterial color="#cbb09c" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.52, -0.22]} scale={[1, 1, 0.85]}>
        <sphereGeometry args={[0.72, 28, 20]} />
        <meshStandardMaterial color="#d4b7a4" roughness={0.48} />
      </mesh>
      <mesh position={[0, -1.55, -0.18]}>
        <cylinderGeometry args={[0.4, 0.32, 1.25, 18]} />
        <meshStandardMaterial color="#c4a892" roughness={0.52} />
      </mesh>
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.42, -1.62, 0.08]}>
          <sphereGeometry args={[0.18, 14, 12]} />
          <meshStandardMaterial color="#b99886" roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, -2.55, -0.16]}>
        <cylinderGeometry args={[0.28, 0.24, 1.1, 14]} />
        <meshStandardMaterial color="#c0a890" roughness={0.55} />
      </mesh>
    </group>
  );
}

function Skull() {
  const visible = useStudio((s) => s.layers.skull);
  const geo = useMemo(() => skullGeometry(), []);
  return (
    <group visible={visible}>
      <mesh geometry={geo} position={[0, 0.15, 0.15]}>
        <meshPhysicalMaterial
          color="#e6dcc8"
          roughness={0.42}
          metalness={0.02}
          transmission={0.22}
          thickness={0.55}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -3.15, 0.15]}>
        <cylinderGeometry args={[0.55, 0.48, 1.1, 16]} />
        <meshPhysicalMaterial color="#e6dcc8" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Eyes() {
  return (
    <group>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 1.62, 0.22, 2.42]}>
          <mesh>
            <sphereGeometry args={[0.28, 24, 18]} />
            <meshStandardMaterial color="#e8e4dc" roughness={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.16]}>
            <sphereGeometry args={[0.14, 20, 16]} />
            <meshStandardMaterial color="#5c6a58" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.24]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <meshStandardMaterial color="#1a1c1a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function NucleiDots() {
  const visible = useStudio((s) => s.layers.nuclei);
  const selected = useStudio((s) => s.selectedId);
  if (!visible) return null;
  return (
    <group>
      {NUCLEI.flatMap((n) => {
        const active = selected === n.id;
        const color = nerveById(n.id).color;
        return ([-1, 1] as const).map((side) => (
          <mesh key={`${n.id}-${side}`} position={[n.position[0] * side, n.position[1], n.position[2]]}>
            <sphereGeometry args={[active ? 0.08 : 0.045, 12, 10]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={active ? 1.2 : 0.25}
              transparent
              opacity={selected && !active ? 0.2 : 0.95}
            />
          </mesh>
        ));
      })}
    </group>
  );
}

function TargetMeshes() {
  const selected = useStudio((s) => s.selectedId);
  const layers = useStudio((s) => s.layers);
  const explode = useStudio((s) => s.explode);
  return (
    <group>
      {TARGETS.map((t) => {
        const related = selected !== null && t.nerveIds.includes(selected);
        const showLayer = t.kind === "organ" || t.kind === "gland" ? layers.organs : layers.muscles;
        const visible = related || (showLayer && selected === null);
        if (!visible && !related) return null;
        const color = related
          ? nerveById(t.nerveIds[0]).color
          : t.kind === "organ"
            ? "#a87870"
            : t.kind === "gland"
              ? "#c4b49a"
              : "#8a5a52";
        const pos: Vec3 = [
          t.position[0] + (explode && t.position[0] > 0.2 ? 0.35 : 0),
          t.position[1],
          t.position[2],
        ];
        return (
          <mesh key={t.id} position={pos} rotation={t.rotation ?? [0, 0, 0]} scale={t.scale}>
            <sphereGeometry args={[1, 18, 14]} />
            <meshStandardMaterial
              color={color}
              emissive={related ? color : "#000000"}
              emissiveIntensity={related ? 0.55 : 0}
              roughness={0.55}
              transparent
              opacity={related ? 0.92 : 0.45}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Tube({
  points,
  color,
  active,
  dim,
  progress,
  onSelect,
  onHover,
  label,
  showLabel,
}: {
  points: Vec3[];
  color: string;
  active: boolean;
  dim: boolean;
  progress: number;
  onSelect: () => void;
  onHover: (v: boolean) => void;
  label?: string;
  showLabel?: boolean;
}) {
  const curve = useMemo(() => curveFrom(points), [points]);
  const pulse = useRef<Group>(null);
  useFrame(() => {
    if (!pulse.current || !active) return;
    const p = curve.getPoint(Math.min(Math.max(progress, 0), 0.999));
    pulse.current.position.copy(p);
  });
  const mid = curve.getPoint(0.72);
  return (
    <group>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => onHover(false)}
      >
        <tubeGeometry args={[curve, 80, active ? 0.07 : 0.042, 8, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.85 : dim ? 0.04 : 0.18}
          roughness={0.32}
          metalness={0.08}
          transparent
          opacity={dim ? 0.16 : 0.98}
        />
      </mesh>
      {active && (
        <group ref={pulse}>
          <mesh>
            <sphereGeometry args={[0.09, 14, 12]} />
            <meshStandardMaterial color="#f4f1ea" emissive="#f4f1ea" emissiveIntensity={2} />
          </mesh>
        </group>
      )}
      {showLabel && label && (
        <Html position={[mid.x, mid.y, mid.z]} center distanceFactor={12} occlude={false}>
          <div className="nerve-chip">{label}</div>
        </Html>
      )}
    </group>
  );
}

function NerveSystem() {
  const selected = useStudio((s) => s.selectedId);
  const hovered = useStudio((s) => s.hoveredId);
  const layers = useStudio((s) => s.layers);
  const side = useStudio((s) => s.side);
  const progress = useStudio((s) => s.signalProgress);
  const showLabels = useStudio((s) => s.showLabels);
  const explode = useStudio((s) => s.explode);
  const setSelected = useStudio((s) => s.setSelected);
  const setHovered = useStudio((s) => s.setHovered);
  if (!layers.nerves) return null;

  const shift = (pts: Vec3[], dir: 1 | -1): Vec3[] =>
    explode ? pts.map(([x, y, z]) => [x + dir * 0.45, y, z]) : pts;

  return (
    <group>
      {NERVE_PATHS.map((path) => {
        const nerve = nerveById(path.id);
        const active = selected === path.id || hovered === path.id;
        const dim = selected !== null && selected !== path.id;
        const branches = NERVE_BRANCHES[path.id] ?? [];
        const sides: Array<1 | -1> =
          side === "left" ? [-1] : side === "right" ? [1] : [1, -1];
        return sides.map((dir) => {
          const pts = shift(dir === 1 ? path.points : mirrorX(path.points), dir);
          return (
            <group key={`${path.id}-${dir}`}>
              <Tube
                points={pts}
                color={nerve.color}
                active={active}
                dim={dim}
                progress={progress}
                onSelect={() => setSelected(path.id)}
                onHover={(v) => setHovered(v ? path.id : null)}
                label={`CN ${nerve.roman}`}
                showLabel={showLabels && active && dir === 1}
              />
              {branches.map((br, i) => (
                <Tube
                  key={i}
                  points={shift(dir === 1 ? br : mirrorX(br), dir)}
                  color={nerve.color}
                  active={active}
                  dim={dim}
                  progress={progress}
                  onSelect={() => setSelected(path.id)}
                  onHover={(v) => setHovered(v ? path.id : null)}
                />
              ))}
            </group>
          );
        });
      })}
    </group>
  );
}

function CameraRig({
  controls,
}: {
  controls: MutableRefObject<{ target: Vector3 } | null>;
}) {
  const { camera } = useThree();
  const selectedId = useStudio((s) => s.selectedId);
  const mode = useStudio((s) => s.mode);
  const anim = useRef({
    from: new Vector3(),
    to: new Vector3(3.8, -3.6, 12.6),
    fromT: new Vector3(),
    toT: new Vector3(0, -0.4, 0.2),
    t: 1,
  });

  useEffect(() => {
    const a = anim.current;
    a.from.copy(camera.position);
    a.fromT.copy(controls.current?.target ?? tmp.set(0, -0.5, 0.2));
    if (selectedId) {
      const n = nerveById(selectedId);
      a.to.set(...n.camera.position);
      a.toT.set(...n.camera.target);
    } else {
      a.to.set(3.8, -3.6, 12.6);
      a.toT.set(0, -0.4, 0.2);
    }
    if (mode === "signal" && selectedId === 10) {
      a.to.set(8.2, -3.8, 12.5);
      a.toT.set(0, -3.8, 0.4);
    }
    a.t = 0;
  }, [selectedId, mode, camera, controls]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const a = anim.current;
    if (a.t >= 1) return;
    a.t = Math.min(1, a.t + d * 1.15);
    const k = 1 - Math.pow(1 - a.t, 3);
    camera.position.lerpVectors(a.from, a.to, k);
    tmp.lerpVectors(a.fromT, a.toT, k);
    controls.current?.target.copy(tmp);
  });
  return null;
}

function SignalDriver() {
  const playing = useStudio((s) => s.playing);
  const speed = useStudio((s) => s.signalSpeed);
  const selected = useStudio((s) => s.selectedId);
  useFrame((_, dt) => {
    if (!playing || selected === null) return;
    const d = Math.min(dt, 0.1);
    useStudio.setState((s) => {
      const next = s.signalProgress + speed * d;
      return { signalProgress: next >= 1 ? 0 : next };
    });
  });
  return null;
}

function Lights() {
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 14, 32]} />
      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#d8d2c8", "#1c1814", 0.4]} />
      <directionalLight position={[6.5, 8, 5]} intensity={1.35} color="#f3ece2" />
      <directionalLight position={[-5, 2.5, -3]} intensity={0.32} color="#8ea0b0" />
      <spotLight position={[0, 10, 7]} intensity={0.55} angle={0.55} penumbra={0.7} color="#f6f1e8" />
    </>
  );
}

function ThoraxHint() {
  const selected = useStudio((s) => s.selectedId);
  const organs = useStudio((s) => s.layers.organs);
  if (!organs && selected !== 10) return null;
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => {
        const y = -4.15 - i * 0.38;
        return (
          <mesh key={i} position={[0, y, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.85 + i * 0.08, 0.03, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#cfc4b4" transparent opacity={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

export function AnatomyCanvas() {
  const controls = useRef<{ target: Vector3 } | null>(null);
  const setSelected = useStudio((s) => s.setSelected);

  return (
    <Canvas
      className="h-full w-full touch-none"
      dpr={[1, 1.75]}
      camera={{ position: [3.8, -3.6, 12.6], fov: 40, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => setSelected(null)}
    >
      <Lights />
      <CameraRig controls={controls} />
      <SignalDriver />
      <group>
        <Skull />
        <Brain />
        <Brainstem />
        <Eyes />
        <NucleiDots />
        <NerveSystem />
        <TargetMeshes />
        <ThoraxHint />
      </group>
      <ContactShadows position={[0, -8.4, 0]} opacity={0.35} scale={22} blur={2.4} far={12} />
      <OrbitControls
        ref={controls as never}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={24}
        maxPolarAngle={Math.PI * 0.92}
        target={[0, -0.4, 0.2]}
      />
    </Canvas>
  );
}
