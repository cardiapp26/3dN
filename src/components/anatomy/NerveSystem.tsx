/**
 * Cranial nerve layer: tapered nerve tubes with hover glow and a travelling
 * action potential, plus ganglia and brainstem nuclei. Shared with the rest
 * of the scene: the nerve colour lift (`vivid`), the split-view offset and
 * the view-space shader varyings.
 */
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  type CatmullRomCurve3,
  type Mesh,
} from "three";
import { nerveById } from "@/lib/cranial-nerves";
import {
  GANGLIA,
  NERVE_PATHS,
  NUCLEI,
  curveFrom,
  mirrorX,
  type NervePath,
  type Vec3,
} from "@/lib/anatomy-paths";
import { useStudio } from "@/lib/studio-store";
import { isDragOrbit } from "@/lib/gesture";

/** Lateral offset of each half in the split ("explode") view, cm. */
export const EXPLODE_CM = 1.2;
/** Nerves are drawn slimmer than life so crossings stay readable. */
const NERVE_SCALE = 0.72;
/** Below this height the vagus runs in the thorax, shown with the organs. */
const THORAX_Y = -15.5;

const vividCache = new Map<string, string>();
/** The palette is tuned for the UI; lift it a little against the dark scene. */
export function vivid(hex: string): string {
  let out = vividCache.get(hex);
  if (!out) {
    out = `#${new Color(hex).offsetHSL(0, 0.14, 0.06).getHexString()}`;
    vividCache.set(hex, out);
  }
  return out;
}

/** Ganglion ellipsoids are authored with their long axis on +x. */
const X_AXIS = new Vector3(1, 0, 0);

