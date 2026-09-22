import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type MutableRefObject,
} from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  ShaderMaterial,
  Vector3,
} from "three";
import { nerveById } from "@/lib/cranial-nerves";
import {
  currentEyePose,
  eomModelForNerve,
  EOM_APEX,
  eyeSigns,
  stepEyeMotion,
} from "@/lib/eye-motion";
import {
  DEFAULT_VIEW,
  EYE,
  NERVE_VIEWS,
  VAGUS_SIGNAL_VIEW,
  type Vec3,
} from "@/lib/anatomy-paths";
import type { OrganMaterial } from "@/lib/anatomy/neuro-models";
import {
  ANATOMY_MODELS,
  SOFT_MODELS,
  buildModelMesh,
  isSoftModel,
  type SoftMaterial,
  type SoftModel,
} from "@/lib/anatomy/soft-models";
import type { MeshReply, MeshRequest } from "@/lib/anatomy/models.worker";
import { useStudio } from "@/lib/studio-store";
import {
  EXPLODE_CM,
  Ganglia,
  NerveSystem,
  NucleiDots,
  VIEW_VARYINGS,
  vivid,
} from "./NerveSystem";
import { installRadialTwitch } from "./muscle-twitch";

/* ------------------------------------------------------------------ */
/* Organ meshes: built once per page in workers, cached across mounts  */
/* ------------------------------------------------------------------ */

const organStore = {
  geometries: new Map<string, BufferGeometry>(),
  failed: new Set<string>(),
  version: 0,
  started: false,
  listeners: new Set<() => void>(),
};

function toGeometry(positions: Float32Array, normals: Float32Array, indices: Uint32Array): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("normal", new BufferAttribute(normals, 3));
  g.setIndex(new BufferAttribute(indices, 1));
  g.computeBoundingSphere();
  return g;
}

function publishOrgan(id: string, geometry: BufferGeometry | null) {
  if (geometry) organStore.geometries.set(id, geometry);
  else organStore.failed.add(id);
  organStore.version += 1;
  organStore.listeners.forEach((l) => l());
}

function buildOnMainThread(ids: string[]) {
  const id = ids.shift();
  if (!id) return;
  setTimeout(() => {
    const model = ANATOMY_MODELS.find((m) => m.id === id);
    try {
      if (!model) throw new Error(`unknown organ "${id}"`);
      const mesh = buildModelMesh(model);
      publishOrgan(id, toGeometry(mesh.positions, mesh.normals, mesh.indices));
    } catch (err) {
      console.error(`[anatomy] ${id} mesh failed`, err);
      publishOrgan(id, null);
    }
    buildOnMainThread(ids);
  }, 0);
}

function startOrganBuild() {
  if (organStore.started) return;
  organStore.started = true;
  const queue = ANATOMY_MODELS.map((m) => m.id);
  const count = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
  const workers: Worker[] = [];
  try {
    for (let i = 0; i < count; i += 1) {
      workers.push(
        new Worker(new URL("../../lib/anatomy/models.worker.ts", import.meta.url), { type: "module" }),
      );
    }
  } catch (err) {
    console.error("[anatomy] workers unavailable, meshing on the main thread", err);
    workers.forEach((w) => w.terminate());
    buildOnMainThread(queue);
    return;
  }
  const inFlight = new Map<Worker, string>();
  const feed = (w: Worker) => {
    const id = queue.shift();
    if (!id) {
      inFlight.delete(w);
      w.terminate();
      return;
    }
    inFlight.set(w, id);
    w.postMessage({ id } satisfies MeshRequest);
  };
  for (const w of workers) {
    w.onmessage = (event: MessageEvent<MeshReply>) => {
      const reply = event.data;
      if (reply.ok) {
        publishOrgan(reply.id, toGeometry(reply.positions, reply.normals, reply.indices));
      } else {
        console.error(`[anatomy] ${reply.id} mesh failed: ${reply.error}`);
        publishOrgan(reply.id, null);
      }
      feed(w);
    };
    w.onerror = (event) => {
      console.error("[anatomy] mesh worker crashed", event.message);
      const lost = inFlight.get(w);
      inFlight.delete(w);
      w.terminate();
      if (lost) queue.unshift(lost);
      if (inFlight.size === 0) buildOnMainThread(queue.splice(0));
    };
    feed(w);
  }
}

function subscribeOrgans(listener: () => void) {
  organStore.listeners.add(listener);
  return () => {
    organStore.listeners.delete(listener);
  };
}

