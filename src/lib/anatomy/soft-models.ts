/**
 * Sculpted muscles, viscera, glands, vessels and thoracic skeleton, plus the
 * registry of every mesh the scene builds.
 *
 * Same frame and units as `sdf.ts` (cm; +x patient left, +y up, +z
 * anterior). A model marked `mirror` is modelled on the +x side only and
 * meshed over a +x grid; the scene draws its mirrored twin, so bilateral
 * muscles cost half the meshing. Each model lists the nerves whose
 * selection highlights it (empty for context structures).
 */
import {
  NEURO_MODELS,
  buildOrganMesh,
  cranialVaultSdf,
  type OrganModel,
} from "./neuro-models.ts";
import {
  band,
  bounded,
  capsule,
  chain,
  createNoise3,
  csg,
  ellipsoid,
  group,
  mirrorX,
  mix,
  orientedEllipsoid,
  profile,
  roundCone,
  smax,
  smin,
  smoothstep,
  sphere,
  torus,
  type GridSpec,
  type MeshData,
  type Sdf,
  type Shape,
  type Vec3,
} from "./sdf.ts";

export type SoftMaterial =
  | "muscle"
  | "gland"
  | "viscera"
  | "heart"
  | "artery"
  | "vein"
  | "lung"
  | "cartilage"
  | "labyrinth"
  | "bone";

export type SoftModel = {
  id: string;
  label: string;
  layer: "muscles" | "organs";
  material: SoftMaterial;
  /** Nerves whose selection highlights this model; empty for context. */
  nerveIds: number[];
  /** Grid covers the +x side only; the scene draws a mirrored twin. */
  mirror: boolean;
  grid: GridSpec;
  build: () => { sdf: Sdf; coarse?: Sdf };
};

export type AnatomyModel = OrganModel | SoftModel;