/** Vertex stage shared by the view-dependent (fresnel) shaders. */
export const VIEW_VARYINGS = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec2 vUv;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`;

/** Soft additive halo around a tube, brightest where it faces the camera. */
function makeGlowMaterial(color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uStrength: { value: 0.55 } },
    vertexShader: VIEW_VARYINGS,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float f = abs(dot(normalize(vNormal), normalize(vView)));
        float a = pow(f, 2.5) * uStrength;
        gl_FragColor = vec4(uColor * a, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/** Travelling action potential: bright front plus a fading wake along uv.x. */
function makeSignalMaterial(color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uHead: { value: -1 },
      uLength: { value: 1 },
    },
    vertexShader: VIEW_VARYINGS,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uHead;
      uniform float uLength;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec2 vUv;
      void main() {
        float d = (vUv.x - uHead) * uLength;
        float front = exp(-(d * d) / 0.12);
        float wake = d < 0.0 ? exp(d / 2.2) * 0.6 : 0.0;
        float edge = pow(abs(dot(normalize(vNormal), normalize(vView))), 0.6);
        float a = (front + wake) * edge;
        if (a < 0.003) discard;
        vec3 col = mix(uColor, vec3(1.0), 0.55 * front) * (1.4 + 2.6 * front);
        gl_FragColor = vec4(col * a, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

/** Invisible fat tube that widens the click target of thin nerves. */
const HIT_MATERIAL = new MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 });

function sideOffsets(side: "both" | "left" | "right"): Array<1 | -1> {
  return side === "left" ? [-1] : side === "right" ? [1] : [1, -1];
}

export function Ganglia() {
  const layers = useStudio((s) => s.layers);
  const selected = useStudio((s) => s.selectedId);
  const hovered = useStudio((s) => s.hoveredId);
  const side = useStudio((s) => s.side);
  const explode = useStudio((s) => s.explode);
  const orient = useMemo(
    () => GANGLIA.map((g) => new Quaternion().setFromUnitVectors(X_AXIS, new Vector3(...g.axis).normalize())),
    [],
  );
  if (!layers.nerves) return null;
  return (
    <group>
      {GANGLIA.flatMap((g, i) => {
        const nerve = nerveById(g.nerveId);
        const active = selected === g.nerveId || hovered === g.nerveId;
        const dim = selected !== null && selected !== g.nerveId;
        return sideOffsets(side).map((dir) => {
          const q = orient[i].clone();
          if (dir === -1) q.set(q.x, -q.y, -q.z, q.w);
          const shift = explode ? dir * EXPLODE_CM : 0;
          return (
            <mesh
              key={`${g.label}-${dir}`}
              position={[g.position[0] * dir + shift, g.position[1], g.position[2]]}
              quaternion={q}
              scale={g.radii}
            >
              <sphereGeometry args={[1, 24, 16]} />
              <meshStandardMaterial
                color={vivid(nerve.color)}
                emissive={vivid(nerve.color)}
                emissiveIntensity={active ? 0.9 : 0.25}
                roughness={0.4}
                transparent
                opacity={dim ? 0.15 : 1}
              />
            </mesh>
          );
        });
      })}
    </group>
  );
}

export function NucleiDots() {
  const visible = useStudio((s) => s.layers.nuclei);
  const selected = useStudio((s) => s.selectedId);
  if (!visible) return null;
  return (
    <group renderOrder={10}>
      {NUCLEI.flatMap((n) => {
        const active = selected === n.id;
        const color = vivid(nerveById(n.id).color);
        return ([-1, 1] as const).map((dir) => (
          <mesh key={`${n.id}-${dir}`} position={[n.position[0] * dir, n.position[1], n.position[2]]} renderOrder={10}>
            <sphereGeometry args={[active ? 0.2 : 0.13, 16, 12]} />
            <meshBasicMaterial
              color={color}
              transparent
              depthTest={false}
              opacity={selected !== null && !active ? 0.18 : active ? 1 : 0.75}
            />
          </mesh>
        ));
      })}
    </group>
  );
}

/** Tube whose radius tapers linearly from r0 to r1 along the curve. */
function taperedTube(curve: CatmullRomCurve3, r0: number, r1: number, segments: number, radial = 10) {
  const geo = new TubeGeometry(curve, segments, 1, radial, false);
  const pos = geo.attributes.position as BufferAttribute;
  const c = new Vector3();
  const p = new Vector3();
  for (let i = 0; i <= segments; i += 1) {
    curve.getPointAt(i / segments, c);
    const r = r0 + ((r1 - r0) * i) / segments;
    for (let j = 0; j <= radial; j += 1) {
      const k = i * (radial + 1) + j;
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, p.x, p.y, p.z);
    }
  }
  pos.needsUpdate = true;
  geo.computeBoundingSphere();
  return geo;
}

type BuiltCourse = {
  curve: CatmullRomCurve3;
  length: number;
  /** Distance on the signal clock at which this course starts, cm. */
  offset: number;
  core: TubeGeometry;
  hit: TubeGeometry;
  glow: TubeGeometry;
  pulse: TubeGeometry;
};

function buildNerve(path: NervePath, dir: 1 | -1, shift: number) {
  const place = (pts: Vec3[]): Vec3[] =>
    (dir === 1 ? pts : mirrorX(pts)).map(([x, y, z]) => [x + shift, y, z]);
  const courses: BuiltCourse[] = [];
  const samples: Vector3[][] = [];
  const drawn = [path.main, ...path.branches.filter((b) => b.side === undefined || b.side === dir)];
  drawn.forEach((course, idx) => {
    const pts = place(course.points);
    const curve = curveFrom(pts);
    const length = curve.getLength();
    let offset = 0;
    if (idx > 0) {
      // Start where this branch leaves an earlier course (main or trunk).
      const start = new Vector3(...pts[0]);
      let best = 0.35;
      samples.forEach((ring, ci) => {
        ring.forEach((q, si) => {
          const d = q.distanceTo(start);
          if (d < best) {
            best = d;
            offset = courses[ci].offset + (si / (ring.length - 1)) * courses[ci].length;
          }
        });
      });
    }
    const r = path.radius * NERVE_SCALE;
    const r0 = idx === 0 ? r : r * 0.72;
    const r1 = idx === 0 ? r * 0.6 : r * 0.42;
    const segments = Math.min(220, Math.max(24, Math.round(length * 7)));
    samples.push(curve.getSpacedPoints(80));
    courses.push({
      curve,
      length,
      offset,
      core: taperedTube(curve, r0, r1, segments),
      hit: taperedTube(curve, Math.max(r0 * 1.5, 0.14), Math.max(r1 * 1.5, 0.14), Math.min(segments, 60), 6),
      glow: taperedTube(curve, r0 * 2.8, r1 * 2.8, segments, 12),
      pulse: taperedTube(curve, r0 * 1.4, r1 * 1.4, segments, 12),
    });
  });
  const total = Math.max(...courses.map((c) => c.offset + c.length));
  return { courses, total, labelAt: courses[0].curve.getPointAt(0.55) };
}

function NerveCourse({ path, dir }: { path: NervePath; dir: 1 | -1 }) {
  const nerve = nerveById(path.id);
  const color = vivid(nerve.color);
  const selected = useStudio((s) => s.selectedId);
  const hovered = useStudio((s) => s.hoveredId);
  const explode = useStudio((s) => s.explode);
  const showLabels = useStudio((s) => s.showLabels);
  const side = useStudio((s) => s.side);
  const isLabelSide = side === "left" ? dir === -1 : dir === 1;
  const setSelected = useStudio((s) => s.setSelected);
  const setHovered = useStudio((s) => s.setHovered);
  const active = selected === path.id || hovered === path.id;
  const dim = selected !== null && selected !== path.id;
  const signalling = selected === path.id;

  const built = useMemo(() => buildNerve(path, dir, explode ? dir * EXPLODE_CM : 0), [path, dir, explode]);
  useEffect(
    () => () =>
      built.courses.forEach((c) => {
        c.core.dispose();
        c.hit.dispose();
        c.glow.dispose();
        c.pulse.dispose();
      }),
    [built],
  );

  const coreMat = useMemo(
    () => new MeshStandardMaterial({ color, emissive: color, roughness: 0.35, metalness: 0.05 }),
    [color],
  );
  const glowMat = useMemo(() => makeGlowMaterial(color), [color]);
  const pulseMats = useMemo(
    () => (signalling ? built.courses.map(() => makeSignalMaterial(color)) : []),
    [signalling, built, color],
  );
  useEffect(() => () => coreMat.dispose(), [coreMat]);
  useEffect(() => () => glowMat.dispose(), [glowMat]);
  useEffect(() => () => pulseMats.forEach((m) => m.dispose()), [pulseMats]);

  useEffect(() => {
    coreMat.emissiveIntensity = active ? 0.85 : dim ? 0.04 : 0.28;
    // Opaque unless dimmed, so ghosted organs and glands blend over nerves.
    coreMat.transparent = dim;
    coreMat.opacity = dim ? 0.14 : 1;
    coreMat.depthWrite = !dim;
    coreMat.needsUpdate = true;
  }, [coreMat, active, dim]);

  const sparks = useRef<(Mesh | null)[]>([]);
  useFrame(() => {
    if (!signalling) return;
    const { signalProgress, playing } = useStudio.getState();
    const s = signalProgress * built.total;
    built.courses.forEach((c, i) => {
      const local = (s - c.offset) / c.length;
      const mat = pulseMats[i];
      if (mat) {
        mat.uniforms.uHead.value = playing ? local : -1;
        mat.uniforms.uLength.value = c.length;
      }
      const spark = sparks.current[i];
      if (spark) {
        const on = playing && local >= 0 && local <= 1;
        spark.visible = on;
        if (on) c.curve.getPointAt(local, spark.position);
      }
    });
  });

  return (
    <group>
      {built.courses.map((c, i) => (
        <group key={i}>
          <mesh geometry={c.core} material={coreMat} />
          <mesh
            geometry={c.hit}
            material={HIT_MATERIAL}
            onClick={(e) => {
              e.stopPropagation();
              if (isDragOrbit(e)) return;
              setSelected(selected === path.id ? null : path.id);
            }}
            onPointerOver={(e) => {
              // Ignore hover while mouse buttons are held down (user is orbiting/dragging)
              if (e.nativeEvent.buttons > 0) return;
              // If another nerve is already selected, don't flash other nerves on accidental hover
              if (selected !== null && selected !== path.id) return;
              e.stopPropagation();
              setHovered(path.id);
            }}
            onPointerOut={() => setHovered(null)}
          />
          {active && <mesh geometry={c.glow} material={glowMat} />}
          {signalling && pulseMats[i] && <mesh geometry={c.pulse} material={pulseMats[i]} />}
          {signalling && (
            <mesh
              ref={(m) => {
                sparks.current[i] = m;
              }}
              visible={false}
            >
              <sphereGeometry args={[Math.max(path.radius * NERVE_SCALE * 0.9, 0.07), 12, 8]} />
              <meshBasicMaterial color="#fffaf0" toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
      {showLabels && active && isLabelSide && (
        <Html position={built.labelAt} center distanceFactor={18} occlude={false} zIndexRange={[5, 0]}>
          <div className="nerve-chip">
            CN {nerve.roman} <span style={{ fontStyle: "italic", textTransform: "none" }}>{nerve.nameLa}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function clipToNeck(points: Vec3[]): Vec3[] {
  return points.filter((p) => p[1] >= THORAX_Y);
}

/** Courses trimmed at the thoracic inlet, for when the organs are hidden. */
const NECK_PATHS: NervePath[] = NERVE_PATHS.map((path) => ({
  ...path,
  main: { ...path.main, points: clipToNeck(path.main.points) },
  branches: path.branches
    .map((b) => ({ ...b, points: clipToNeck(b.points) }))
    .filter((b) => b.points.length >= 2),
}));

export function NerveSystem() {
  const visible = useStudio((s) => s.layers.nerves);
  const organs = useStudio((s) => s.layers.organs);
  const selected = useStudio((s) => s.selectedId);
  const side = useStudio((s) => s.side);
  if (!visible) return null;
  const paths = organs || selected === 10 ? NERVE_PATHS : NECK_PATHS;
  return (
    <group>
      {paths.flatMap((path) =>
        sideOffsets(side).map((dir) => <NerveCourse key={`${path.id}-${dir}`} path={path} dir={dir} />),
      )}
    </group>
  );
}