function useOrganProgress() {
  useSyncExternalStore(
    subscribeOrgans,
    () => organStore.version,
    () => 0,
  );
  useEffect(startOrganBuild, []);
  return {
    geometries: organStore.geometries,
    done: organStore.geometries.size + organStore.failed.size,
    total: ANATOMY_MODELS.length,
  };
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

/**
 * Ghost look: faint faces and bright silhouettes. Drawn after a depth-only
 * pre-pass (see `Organs`), so only the nearest surface is shaded and
 * sinuses, inner tables, sulci and back faces never stack into clutter.
 * Used for bone always and for the brain while a nerve is selected.
 */
function makeGhostMaterial(color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uOpacity: { value: 1 } },
    vertexShader: VIEW_VARYINGS,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec3 n = normalize(vNormal);
        float facing = abs(dot(n, normalize(vView)));
        float rim = pow(1.0 - facing, 2.0);
        float key = max(dot(n, normalize(vec3(0.35, 0.8, 0.5))), 0.0);
        vec3 col = uColor * (0.45 + 0.6 * key + 0.45 * rim);
        float alpha = uOpacity * (0.16 + 0.6 * rim + 0.18 * key);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

type OrganMaterials = Record<OrganMaterial, ShaderMaterial | MeshPhysicalMaterial> & {
  boneDepth: MeshBasicMaterial;
  brainGhost: ShaderMaterial;
};

function useOrganMaterials(): OrganMaterials {
  const mats = useMemo<OrganMaterials>(
    () => ({
      bone: makeGhostMaterial("#efe4cf"),
      brainGhost: makeGhostMaterial("#e8b4a8"),
      boneDepth: new MeshBasicMaterial({ colorWrite: false, transparent: true }),
      stem: new MeshPhysicalMaterial({
        color: "#d9b3a0",
        roughness: 0.5,
        sheen: 0.7,
        sheenRoughness: 0.45,
        sheenColor: new Color("#ffd6c4"),
        clearcoat: 0.3,
        clearcoatRoughness: 0.45,
      }),
      cortex: new MeshPhysicalMaterial({
        color: "#d7a99b",
        roughness: 0.58,
        sheen: 0.5,
        sheenColor: new Color("#f2c8bb"),
        clearcoat: 0.15,
        clearcoatRoughness: 0.5,
      }),
      cerebellum: new MeshPhysicalMaterial({
        color: "#c99488",
        roughness: 0.55,
        sheen: 0.5,
        sheenColor: new Color("#f0c2b4"),
        clearcoat: 0.15,
        clearcoatRoughness: 0.5,
      }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

/* ------------------------------------------------------------------ */
/* Organs (neuro and soft tissue) and eyes                             */
/* ------------------------------------------------------------------ */

/** Nerves whose central ends lie on the cerebrum rather than the brainstem. */
const FOREBRAIN_NERVES = new Set([1, 2]);

function Organs() {
  const { geometries } = useOrganProgress();
  const layers = useStudio((s) => s.layers);
  const selected = useStudio((s) => s.selectedId);
  const mats = useOrganMaterials();

  useEffect(() => {
    (mats.bone as ShaderMaterial).uniforms.uOpacity.value = selected !== null ? 0.55 : 1;
  }, [selected, mats]);

  return (
    <group>
      {ANATOMY_MODELS.map((model) => {
        const geometry = geometries.get(model.id);
        if (!geometry || isSoftModel(model)) return null;
        if (model.material === "bone") {
          // Transparent queue after nerves and effects (lungs come later):
          // depth first, then colour.
          return (
            <group key={model.id} visible={layers[model.layer]}>
              <mesh geometry={geometry} material={mats.boneDepth} renderOrder={40} />
              <mesh geometry={geometry} material={mats.bone} renderOrder={41} />
            </group>
          );
        }
        // The forebrain nerves (I, II) end on the brain itself, so it is shown
        // ghosted around them even when the brain layer is off.
        const visible =
          layers[model.layer] ||
          (model.id === "cerebrum" && selected !== null && FOREBRAIN_NERVES.has(selected));
        if (selected !== null && (model.material === "cortex" || model.material === "cerebellum")) {
          // Ghosted: depth pre-pass so only the nearest gyri are tinted. Drawn
          // before the bone pre-pass, which would otherwise hide the brain.
          return (
            <group key={model.id} visible={visible}>
              <mesh geometry={geometry} material={mats.boneDepth} renderOrder={38} />
              <mesh geometry={geometry} material={mats.brainGhost} renderOrder={39} />
            </group>
          );
        }
        return <mesh key={model.id} geometry={geometry} material={mats[model.material]} visible={visible} />;
      })}
      <SoftOrgans geometries={geometries} bone={mats.bone} boneDepth={mats.boneDepth} />
    </group>
  );
}

type SoftTemplate = Exclude<SoftMaterial, "bone">;

const SOFT_LOOK: Record<SoftTemplate, { color: string; sheen: string; roughness: number; clearcoat: number }> = {
  muscle: { color: "#a8473d", sheen: "#ffb4a4", roughness: 0.55, clearcoat: 0.25 },
  gland: { color: "#d9b486", sheen: "#fff0d6", roughness: 0.6, clearcoat: 0.1 },
  viscera: { color: "#c47d72", sheen: "#ffd0c4", roughness: 0.5, clearcoat: 0.35 },
  heart: { color: "#9c3a33", sheen: "#ff9e92", roughness: 0.45, clearcoat: 0.4 },
  artery: { color: "#c0443a", sheen: "#ffb0a4", roughness: 0.35, clearcoat: 0.5 },
  vein: { color: "#44659c", sheen: "#b8cdf2", roughness: 0.35, clearcoat: 0.5 },
  lung: { color: "#f0b8b0", sheen: "#fff0ec", roughness: 0.7, clearcoat: 0 },
  cartilage: { color: "#d5dad6", sheen: "#ffffff", roughness: 0.5, clearcoat: 0.2 },
  labyrinth: { color: "#efe2c6", sheen: "#ffffff", roughness: 0.4, clearcoat: 0.3 },
};

function makeSoftMaterial(kind: SoftTemplate): MeshPhysicalMaterial {
  const look = SOFT_LOOK[kind];
  const m = new MeshPhysicalMaterial({
    color: look.color,
    roughness: look.roughness,
    sheen: 0.55,
    sheenRoughness: 0.5,
    sheenColor: new Color(look.sheen),
    clearcoat: look.clearcoat,
    clearcoatRoughness: 0.5,
  });
  if (kind === "lung") {
    // Ghosted like bone (see the depth pre-pass in SoftOrgans) so the heart,
    // bronchi and vagus stay readable through it.
    m.transparent = true;
    m.opacity = 0.4;
    m.depthWrite = false;
  } else if (kind === "gland") {
    // Nerves run through the parotid; keep them visible inside it.
    m.transparent = true;
    m.opacity = 0.82;
  }
  return m;
}

/** When a nerve is selected only its targets stay, plus thoracic context for X. */
function softState(model: SoftModel, layers: Record<string, boolean>, selected: number | null) {
  const related = selected !== null && model.nerveIds.includes(selected);
  const context = model.nerveIds.length === 0;
  const visible =
    related || (layers[model.layer] && (selected === null || context)) || (context && selected === 10);
  return { related, visible };
}

function SoftOrgans({
  geometries,
  bone,
  boneDepth,
}: {
  geometries: Map<string, BufferGeometry>;
  bone: ShaderMaterial | MeshPhysicalMaterial;
  boneDepth: MeshBasicMaterial;
}) {
  const layers = useStudio((s) => s.layers);
  const selected = useStudio((s) => s.selectedId);
  const explode = useStudio((s) => s.explode);
  const mode = useStudio((s) => s.mode);
  const showLabels = useStudio((s) => s.showLabels);
  const mats = useMemo(() => {
    const built = new Map(
      SOFT_MODELS.filter((m) => m.material !== "bone").map((m) => [
        m.id,
        makeSoftMaterial(m.material as SoftTemplate),
      ]),
    );
    return built;
  }, []);
  const twitchById = useMemo(() => {
    const map = new Map<string, { value: number }>();
    for (const [id, apex] of Object.entries(EOM_APEX)) {
      const material = mats.get(id);
      if (material) map.set(id, installRadialTwitch(material, id, apex));
    }
    return map;
  }, [mats]);
  const lungDepth = useMemo(() => new MeshBasicMaterial({ colorWrite: false, transparent: true }), []);
  useEffect(
    () => () => {
      mats.forEach((m) => m.dispose());
      lungDepth.dispose();
    },
    [mats, lungDepth],
  );

  useEffect(() => {
    const tint = selected !== null ? vivid(nerveById(selected).color) : "#000000";
    for (const model of SOFT_MODELS) {
      const m = mats.get(model.id);
      if (!m) continue;
      const { related } = softState(model, layers, selected);
      m.emissive.set(related ? tint : "#000000");
      m.emissiveIntensity = related ? 0.35 : 0;
    }
  }, [selected, layers, mats]);

  return (
    <group>
      {SOFT_MODELS.map((model) => {
        const geometry = geometries.get(model.id);
        if (!geometry) return null;
        const { related, visible } = softState(model, layers, selected);
        if (!visible) return null;
        const halves = model.mirror ? ([1, -1] as const) : ([1] as const);
        const label =
          related && showLabels && mode === "innervation" && geometry.boundingSphere ? (
            <Html
              position={geometry.boundingSphere.center}
              center
              distanceFactor={18}
              occlude={false}
              zIndexRange={[5, 0]}
            >
              <div className="nerve-chip" style={{ fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>
                {model.label}
              </div>
            </Html>
          ) : null;
        return (
          <group key={model.id}>
            {halves.map((dir) => {
              const position: Vec3 = [explode && model.mirror ? dir * EXPLODE_CM : 0, 0, 0];
              const scale: Vec3 = [dir, 1, 1];
              if (model.material === "bone") {
                return (
                  <group key={dir} position={position} scale={scale}>
                    <mesh geometry={geometry} material={boneDepth} renderOrder={40} />
                    <mesh geometry={geometry} material={bone} renderOrder={41} />
                  </group>
                );
              }
              const material = mats.get(model.id);
              if (model.material === "lung") {
                return (
                  <group key={dir} position={position} scale={scale}>
                    <mesh geometry={geometry} material={lungDepth} renderOrder={50} />
                    <mesh geometry={geometry} material={material} renderOrder={51} />
                  </group>
                );
              }
              const twitch = twitchById.get(model.id);
              return (
                <mesh
                  key={dir}
                  geometry={geometry}
                  material={material}
                  position={position}
                  scale={scale}
                  onBeforeRender={
                    twitch
                      ? () => {
                          const state = useStudio.getState();
                          const owned = eomModelForNerve(state.selectedId) === model.id;
                          const shown = eyeSigns(state.side).includes(dir);
                          twitch.value = owned && shown ? currentEyePose().twitch : 0;
                        }
                      : undefined
                  }
                />
              );
            })}
            {label}
          </group>
        );
      })}
    </group>
  );
}

/** Nerves that start at or insert on the eyeball. */
const OCULAR_NERVES = new Set([2, 3, 4, 6]);

/** How far III swings the upper lid up, radians. Negative rotation opens. */
const LID_LIFT = 0.42;

function Eye({ sign }: { sign: 1 | -1 }) {
  const globe = useRef<Group>(null);
  const lid = useRef<Group>(null);
  const pupil = useRef<Mesh>(null);
  const [cx, cy, cz] = EYE.center;
  const r = EYE.radius;

  useFrame(() => {
    const pose = currentEyePose();
    const on = eyeSigns(useStudio.getState().side).includes(sign);
    const g = globe.current;
    if (g) g.rotation.set(on ? pose.pitch : 0, on ? pose.yaw * sign : 0, on ? pose.roll * sign : 0);
    const l = lid.current;
    if (l) l.rotation.x = -LID_LIFT * (on ? pose.lid : 0);
    const p = pupil.current;
    if (p) {
      const k = on ? pose.pupil : 1;
      p.scale.set(k, 1, k);
    }
  });

  return (
    <group position={[cx * sign, cy, cz]}>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[r, 48, 32]} />
          <meshPhysicalMaterial color="#f1ece4" roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.2} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[r * 1.004, 48, 12, 0, Math.PI * 2, 0, 0.47]} />
          <meshStandardMaterial color="#4d6e7c" roughness={0.55} />
        </mesh>
        <mesh ref={pupil} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[r * 1.008, 32, 8, 0, Math.PI * 2, 0, 0.19]} />
          <meshStandardMaterial color="#0c0d0e" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.8, 32, 16, 0, Math.PI * 2, 0, 0.95]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.16} roughness={0.05} clearcoat={1} depthWrite={false} />
        </mesh>
      </group>
      <group ref={lid}>
        <mesh>
          {/* Upper-lid shell: anterior (phi around +Z) and above the corneal centre. */}
          <sphereGeometry args={[r * 1.04, 28, 14, -1.05, 2.1, 0.72, 0.48]} />
          <meshStandardMaterial color="#d7b5a4" roughness={0.74} />
        </mesh>
      </group>
    </group>
  );
}

function Eyes() {
  const layers = useStudio((s) => s.layers);
  const selected = useStudio((s) => s.selectedId);
  const visible = layers.skull || layers.muscles || (selected !== null && OCULAR_NERVES.has(selected));
  return (
    <group visible={visible}>
      <Eye sign={1} />
      <Eye sign={-1} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera, signal clock, lighting                                      */
/* ------------------------------------------------------------------ */

const tmp = new Vector3();

function CameraRig({ controls }: { controls: MutableRefObject<{ target: Vector3 } | null> }) {
  const { camera, size } = useThree();
  const selectedId = useStudio((s) => s.selectedId);
  const mode = useStudio((s) => s.mode);
  const anim = useRef({
    from: new Vector3(),
    to: new Vector3(...DEFAULT_VIEW.position),
    fromT: new Vector3(),
    toT: new Vector3(...DEFAULT_VIEW.target),
    t: 1,
  });

  useEffect(() => {
    const a = anim.current;
    const view =
      mode === "signal" && selectedId === 10
        ? VAGUS_SIGNAL_VIEW
        : selectedId !== null
          ? (NERVE_VIEWS[selectedId] ?? DEFAULT_VIEW)
          : DEFAULT_VIEW;
    // Portrait viewports need more distance to fit the same anatomy.
    const aspect = size.width / Math.max(size.height, 1);
    const k = aspect < 1 ? Math.pow(1 / aspect, 0.8) : 1;
    a.from.copy(camera.position);
    a.fromT.copy(controls.current?.target ?? tmp.set(...DEFAULT_VIEW.target));
    a.toT.set(...view.target);
    a.to.set(...view.position).sub(a.toT).multiplyScalar(k).add(a.toT);
    a.t = 0;
  }, [selectedId, mode, camera, controls, size.width, size.height]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (a.t >= 1) return;
    a.t = Math.min(1, a.t + Math.min(dt, 0.1) * 1.1);
    const e = 1 - Math.pow(1 - a.t, 3);
    camera.position.lerpVectors(a.from, a.to, e);
    tmp.lerpVectors(a.fromT, a.toT, e);
    controls.current?.target.copy(tmp);
  });
  return null;
}

function SignalDriver() {
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.1);
    const state = useStudio.getState();
    if (state.playing && state.selectedId !== null) {
      const next = state.signalProgress + state.signalSpeed * step;
      useStudio.setState({ signalProgress: next >= 1 ? 0 : next });
    }
    const now = useStudio.getState();
    stepEyeMotion(now.selectedId, now.signalProgress, step);
  });
  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight args={["#dfe6f2", "#1a1512", 0.35]} />
      <directionalLight position={[18, 26, 22]} intensity={2.1} color="#fff1e2" />
      <directionalLight position={[-22, 8, -14]} intensity={1.1} color="#9fb8d6" />
      <directionalLight position={[0, -20, 18]} intensity={0.3} color="#d9c7b8" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff3e4" position={[0, 12, 10]} scale={[20, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#9cc0ff" position={[-18, 2, -8]} scale={[10, 18, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[16, -4, 12]} scale={6} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

function BuildProgress() {
  const { done, total } = useOrganProgress();
  if (done >= total) return null;
  return (
    <div className="pointer-events-none absolute bottom-9 left-3 rounded-full bg-surface/80 px-3 py-1 text-xs text-muted shadow-[var(--shadow-border)]">
      3B modeller hazırlanıyor · {done}/{total}
    </div>
  );
}

export function AnatomyCanvas() {
  const controls = useRef<{ target: Vector3 } | null>(null);
  const setSelected = useStudio((s) => s.setSelected);

  return (
    <div
      className="relative h-full w-full"
      style={{
        background: "radial-gradient(120% 90% at 50% 32%, #1b2331 0%, #0e1218 55%, #07090c 100%)",
      }}
    >
      <Canvas
        className="h-full w-full touch-none"
        dpr={[1, 2]}
        camera={{ position: DEFAULT_VIEW.position, fov: 32, near: 0.5, far: 400 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Lights />
        <CameraRig controls={controls} />
        <SignalDriver />
        <Organs />
        <Eyes />
        <Ganglia />
        <NucleiDots />
        <NerveSystem />
        <OrbitControls
          ref={controls as never}
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={140}
          target={DEFAULT_VIEW.target}
        />
      </Canvas>
      <BuildProgress />
    </div>
  );
}