const UP: Vec3 = [0, 1, 0];
const LATERAL: Vec3 = [1, 0, 0];
const FORWARD: Vec3 = [0, 0, 1];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function normalize(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Side axis exactly as `band()` builds it, so ridges follow the band. */
function sideAxis(axis: Vec3, upHint: Vec3): Vec3 {
  const s = cross(upHint, normalize(axis));
  return Math.hypot(s[0], s[1], s[2]) < 1e-6 ? normalize(cross(FORWARD, axis)) : normalize(s);
}

function at(values: number | readonly number[], i: number): number {
  return typeof values === "number" ? values : values[i];
}

/** Tapered flat strap through several points (muscle bellies, sheets). */
function bandChain(
  points: readonly Vec3[],
  widths: number | readonly number[],
  thickness: number | readonly number[],
  upHint: Vec3,
  k = 0.12,
): Shape {
  const parts: Shape[] = [];
  for (let i = 0; i + 1 < points.length; i += 1) {
    parts.push(
      band(
        points[i],
        points[i + 1],
        [at(widths, i), at(widths, i + 1)],
        [at(thickness, i), at(thickness, i + 1)],
        upHint,
      ),
    );
  }
  return group(k, ...parts);
}

/** Fine ridges running along `axis`: reads as muscle fibre direction. */
function fibres(f: Sdf, axis: Vec3, upHint: Vec3, freq: number, amp: number): Sdf {
  const [sx, sy, sz] = sideAxis(axis, upHint);
  return (x, y, z) => {
    const d = f(x, y, z);
    if (d > 0.25 || d < -0.25) return d;
    return d + amp * Math.sin((x * sx + y * sy + z * sz) * freq);
  };
}

/** Lobulated glandular surface. */
function lobules(f: Sdf, seed: number, freq: number, amp: number): Sdf {
  const noise = createNoise3(seed);
  return (x, y, z) => {
    const d = f(x, y, z);
    if (d > 0.3 || d < -0.3) return d;
    return d + amp * noise(x * freq, y * freq, z * freq);
  };
}

/** Both sides of a shape modelled at +x, keeping a bounding sphere. */
function mirrored(s: Shape): Shape {
  const f: Shape = mirrorX(s);
  if (s.bound) {
    const [cx, cy, cz, r] = s.bound;
    f.bound = [0, cy, cz, Math.abs(cx) + r];
  }
  return f;
}

/**
 * Flat elliptical ring (sphincter muscles): radii rs/rv in the ring plane,
 * radial half-width rq, half-thickness rh along the axis. `bend` curves the
 * ring back with |x| so it follows the dental arch; concentric ridges hint
 * at the circular fibres.
 */
function flatRing(c: Vec3, axis: Vec3, rs: number, rv: number, rq: number, rh: number, bend = 0): Sdf {
  const n = normalize(axis);
  const s = sideAxis(n, UP);
  const v = cross(n, s);
  const m = Math.min(rq, rh);
  return (x, y, z) => {
    const dx = x - c[0];
    const dy = y - c[1];
    const dz = z - c[2] + bend * x * x;
    const a = dx * s[0] + dy * s[1] + dz * s[2];
    const b = dx * v[0] + dy * v[1] + dz * v[2];
    const h = dx * n[0] + dy * n[1] + dz * n[2];
    const rad = Math.hypot(a, b);
    const ring = rad > 1e-6 ? 1 / Math.hypot(a / rad / rs, b / rad / rv) : rs;
    const q = (rad - ring) / rq;
    const d = (Math.hypot(q, h / rh) - 1) * m;
    return d > 0.2 ? d : d + 0.01 * Math.sin((rad - ring) * 26);
  };
}

/** Catmull-Rom resampling so bony arcs (ribs, clavicles) curve smoothly. */
function smoothPath(points: readonly Vec3[], radii: readonly number[], perSegment: number): { pts: Vec3[]; rs: number[] } {
  const pts: Vec3[] = [];
  const rs: number[] = [];
  const n = points.length;
  for (let i = 0; i + 1 < n; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, n - 1)];
    for (let j = 0; j < perSegment; j += 1) {
      const t = j / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const c: Vec3 = [0, 1, 2].map(
        (a) =>
          0.5 *
          (2 * p1[a] +
            (-p0[a] + p2[a]) * t +
            (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 +
            (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3),
      ) as unknown as Vec3;
      pts.push(c);
      rs.push(mix(radii[i], radii[i + 1], t));
    }
  }
  pts.push(points[n - 1]);
  rs.push(radii[n - 1]);
  return { pts, rs };
}

function smoothUnionAll(k: number, ...fs: Sdf[]): Sdf {
  return (x, y, z) => {
    let d = fs[0](x, y, z);
    for (let i = 1; i < fs.length; i += 1) d = smin(d, fs[i](x, y, z), k);
    return d;
  };
}

/* ------------------------------------------------------------------ */
/* Extraocular muscles (annulus of Zinn -> globe)                      */
/* ------------------------------------------------------------------ */

const RECTUS_W = [0.22, 0.36, 0.45, 0.42];

function oculomotorMuscles(): Sdf {
  return group(
    0.06,
    bandChain([[1.55, 2.25, 4.35], [2.4, 2.62, 5.6], [3.15, 2.64, 6.7], [3.2, 2.44, 7.55]], RECTUS_W, 0.11, UP),
    bandChain([[1.55, 1.65, 4.35], [2.4, 0.98, 5.6], [3.15, -0.02, 6.7], [3.2, 0.16, 7.55]], RECTUS_W, 0.11, UP),
    bandChain([[1.3, 1.95, 4.35], [1.72, 1.62, 5.6], [1.93, 1.32, 6.75], [2.1, 1.3, 7.58]], RECTUS_W, 0.11, LATERAL),
    bandChain([[2.35, 0.28, 8.0], [3.3, 0.02, 7.25], [4.05, 0.45, 6.5], [4.2, 0.78, 6.35]], [0.2, 0.3, 0.32, 0.28], 0.1, UP),
    bandChain([[1.6, 2.47, 4.35], [2.55, 2.92, 5.8], [3.2, 3.0, 7.3], [3.25, 2.78, 8.25]], [0.2, 0.35, 0.5, 0.55], 0.07, UP),
  );
}

function trochlearMuscle(): Sdf {
  return group(
    0.05,
    roundCone([1.35, 2.32, 4.35], [2.1, 2.86, 7.75], 0.13, 0.12),
    torus([2.1, 2.86, 7.95], [1, 0, 0.2], 0.17, 0.17, 0.05),
    chain([[2.1, 2.86, 7.9], [2.7, 2.62, 7.35], [3.3, 2.52, 6.85], [3.68, 2.28, 6.64]], 0.05),
  );
}

function abducensMuscle(): Sdf {
  return bandChain([[1.8, 1.95, 4.35], [3.3, 1.62, 5.4], [4.48, 1.32, 6.72], [4.3, 1.3, 7.58]], RECTUS_W, 0.11, LATERAL);
}

/* ------------------------------------------------------------------ */
/* Muscles of mastication                                              */
/* ------------------------------------------------------------------ */

function masseter(): Sdf {
  const a: Vec3 = [5.95, -0.85, 4.1];
  const b: Vec3 = [5.55, -6.0, 3.0];
  const superficial = fibres(band(a, b, [1.25, 1.15], [0.38, 0.45], LATERAL), [b[0] - a[0], b[1] - a[1], b[2] - a[2]], LATERAL, 14, 0.02);
  const deep = band([5.5, -0.6, 2.6], [5.3, -4.5, 2.6], 0.7, 0.3, LATERAL);
  return (x, y, z) => smin(superficial(x, y, z), deep(x, y, z), 0.3);
}

/** Fan over the temporal fossa converging on a tendon to the coronoid. */
function temporalis(): Sdf {
  const vault = cranialVaultSdf();
  const fan: Sdf = (x, y, z) => {
    const e = vault(x, y, z);
    const th = mix(0.85, 0.22, smoothstep(0.5, 6.3, y));
    const shell = Math.abs(e - th * 0.5 - 0.03) - th * 0.5;
    const region = (Math.hypot((z - 0.4) / 5.3, (y - 2.4) / 4.6) - 1) * 4.6;
    let d = smax(shell, region, 0.3);
    d = smax(d, -0.35 - y, 0.3);
    return smax(d, 4.3 - x, 0.2);
  };
  const tendon = band([5.85, 0.7, 3.0], [4.45, -0.85, 3.45], [0.9, 0.35], [0.35, 0.25], LATERAL);
  return (x, y, z) => {
    const d = smin(fan(x, y, z), tendon(x, y, z), 0.45);
    if (d > 0.25 || d < -0.25) return d;
    // Fibres radiate from the coronoid process.
    return d + 0.018 * Math.sin(Math.atan2(y + 0.9, z - 3.45) * 42);
  };
}

/* ------------------------------------------------------------------ */
/* Muscles of facial expression                                        */
/* ------------------------------------------------------------------ */

function frontalis(): Sdf {
  const vault = cranialVaultSdf();
  return (x, y, z) => {
    const shell = Math.abs(vault(x, y, z) - 0.32) - 0.09;
    let region = smax(3.85 - y, y - 9.2 + 0.09 * x * x, 0.8);
    region = smax(region, smax(0.35 - x, x - 4.3, 0.8), 0.8);
    region = smax(region, 4.5 - z, 0.4);
    const d = smax(shell, region, 0.25);
    return d > 0.25 || d < -0.25 ? d : d + 0.012 * Math.sin(x * 16);
  };
}

function orbicularisOculi(): Sdf {
  return flatRing([3.3, 1.35, 8.85], [0.28, 0, 1], 1.8, 1.55, 0.78, 0.06);
}

function orbicularisOris(): Sdf {
  return flatRing([0, -6.1, 9.7], FORWARD, 1.75, 0.8, 0.62, 0.12, 0.2);
}

function zygomaticus(): Sdf {
  const a: Vec3 = [5.15, -0.75, 7.85];
  const b: Vec3 = [2.4, -5.85, 9.55];
  const up: Vec3 = [0.55, 0, 0.85];
  return fibres(band(a, b, [0.3, 0.25], 0.11, up), [b[0] - a[0], b[1] - a[1], b[2] - a[2]], up, 18, 0.012);
}

function buccinator(): Sdf {
  return bandChain(
    [[3.55, -5.4, 4.4], [3.7, -5.6, 6.2], [3.1, -5.9, 8.0], [2.35, -6.05, 9.0]],
    [0.95, 0.9, 0.75, 0.5],
    0.1,
    LATERAL,
  );
}

/* ------------------------------------------------------------------ */
/* Neck muscles (XI)                                                   */
/* ------------------------------------------------------------------ */

function sternocleidomastoid(): Sdf {
  const belly = bandChain(
    [[4.95, -2.6, -0.9], [4.6, -8.0, 1.7], [3.6, -13.0, 3.8], [2.7, -17.0, 4.8]],
    [0.55, 1.05, 1.0, 0.8],
    [0.4, 0.45, 0.4, 0.35],
    LATERAL,
  );
  const sternal = band([2.7, -17.0, 4.8], [1.4, -19.1, 5.5], 0.45, 0.3, LATERAL);
  const clavicular = band([3.1, -16.6, 4.4], [5.0, -17.9, 4.3], 0.6, 0.25, LATERAL);
  return fibres(group(0.35, belly, sternal, clavicular), [-2.3, -14.4, 5.7], LATERAL, 12, 0.02);
}

function trapezius(): Sdf {
  return group(
    0.6,
    bandChain(
      [[1.4, -1.2, -10.2], [4.2, -8.5, -7.4], [8.8, -14.0, -5.3], [14.0, -16.9, -1.9]],
      [0.9, 2.0, 2.6, 1.1],
      0.28,
      [0, 0.25, -1],
    ),
    bandChain([[0.4, -15.6, -8.0], [7.0, -16.6, -6.3], [13.2, -17.3, -2.6]], [1.3, 1.4, 0.9], 0.28, [0, 0.3, -1]),
    band([0.35, -1.4, -10.1], [0.35, -15.6, -8.0], 0.55, 0.26, [0, 0.1, -1]),
  );
}

/* ------------------------------------------------------------------ */
/* Tongue, pharynx, airway, oesophagus                                 */
/* ------------------------------------------------------------------ */

function tongue(): Sdf {
  const noise = createNoise3(41);
  const body = orientedEllipsoid([0, -6.55, 5.6], [0, 0.08, 1], [3.0, 2.1, 1.05]);
  const root = roundCone([0, -7.0, 3.4], [0, -8.55, 3.5], 1.35, 0.8);
  const genioglossus = roundCone([0, -7.3, 5.2], [0, -8.1, 7.7], 1.0, 0.35);
  const medianSulcus = capsule([0, -5.45, 7.9], [0, -5.55, 4.1], 0.12);
  const solid = csg(body, [
    ["+", root, 0.8],
    ["+", genioglossus, 0.6],
    ["-", medianSulcus, 0.1],
  ]);
  return (x, y, z) => {
    const d = solid(x, y, z);
    if (y < -6.2 || d > 0.2 || d < -0.2) return d;
    return d + 0.02 * noise(x * 4.5, y * 4.5, z * 4.5);
  };
}

/** Constrictor sheet: posterior and lateral walls, open to mouth and nose. */
function pharynx(): Sdf {
  const zc = profile([[-12.8, 1.75], [-8.6, 2.05], [-5.0, 2.35], [-1.7, 2.85]]);
  const rx = profile([[-12.8, 1.0], [-8.6, 1.7], [-5.0, 1.8], [-1.7, 1.6]]);
  const rz = profile([[-12.8, 0.7], [-8.6, 0.85], [-5.0, 0.9], [-1.7, 0.8]]);
  return (x, y, z) => {
    const c = zc(y);
    const a = rx(y);
    const b = rz(y);
    const e = (Math.hypot(x / a, (z - c) / b) - 1) * Math.min(a, b);
    let d = Math.abs(e) - 0.14;
    d = smax(d, z - c - 0.35, 0.25);
    d = smax(d, Math.abs(y + 7.25) - 5.55, 0.2);
    return d + 0.012 * Math.sin(y * 7);
  };
}

function airway(): Sdf {
  const trachea = chain([[0, -13.5, 3.8], [0, -18, 3.2], [0, -22, 2.4], [0, -25.6, 1.8]], 0.95, 0.2);
  const rings: Sdf = (x, y, z) => {
    const d = trachea(x, y, z);
    if (d > 0.2 || y > -13.6) return d;
    return d - 0.045 * smoothstep(0.1, 0.8, Math.sin(y * 5.6));
  };
  return csg(rings, [
    ["+", chain([[0, -25.6, 1.8], [3.2, -27.2, 1.2], [4.6, -28, 0.9]], [0.72, 0.62, 0.55]), 0.3],
    ["+", chain([[0, -25.6, 1.8], [-2.6, -26.8, 1.3], [-4.2, -27.4, 1.0]], [0.78, 0.7, 0.62]), 0.3],
    ["+", torus([0, -13.15, 3.75], UP, 1.0, 1.0, 0.2), 0.1],
    ["+", band([0, -12.4, 2.9], [0, -13.3, 2.9], 0.8, 0.18, FORWARD), 0.1],
    ["+", mirrored(band([0.05, -11.0, 5.0], [1.85, -11.4, 3.3], 1.2, 0.1, [0.68, 0, 0.74])), 0.1],
    ["+", band([0, -9.2, 3.3], [0, -10.8, 3.9], 0.55, 0.07, FORWARD), 0.05],
    ["+", mirrored(chain([[0, -9.0, 4.2], [1.2, -9.05, 4.0], [2.1, -8.95, 3.1]], 0.2)), 0.05],
  ]);
}

function oesophagus(): Sdf {
  return chain(
    [[0, -12.7, 1.75], [0.1, -17, 1.1], [0.3, -22, 0.4], [0.1, -27, 0.1], [0, -30, 0.2], [0.8, -33.5, 0.6], [2.0, -35.8, 1.4], [2.7, -38.6, 2.4]],
    [0.75, 0.72, 0.72, 0.72, 0.72, 0.75, 0.8, 0.9],
    0.3,
  );
}

/* ------------------------------------------------------------------ */
/* Heart, great vessels, lungs, stomach                                */
/* ------------------------------------------------------------------ */

function heart(): Sdf {
  const ventricles = orientedEllipsoid([2.0, -28.0, 4.8], [0.62, -0.62, 0.48], [3.6, 3.2, 2.7]);
  return csg(ventricles, [
    ["+", roundCone([0.5, -26.4, 3.9], [4.7, -30.8, 6.9], 3.3, 0.8), 1.0],
    ["+", ellipsoid([-2.3, -25.6, 3.2], [1.9, 2.2, 1.8]), 0.8],
    ["+", ellipsoid([-1.2, -23.9, 5.0], [0.9, 0.6, 0.8]), 0.4],
    ["+", ellipsoid([0.9, -24.3, 0.9], [2.3, 1.4, 1.4]), 0.8],
    ["+", ellipsoid([3.2, -24.2, 3.4], [0.8, 0.5, 0.9]), 0.4],
  ]);
}

function arteries(): Sdf {
  const aorta = chain(
    [[0.4, -25.8, 4.0], [-0.45, -23.2, 4.3], [0.3, -21.2, 3.2], [1.8, -21.0, 1.3], [2.7, -22.8, -0.6], [2.6, -26, -1.4], [2.3, -30, -1.6], [1.7, -36.5, -1.0]],
    [1.25, 1.25, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9],
    0.3,
  );
  return csg(aorta, [
    ["+", chain([[-0.4, -21.2, 3.4], [-1.9, -18.4, 3.2]], [0.6, 0.55]), 0.25],
    ["+", chain([[-1.9, -18.4, 3.2], [-4.5, -17.8, 1.6], [-8.8, -18.6, 0.6]], [0.45, 0.45, 0.4]), 0.2],
    ["+", chain([[-1.9, -18.4, 3.2], [-2.3, -12.5, 2.4], [-2.3, -9.3, 2.2]], 0.4), 0.2],
    ["+", chain([[0.9, -20.6, 2.6], [2.1, -15, 2.4], [2.3, -9.3, 2.2]], 0.4), 0.25],
    ["+", chain([[1.7, -20.8, 1.4], [4.2, -18.2, 1.0], [8.8, -18.6, 0.6]], [0.45, 0.45, 0.4]), 0.25],
    ["+", mirrored(chain([[2.3, -9.3, 2.2], [2.55, -6.2, 1.0], [2.8, -3.6, 0.35]], [0.32, 0.3, 0.28])), 0.15],
    ["+", mirrored(chain([[2.3, -9.3, 2.2], [2.4, -7.0, 2.9], [3.0, -4.6, 3.0]], [0.28, 0.24, 0.2])), 0.15],
  ]);
}

function veins(): Sdf {
  const svc = chain([[-3.1, -18.4, 2.4], [-3.0, -24.6, 2.8]], [0.85, 0.9]);
  return csg(svc, [
    ["+", chain([[4.2, -17.6, 2.4], [1.0, -17.8, 4.6], [-2.2, -18.0, 4.2], [-3.1, -18.6, 2.6]], [0.58, 0.6, 0.62, 0.65], 0.2), 0.3],
    ["+", chain([[-4.4, -17.3, 2.1], [-3.1, -18.4, 2.4]], [0.58, 0.65]), 0.3],
    [
      "+",
      mirrored(
        chain(
          [[2.85, -2.4, -1.45], [3.7, -4.5, -0.9], [3.9, -8, 0.3], [3.95, -12, 1.0], [3.8, -16.2, 1.8], [4.1, -17.4, 2.2]],
          [0.4, 0.45, 0.52, 0.55, 0.6, 0.6],
          0.2,
        ),
      ),
      0.3,
    ],
    ["+", mirrored(chain([[4.1, -17.4, 2.2], [8.6, -17.9, 1.4]], [0.5, 0.45])), 0.3],
    ["+", chain([[1.8, -26.8, 5.8], [2.1, -24.8, 4.4], [1.0, -23.8, 2.6]], [0.95, 0.9, 0.85]), 0.3],
    ["+", chain([[1.0, -23.8, 2.6], [3.6, -24.4, 1.2], [5.2, -25.4, 0.6]], [0.7, 0.65, 0.6]), 0.3],
    ["+", chain([[1.0, -23.8, 2.6], [-1.8, -24.4, 1.7], [-4.8, -25.6, 0.8]], [0.7, 0.65, 0.6]), 0.3],
  ]);
}

/** Both lungs: diaphragmatic domes, mediastinal faces, cardiac notch, fissures. */
function lungs(): Sdf {
  const main = ellipsoid([7.2, -28.5, 1.8], [4.9, 10.0, 6.9]);
  const apex = ellipsoid([4.6, -20.5, 0.8], [2.8, 4.2, 3.2]);
  const dome = ellipsoid([6.0, -43.5, 2.2], [7.2, 7.0, 8.2]);
  const cardiacNotch = ellipsoid([2.8, -28.6, 4.8], [3.8, 4.6, 3.6]);
  const atrialBed = ellipsoid([-2.3, -25.6, 3.2], [2.3, 2.6, 2.2]);
  const k = Math.SQRT1_2;
  return (x, y, z) => {
    const ax = Math.abs(x);
    let d = smin(main(ax, y, z), apex(ax, y, z), 2.0);
    d = smax(d, -dome(ax, y, z), 0.8);
    d = smax(d, 2.4 - ax, 0.8);
    d = x >= 0 ? smax(d, -cardiacNotch(x, y, z), 0.6) : smax(d, -atrialBed(x, y, z), 0.6);
    const oblique = k * (y + 21) + k * (z + 5);
    d = smax(d, 0.07 - Math.abs(oblique), 0.05);
    if (x < 0) {
      // Right lung: horizontal fissure in front of the oblique one.
      d = smax(d, -Math.max(Math.abs(y + 26.5) - 0.07, -oblique), 0.05);
    }
    return d;
  };
}

function stomach(): Sdf {
  const body = chain(
    [[6.3, -41.8, 3.6], [5.2, -44.9, 5.3], [2.5, -46.5, 6.3], [-0.2, -45.6, 6.6], [-1.8, -44.2, 6.2], [-3.0, -43.4, 5.4], [-3.6, -44.9, 3.8]],
    [3.1, 2.9, 2.3, 1.7, 1.15, 1.15, 1.05],
    0.9,
  );
  return csg(body, [
    ["+", sphere([5.5, -39.3, 2.3], 2.9), 1.2],
    ["+", roundCone([2.7, -38.6, 2.4], [4.2, -39.6, 2.3], 0.9, 1.6), 0.6],
  ]);
}

/* ------------------------------------------------------------------ */
/* Glands and inner ear                                                */
/* ------------------------------------------------------------------ */

function parotid(): Sdf {
  const gland = csg(ellipsoid([5.55, -2.9, 1.2], [0.85, 2.2, 1.4]), [
    ["+", ellipsoid([6.15, -2.3, 2.6], [0.45, 1.6, 1.3]), 0.5],
    ["+", ellipsoid([5.4, -5.0, 1.4], [0.6, 0.7, 0.8]), 0.5],
  ]);
  const duct = chain([[6.35, -2.3, 3.5], [6.4, -2.6, 4.9], [5.0, -3.6, 6.2], [3.75, -4.5, 6.1]], 0.12);
  return smoothUnionAll(0.15, lobules(gland, 51, 3.2, 0.05), duct);
}

function submandibular(): Sdf {
  const gland = csg(ellipsoid([2.95, -9.35, 3.9], [0.85, 0.72, 1.3]), [
    ["+", ellipsoid([2.45, -8.5, 5.0], [0.35, 0.3, 0.8]), 0.3],
  ]);
  const duct = chain([[2.35, -8.4, 5.4], [1.2, -7.5, 7.2], [0.4, -7.6, 8.2]], 0.09);
  return smoothUnionAll(0.12, lobules(gland, 53, 4.0, 0.04), duct);
}

function lacrimal(): Sdf {
  return lobules(orientedEllipsoid([4.15, 2.6, 7.3], [0.62, -0.25, 0.75], [0.62, 0.36, 0.2]), 57, 7, 0.02);
}

/**
 * Regio olfactoria: the mucosa of the nasal roof on the upper septum and the
 * superior concha, where the fila olfactoria begin.
 */
function olfactoryMucosa(): Sdf {
  return group(
    0.05,
    band([0.18, 2.1, 5.9], [0.18, 2.1, 7.8], 0.9, 0.05, LATERAL),
    band([1.0, 2.0, 6.1], [1.0, 1.9, 7.9], 0.6, 0.06, LATERAL),
    capsule([1.0, 1.45, 6.2], [0.95, 1.35, 7.8], 0.12),
  );
}

/** Cochlear spiral (2.5 turns), vestibule and the three semicircular canals. */
function labyrinth(): Sdf {
  const base: Vec3 = [3.4, 0.35, 0.3];
  const axis = normalize([0.5, -0.2, 0.85]);
  const s = sideAxis(axis, UP);
  const v = cross(axis, s);
  const turns = 2.5;
  const cochlea: Sdf = (x, y, z) => {
    const qx = x - base[0];
    const qy = y - base[1];
    const qz = z - base[2];
    const h = qx * axis[0] + qy * axis[1] + qz * axis[2];
    const a1 = qx * s[0] + qy * s[1] + qz * s[2];
    const a2 = qx * v[0] + qy * v[1] + qz * v[2];
    let phi = Math.atan2(a2, a1);
    if (phi < 0) phi += Math.PI * 2;
    let best = Infinity;
    for (let k = 0; k < 3; k += 1) {
      const t = (phi + Math.PI * 2 * k) / (Math.PI * 2 * turns);
      if (t > 1) break;
      const r = mix(0.42, 0.1, t);
      const tube = mix(0.13, 0.055, t);
      const d = Math.hypot(a1 - r * Math.cos(phi), a2 - r * Math.sin(phi), h - 0.5 * t) - tube;
      if (d < best) best = d;
    }
    return best;
  };
  const petrous = normalize([0.79, 0, -0.61]);
  return smoothUnionAll(
    0.08,
    cochlea,
    ellipsoid([3.95, 0.55, -0.28], [0.26, 0.22, 0.3]),
    torus([4.22, 0.6, -0.6], UP, 0.3, 0.3, 0.055),
    torus([3.9, 0.93, -0.3], petrous, 0.33, 0.33, 0.055),
    torus([4.05, 0.55, -0.75], [0.61, 0, 0.79], 0.32, 0.32, 0.055),
  );
}

/* ------------------------------------------------------------------ */
/* Thoracic skeleton                                                   */
/* ------------------------------------------------------------------ */

const RIB_WIDTH = [7.0, 9.2, 10.8, 11.9, 12.6, 13.2, 13.5, 13.4, 13.0, 12.3];
const STERNAL_Y = [-20.2, -23.0, -25.2, -27.3, -29.2, -31.0, -33.0];
const COSTOCHONDRAL_DROP = [0.3, 0.8, 1.5, 2.2, 2.8, 3.4, 3.9];
const COSTAL_MARGIN: Vec3[] = [
  [4.6, -37.0, 8.0],
  [6.2, -40.2, 7.4],
  [7.4, -43.0, 6.6],
];

function thoracicLevel(i: number): { y: number; z: number } {
  return { y: -16.9 - 2.3 * (i - 1), z: -1.0 - 0.15 * (i - 1) };
}

function sternumZ(y: number): number {
  return 5.6 + (-19.4 - y) * 0.2;
}

function rib(i: number): Shape {
  const { y, z } = thoracicLevel(i);
  const w = RIB_WIDTH[i - 1];
  const pts: Vec3[] = [
    [1.35, y, z - 0.55],
    [0.5 * w, y - 0.35, z - Math.min(3, 0.35 * w)],
    [w, y - 2.3 - 0.12 * i, -0.3],
  ];
  if (i <= 7) {
    const ys = STERNAL_Y[i - 1];
    pts.push([0.72 * w, ys - COSTOCHONDRAL_DROP[i - 1], 5.6], [1.25, ys, sternumZ(ys) + 0.1]);
  } else {
    pts.push([0.78 * w, y - 4.0 - 0.2 * i, 5.4], COSTAL_MARGIN[i - 8]);
  }
  const smooth = smoothPath(pts, [0.3, 0.38, 0.4, 0.36, 0.3], 4);
  return chain(smooth.pts, smooth.rs, 0.05);
}

function thoracicVertebra(i: number): Shape {
  const { y, z } = thoracicLevel(i);
  const body = bounded(
    (px, py, pz) => {
      const dr = (Math.hypot(px / 1.25, (pz - z) / 1.05) - 1) * 1.05;
      const dy = Math.abs(py - y) - 0.8;
      return Math.min(Math.max(dr, dy), 0) + Math.hypot(Math.max(dr, 0), Math.max(dy, 0)) - 0.08;
    },
    [-1.3, y - 0.9, z - 1.1],
    [1.3, y + 0.9, z + 1.1],
    0.3,
  );
  return group(
    0.2,
    body,
    roundCone([0, y, z - 1.9], [0, y - 2.2, z - 4.6], 0.35, 0.25),
    capsule([0.9, y + 0.2, z - 1.6], [2.8, y + 0.3, z - 2.6], 0.32),
  );
}

function thoraxBones(): Sdf {
  const parts: Shape[] = [];
  for (let i = 1; i <= 10; i += 1) parts.push(rib(i), thoracicVertebra(i));
  parts.push(
    band([0, -19.4, 5.7], [0, -33.5, 8.5], [1.6, 1.3], 0.35, [0, 0.2, 1]),
    band([0, -19.4, 5.7], [0, -22.8, 6.5], 2.4, 0.4, [0, 0.2, 1]),
    band([0, -33.5, 8.5], [0, -36, 8.2], 0.5, 0.15, [0, 0.2, 1]),
    (() => {
      const clavicle = smoothPath([[1.5, -19.2, 5.6], [6, -18.1, 4.4], [11, -17.5, 1.8], [15.2, -17.7, -1.0]], [0.55, 0.5, 0.45, 0.5], 4);
      return chain(clavicle.pts, clavicle.rs, 0.05);
    })(),
  );
  const [first, ...rest] = parts;
  return mirrorX(csg(first, rest.map((p) => ["+", p, 0.2] as const)));
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

type Entry = Omit<SoftModel, "grid" | "build"> & { grid: GridSpec; sdf: () => Sdf };

const ENTRIES: Entry[] = [
  { id: "eom-oculomotor", label: "Mm. recti sup./inf./med., obliquus inf., levator palpebrae", layer: "muscles", material: "muscle", nerveIds: [3], mirror: true, grid: { min: [1.0, -0.45, 4.0], max: [4.55, 3.4, 8.6], cell: 0.04 }, sdf: oculomotorMuscles },
  { id: "eom-trochlear", label: "M. obliquus superior", layer: "muscles", material: "muscle", nerveIds: [4], mirror: true, grid: { min: [1.1, 2.0, 4.1], max: [3.95, 3.15, 8.25], cell: 0.03 }, sdf: trochlearMuscle },
  { id: "eom-abducens", label: "M. rectus lateralis", layer: "muscles", material: "muscle", nerveIds: [6], mirror: true, grid: { min: [1.6, 0.7, 4.1], max: [4.85, 2.5, 8.0], cell: 0.04 }, sdf: abducensMuscle },
  { id: "masseter", label: "M. masseter", layer: "muscles", material: "muscle", nerveIds: [5], mirror: true, grid: { min: [4.7, -7.2, 1.2], max: [6.9, 0.1, 5.9], cell: 0.07 }, sdf: masseter },
  { id: "temporalis", label: "M. temporalis", layer: "muscles", material: "muscle", nerveIds: [5], mirror: true, grid: { min: [3.8, -1.6, -5.3], max: [7.9, 7.6, 6.2], cell: 0.08 }, sdf: temporalis },
  { id: "frontalis", label: "M. frontalis", layer: "muscles", material: "muscle", nerveIds: [7], mirror: true, grid: { min: [0.2, 3.4, 4.0], max: [4.8, 9.9, 10.1], cell: 0.055 }, sdf: frontalis },
  { id: "orbicularis-oculi", label: "M. orbicularis oculi", layer: "muscles", material: "muscle", nerveIds: [7], mirror: true, grid: { min: [0.5, -1.5, 7.8], max: [6.1, 4.2, 10.0], cell: 0.04 }, sdf: orbicularisOculi },
  { id: "orbicularis-oris", label: "M. orbicularis oris", layer: "muscles", material: "muscle", nerveIds: [7], mirror: false, grid: { min: [-2.7, -7.9, 8.3], max: [2.7, -4.3, 10.3], cell: 0.04 }, sdf: orbicularisOris },
  { id: "zygomaticus", label: "M. zygomaticus major", layer: "muscles", material: "muscle", nerveIds: [7], mirror: true, grid: { min: [1.9, -6.4, 7.2], max: [5.7, -0.2, 10.1], cell: 0.04 }, sdf: zygomaticus },
  { id: "buccinator", label: "M. buccinator", layer: "muscles", material: "muscle", nerveIds: [7], mirror: true, grid: { min: [1.9, -7.2, 3.6], max: [4.2, -4.2, 9.4], cell: 0.045 }, sdf: buccinator },
  { id: "scm", label: "M. sternocleidomastoideus", layer: "muscles", material: "muscle", nerveIds: [11], mirror: true, grid: { min: [0.8, -19.8, -1.9], max: [5.8, -1.9, 6.2], cell: 0.09 }, sdf: sternocleidomastoid },
  { id: "trapezius", label: "M. trapezius", layer: "muscles", material: "muscle", nerveIds: [11], mirror: true, grid: { min: [0, -19.0, -10.8], max: [15.2, -0.6, -0.6], cell: 0.1 }, sdf: trapezius },
  { id: "tongue", label: "Lingua", layer: "muscles", material: "muscle", nerveIds: [12], mirror: false, grid: { min: [-2.4, -9.6, 1.6], max: [2.4, -5.1, 8.9], cell: 0.06 }, sdf: tongue },
  { id: "pharynx", label: "Pharynx", layer: "organs", material: "viscera", nerveIds: [9, 10], mirror: false, grid: { min: [-2.5, -13.3, 0.5], max: [2.5, -1.2, 3.9], cell: 0.06 }, sdf: pharynx },
  { id: "airway", label: "Larynx, trachea, bronchi", layer: "organs", material: "cartilage", nerveIds: [10], mirror: false, grid: { min: [-5.6, -28.8, 0.1], max: [5.6, -8.4, 5.6], cell: 0.08 }, sdf: airway },
  { id: "oesophagus", label: "Oesophagus", layer: "organs", material: "viscera", nerveIds: [10], mirror: false, grid: { min: [-1.2, -39.8, -1.0], max: [3.9, -11.6, 3.6], cell: 0.1 }, sdf: oesophagus },
  { id: "heart", label: "Cor", layer: "organs", material: "heart", nerveIds: [10], mirror: false, grid: { min: [-5.4, -33.4, -1.8], max: [8.4, -21.6, 9.8], cell: 0.12 }, sdf: heart },
  { id: "lungs", label: "Pulmones", layer: "organs", material: "lung", nerveIds: [10], mirror: false, grid: { min: [-12.8, -39.2, -5.6], max: [12.8, -15.6, 9.2], cell: 0.16 }, sdf: lungs },
  { id: "stomach", label: "Gaster", layer: "organs", material: "viscera", nerveIds: [10], mirror: false, grid: { min: [-5.0, -49.8, -1.2], max: [9.6, -35.4, 9.4], cell: 0.12 }, sdf: stomach },
  { id: "parotid", label: "Glandula parotidea", layer: "organs", material: "gland", nerveIds: [9], mirror: true, grid: { min: [3.4, -5.9, -0.4], max: [7.0, 0.0, 7.0], cell: 0.06 }, sdf: parotid },
  { id: "submandibular", label: "Glandula submandibularis", layer: "organs", material: "gland", nerveIds: [7], mirror: true, grid: { min: [0.2, -10.3, 2.4], max: [4.0, -6.9, 8.6], cell: 0.05 }, sdf: submandibular },
  { id: "lacrimal", label: "Glandula lacrimalis", layer: "organs", material: "gland", nerveIds: [7], mirror: true, grid: { min: [3.3, 1.9, 6.5], max: [5.0, 3.3, 8.1], cell: 0.03 }, sdf: lacrimal },
  { id: "olfactory-mucosa", label: "Regio olfactoria", layer: "organs", material: "viscera", nerveIds: [1], mirror: true, grid: { min: [0, 0.9, 5.6], max: [1.35, 3.2, 8.2], cell: 0.03 }, sdf: olfactoryMucosa },
  { id: "labyrinth", label: "Cochlea, vestibulum, canales semicirculares", layer: "organs", material: "labyrinth", nerveIds: [8], mirror: true, grid: { min: [2.8, -0.2, -1.2], max: [4.8, 1.45, 1.05], cell: 0.025 }, sdf: labyrinth },
  { id: "arteries", label: "Aorta, aa. carotides, aa. subclaviae", layer: "organs", material: "artery", nerveIds: [], mirror: false, grid: { min: [-9.4, -37.6, -3.0], max: [9.4, -2.9, 6.2], cell: 0.13 }, sdf: arteries },
  { id: "veins", label: "V. cava sup., vv. jugulares, truncus pulmonalis", layer: "organs", material: "vein", nerveIds: [], mirror: false, grid: { min: [-9.6, -28.2, -2.2], max: [9.6, -1.6, 7.0], cell: 0.13 }, sdf: veins },
  { id: "thorax-bones", label: "Costae, sternum, claviculae, vertebrae thoracicae", layer: "organs", material: "bone", nerveIds: [], mirror: false, grid: { min: [-16.3, -45.2, -9.0], max: [16.3, -15.4, 10.0], cell: 0.2 }, sdf: thoraxBones },
];

export const SOFT_MODELS: SoftModel[] = ENTRIES.map(({ sdf, ...rest }) => ({
  ...rest,
  build: () => ({ sdf: sdf() }),
}));

/** Every mesh the scene builds, in build priority order. */
export const ANATOMY_MODELS: AnatomyModel[] = [...NEURO_MODELS, ...SOFT_MODELS];

export function isSoftModel(model: AnatomyModel): model is SoftModel {
  return "nerveIds" in model;
}

export function buildModelMesh(model: AnatomyModel): MeshData {
  return buildOrganMesh(model);
}
