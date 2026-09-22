/**
 * Sculpted head and neuro models as signed-distance fields.
 *
 * Frame and units match `sdf.ts` (cm; +x patient left, +y up, +z anterior;
 * origin between the ear canals on the Frankfort plane). Bilateral parts are
 * modelled on the +x side and mirrored. Landmarks follow adult averages:
 * skull length ~20 cm, brainstem ~9 cm from thalamus to the C2 cut.
 */
import {
  band,
  bounded,
  capsule,
  chain,
  createNoise3,
  csg,
  ellipsoid,
  group,
  meshSdf,
  mirrorX,
  mix,
  orientedEllipsoid,
  plane,
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

export type OrganMaterial = "bone" | "stem" | "cortex" | "cerebellum";
export type OrganLayer = "skull" | "brainstem" | "brain";

export type OrganModel = {
  id: string;
  layer: OrganLayer;
  material: OrganMaterial;
  grid: GridSpec;
  build: () => { sdf: Sdf; coarse?: Sdf };
};

const UP: Vec3 = [0, 1, 0];
const LATERAL: Vec3 = [1, 0, 0];
const FORWARD: Vec3 = [0, 0, 1];

/* ------------------------------------------------------------------ */
/* Brainstem + diencephalon + upper cervical cord                      */
/* ------------------------------------------------------------------ */

/** Ventral/dorsal midline of the stem: z of its axis at height y. */
export const stemAxisZ = profile([
  [6.6, -0.15],
  [4.4, -0.4],
  [3.0, -0.5],
  [1.8, -0.72],
  [0.6, -1.0],
  [-0.8, -1.4],
  [-2.4, -1.85],
  [-4.4, -2.1],
  [-6.4, -2.25],
]);

function cutStub(a: Vec3, b: Vec3, r1: number, r2: number, normal: Vec3): Shape {
  const cone = roundCone(a, b, r1, r2);
  const cut = plane(b, normal);
  const stub: Shape = (x, y, z) => Math.max(cone(x, y, z), cut(x, y, z));
  stub.bound = cone.bound;
  return stub;
}

export function brainstemSdf(): Sdf {
  const rx = profile([
    [6.0, 0.95],
    [4.4, 1.18],
    [3.0, 1.02],
    [1.8, 1.25],
    [0.6, 1.05],
    [-0.8, 0.95],
    [-2.4, 0.76],
    [-4.0, 0.66],
    [-6.4, 0.62],
  ]);
  const rz = profile([
    [6.0, 0.8],
    [4.4, 0.98],
    [3.0, 0.98],
    [1.8, 1.0],
    [0.6, 0.9],
    [-0.8, 0.84],
    [-2.4, 0.62],
    [-4.0, 0.5],
    [-6.4, 0.48],
  ]);
  const core: Sdf = (x, y, z) => {
    const a = rx(y);
    const b = rz(y);
    const u = x / a;
    const v = (z - stemAxisZ(y)) / b;
    return smax((Math.sqrt(u * u + v * v) - 1) * Math.min(a, b), y - 4.8, 0.6);
  };

  const pons = ellipsoid([0, 1.75, -0.05], [1.72, 1.15, 1.1]);
  const peduncle = roundCone([0.58, 2.8, 0.05], [1.3, 4.9, 0.45], 0.52, 0.62);
  const thalamus = ellipsoid([0.92, 5.35, -0.75], [0.95, 0.8, 1.55]);
  const geniculate = sphere([1.55, 4.3, -1.35], 0.4);
  const mamillary = sphere([0.26, 4.5, 0.72], 0.24);
  const supColliculus = sphere([0.45, 3.95, -1.32], 0.4);
  const infColliculus = sphere([0.42, 3.22, -1.38], 0.34);
  const pineal = ellipsoid([0, 4.62, -1.85], [0.22, 0.2, 0.38]);
  const mcp = cutStub([1.25, 1.65, -0.6], [2.05, 1.4, -1.55], 0.85, 0.74, [1.0, -0.3, -1.1]);
  const scp = cutStub([0.5, 2.7, -1.35], [0.95, 2.05, -2.1], 0.28, 0.32, [0.45, -0.5, -0.75]);
  const icp = cutStub([0.75, -0.6, -1.9], [1.35, 0.55, -2.35], 0.32, 0.35, [0.5, 0.6, -0.6]);
  const olive = ellipsoid([0.72, -0.55, -0.72], [0.3, 0.62, 0.3]);
  const pyramid = roundCone([0.3, 0.5, -0.25], [0.2, -2.2, -1.3], 0.3, 0.24);
  const fossa = ellipsoid([0, 0.55, -2.25], [0.95, 1.55, 0.55]);
  const facialColliculus = sphere([0.28, 0.95, -1.72], 0.18);
  const gracile = ellipsoid([0.22, -1.95, -2.35], [0.2, 0.45, 0.2]);
  const cuneate = ellipsoid([0.55, -1.75, -2.25], [0.22, 0.45, 0.2]);
  const interpeduncular = ellipsoid([0, 3.35, 0.72], [0.32, 0.75, 0.45]);
  const basilarSulcus = capsule([0, 2.9, 1.12], [0, 0.6, 0.97], 0.12);
  const anteriorFissure = chain(
    [
      [0, 0.55, -0.12],
      [0, -2.4, -1.25],
      [0, -6.3, -1.74],
    ],
    0.07,
  );
  const posteriorSulcus = capsule([0, -2.2, -2.45], [0, -6.3, -2.72], 0.06);

  const body = csg(core, [
    ["+", pons, 0.35],
    ["+", peduncle, 0.3],
    ["+", thalamus, 0.35],
    ["+", geniculate, 0.2],
    ["+", mamillary, 0.1],
    ["+", supColliculus, 0.12],
    ["+", infColliculus, 0.12],
    ["+", pineal, 0.1],
    ["+", mcp, 0.3],
    ["+", scp, 0.2],
    ["+", icp, 0.2],
    ["+", olive, 0.12],
    ["+", pyramid, 0.12],
    ["-", fossa, 0.2],
    ["+", facialColliculus, 0.08],
    ["+", gracile, 0.1],
    ["+", cuneate, 0.1],
    ["-", interpeduncular, 0.15],
    ["-", basilarSulcus, 0.1],
    ["-", anteriorFissure, 0.05],
    ["-", posteriorSulcus, 0.05],
  ]);

  return mirrorX((x, y, z) => {
    let d = body(x, y, z);
    // Transverse pontine fibres read as fine horizontal striations.
    const pontine = Math.exp(-((y - 1.75) ** 2) / 1.1) * Math.min(Math.max(z / 0.8, 0), 1);
    if (pontine > 0.01) d += 0.007 * pontine * Math.sin(y * 34);
    // Clean transverse cut through the cord at C2.
    return Math.max(d, -6.2 - y);
  });
}

/* ------------------------------------------------------------------ */
/* Skull: vault, cranial base, face, upper teeth                       */
/* ------------------------------------------------------------------ */

/**
 * Height of the endocranial floor at (|x|, z): anterior fossa over the
 * orbits, middle fossa either side of the sella, clivus, posterior fossa.
 * Shared with the cerebrum so the brain rests on the same surface.
 */
export function cranialFloorY(ax: number, z: number): number {
  const anterior = 3.15 + 0.3 * Math.exp(-((ax - 2.6) ** 2) / 1.4) - 0.25 * Math.exp(-(ax * ax) / 0.25);
  const sella = 0.55 * Math.exp(-(ax * ax + (z - 2.0) ** 2 * 1.5) / 0.35);
  const middle = mix(2.0, -0.4, smoothstep(0.9, 2.6, ax)) - sella;
  const posterior = -2.9 + 0.035 * ax * ax + 0.03 * (z + 3) ** 2;
  const ridgeZ = 3.1 + 0.9 * smoothstep(1.6, 3.4, ax);
  const f = mix(posterior, middle, smoothstep(-0.2, 1.8, z));
  return mix(f, anterior, smoothstep(ridgeZ - 0.7, ridgeZ + 0.5, z));
}

/**
 * Tooth row along an elliptical arch (semi-axes a, b; centre z = cz), crowns
 * spanning y = yMid +/- yHalf, cut off behind zMin.
 */
function teethRow(a: number, b: number, cz: number, yMid: number, yHalf: number, zMin: number): Sdf {
  const radial = 0.37;
  const teeth: Sdf = (x, y, z) => {
    const u = x / a;
    const v = (z - cz) / b;
    const r = Math.sqrt(u * u + v * v) || 1e-6;
    const local = Math.sqrt((a * u) ** 2 + (b * v) ** 2) / r;
    const dRad = (r - 1) * local;
    let d = smax(Math.abs(dRad) - radial, Math.abs(y - yMid) - yHalf, 0.18);
    const g = Math.cos(Math.atan2(u, v) * 34.7);
    if (g > 0) d += 0.16 * g ** 12;
    return smax(d, zMin - z, 0.1);
  };
  return bounded(teeth, [0, yMid - yHalf, zMin], [a, yMid + yHalf, cz + b], 0.4);
}

/**
 * Outer table of the cranial vault. Scalp muscles (temporalis, frontalis)
 * are modelled as layers over this same surface.
 */
export function cranialVaultSdf(): Sdf {
  const vaultOuter = ellipsoid([0, 4.2, -0.5], [7.0, 7.9, 9.8]);
  const occOuter = ellipsoid([0, 0.8, -5.0], [5.9, 5.4, 5.6]);
  return (x, y, z) => smin(vaultOuter(x, y, z), occOuter(x, y, z), 1.2);
}

export function skullSdf(): Sdf {
  const vaultOuter = cranialVaultSdf();
  const vaultInner = ellipsoid([0, 4.2, -0.5], [6.35, 7.25, 9.15]);
  const occInner = ellipsoid([0, 0.8, -5.0], [5.25, 4.75, 4.95]);
  const petrous = chain(
    [
      [1.9, 1.25, 0.9],
      [4.2, 1.65, -0.9],
      [5.9, 1.35, -2.2],
    ],
    [0.42, 0.68, 0.6],
    0.2,
  );
  const dorsumSellae = capsule([0, 2.5, 1.35], [0.7, 2.5, 1.35], 0.22);
  const clinoid = sphere([1.0, 2.45, 2.9], 0.25);

  const orbitOuter = roundCone([3.25, 1.4, 8.3], [1.5, 1.95, 4.2], 2.12, 0.55);
  const orbitCavity = group(
    0.3,
    roundCone([3.25, 1.4, 8.9], [1.5, 1.95, 4.2], 1.82, 0.35),
    ellipsoid([3.3, 1.4, 8.6], [1.95, 1.72, 1.4]),
  );
  const orbitRim = torus([3.3, 1.35, 8.6], [0.28, 0, 1], 1.95, 1.75, 0.36);
  const maxilla = ellipsoid([2.45, -2.5, 7.0], [2.0, 2.3, 1.85]);
  const zygoma = ellipsoid([4.6, -0.3, 7.0], [1.0, 1.25, 1.3]);
  const arch = group(
    0.2,
    band([5.2, -0.45, 5.8], [6.35, -0.35, 3.2], 0.5, 0.28, LATERAL),
    band([6.35, -0.35, 3.2], [5.8, -0.2, 1.4], 0.5, 0.3, LATERAL),
  );
  const nasalBones = band([0, 2.8, 9.35], [0, 0.95, 10.35], 0.75, 0.2, [0, 0.3, 1]);
  const frontalProcess = band([1.0, 2.7, 8.9], [1.55, -0.6, 8.7], 0.45, 0.3, FORWARD);
  const alveolar = chain(
    [
      [3.2, -4.85, 3.9],
      [3.0, -4.9, 5.8],
      [1.9, -5.0, 7.6],
      [0, -5.05, 8.45],
    ],
    0.7,
    0.3,
  );
  const palate = bounded(
    (x, y, z) => {
      const e = (Math.sqrt((x / 2.6) ** 2 + ((z - 4.2) / 4.2) ** 2) - 1) * 2.4;
      return smax(Math.abs(y + 4.5) - 0.22, e, 0.2);
    },
    [0, -4.8, 0],
    [2.7, -4.2, 8.5],
    0.3,
  );
  const pterygoid = band([1.85, -0.3, 3.6], [2.0, -4.3, 3.1], 0.55, 0.18, LATERAL);
  const upperTeeth = teethRow(3.15, 4.65, 3.85, -5.55, 0.45, 3.9);
  const mastoid = roundCone([5.1, -0.5, -1.2], [4.95, -2.9, -1.4], 1.0, 0.42);
  const condyle = ellipsoid([1.3, -3.25, -1.05], [0.55, 0.38, 0.95]);
  const protuberance = sphere([0, 0.3, -10.4], 0.6);

  const face = bounded(
    csg(maxilla, [
      ["+", zygoma, 0.5],
      ["+", orbitRim, 0.4],
      ["+", orbitOuter, 0.3],
      ["+", arch, 0.3],
      ["+", nasalBones, 0.2],
      ["+", frontalProcess, 0.3],
      ["+", alveolar, 0.35],
      ["+", palate, 0.2],
      ["+", pterygoid, 0.2],
      ["+", upperTeeth, 0.12],
    ]),
    [0, -6.2, 1.2],
    [6.8, 4.4, 10.8],
    0.6,
  );

  const nasalAperture = group(
    0.3,
    ellipsoid([0, -0.7, 9.2], [1.0, 1.6, 1.6]),
    ellipsoid([0, -1.8, 9.2], [1.3, 0.8, 1.6]),
  );
  const nasalCavity = group(
    0.3,
    ellipsoid([0, -0.9, 6.6], [1.15, 2.3, 3.3]),
    ellipsoid([0, 1.3, 6.4], [0.5, 1.9, 2.2]),
  );
  const maxSinus = ellipsoid([2.5, -2.2, 6.9], [1.35, 1.45, 1.2]);
  const foramenMagnum = bounded(
    (x, y, z) => {
      const e = (Math.sqrt((x / 1.55) ** 2 + ((z + 2.05) / 1.85) ** 2) - 1) * 1.55;
      return Math.max(e, Math.abs(y + 2.6) - 1.4);
    },
    [0, -4.0, -3.9],
    [1.55, -1.2, -0.2],
    0.2,
  );
  const foramina = bounded(
    group(
      0,
      capsule([2.85, -0.8, -1.35], [2.85, -3.2, -1.35], 0.42), // jugular
      capsule([1.1, -2.2, -1.25], [2.2, -2.9, -0.7], 0.22), // hypoglossal
      capsule([2.1, 0.62, -0.35], [3.35, 0.62, -0.1], 0.3), // internal acoustic
      capsule([2.45, 0.9, 2.0], [2.45, -0.9, 2.0], 0.3), // ovale
      capsule([2.1, 1.0, 2.6], [2.1, 1.0, 3.9], 0.2), // rotundum
      capsule([1.55, 2.35, 3.7], [2.75, 2.95, 3.95], 0.26), // superior orbital fissure
      capsule([1.05, 2.6, 3.3], [1.6, 2.35, 4.4], 0.26), // optic canal
      capsule([4.8, 0, 0], [7.4, 0, 0], 0.45), // external acoustic
    ),
    [1.0, -3.3, -1.8],
    [7.5, 3.0, 4.5],
    0.2,
  );
  const glenoid = sphere([5.05, 0.15, 1.1], 0.55);

  const vault: Sdf = (x, y, z) => {
    const outer = vaultOuter(x, y, z);
    if (outer > 0.9) return outer;
    const inner = smin(vaultInner(x, y, z), occInner(x, y, z), 1.2);
    const floor = cranialFloorY(x, z);
    const shell = smax(Math.max(outer, -inner), floor - 0.25 - y, 0.3);
    const slab = smax(Math.abs(y - floor) - 0.34, outer + 0.05, 0.2);
    return smin(shell, slab, 0.35);
  };

  return mirrorX(
    csg(vault, [
      ["+", petrous, 0.4],
      ["+", dorsumSellae, 0.15],
      ["+", clinoid, 0.15],
      ["+", face, 0.5],
      ["+", mastoid, 0.4],
      ["+", condyle, 0.15],
      ["+", protuberance, 0.3],
      ["-", orbitCavity, 0.25],
      ["-", nasalAperture, 0.2],
      ["-", nasalCavity, 0.2],
      ["-", maxSinus, 0.2],
      ["-", foramenMagnum, 0.1],
      ["-", foramina, 0.06],
      ["-", glenoid, 0.2],
    ]),
  );
}

/* ------------------------------------------------------------------ */
/* Mandible + lower teeth                                              */
/* ------------------------------------------------------------------ */

export function mandibleSdf(): Sdf {
  const bodyPts: Vec3[] = [
    [4.7, -7.0, 1.7],
    [3.4, -7.8, 3.9],
    [2.85, -8.0, 5.6],
    [1.9, -8.1, 7.4],
    [0, -8.1, 8.1],
  ];
  const heights = [0.95, 1.1, 1.15, 1.2, 1.25];
  const body: Shape[] = [];
  for (let i = 0; i + 1 < bodyPts.length; i += 1) {
    body.push(band(bodyPts[i], bodyPts[i + 1], 0.42, [heights[i], heights[i + 1]], UP));
  }
  const chin = ellipsoid([0, -8.85, 8.25], [1.3, 0.7, 0.55]);
  const ramus = band([4.75, -6.8, 1.55], [4.95, -1.0, 0.95], 0.62, 0.26, LATERAL);
  const coronoid = band([4.7, -5.8, 2.8], [4.35, -0.9, 3.45], [0.5, 0.3], 0.24, LATERAL);
  const ramusFill = band([4.75, -6.2, 2.2], [4.72, -3.4, 2.25], 1.05, 0.26, LATERAL);
  const head = ellipsoid([5.05, -0.25, 0.98], [0.95, 0.42, 0.5]);
  const lowerTeeth = teethRow(3.05, 4.4, 3.7, -6.45, 0.4, 3.8);

  return mirrorX(
    csg(body[0], [
      ...body.slice(1).map((b) => ["+", b, 0.3] as const),
      ["+", chin, 0.3],
      ["+", ramus, 0.3],
      ["+", coronoid, 0.3],
      ["+", ramusFill, 0.4],
      ["+", head, 0.25],
      ["+", lowerTeeth, 0.12],
    ]),
  );
}

/* ------------------------------------------------------------------ */
/* Cervical spine C1-C7                                                */
/* ------------------------------------------------------------------ */

type Level = { y: number; z: number; spine: number };

const CERVICAL: Level[] = [
  { y: -5.9, z: -0.1, spine: 2.9 }, // C2
  { y: -7.8, z: -0.3, spine: 2.6 },
  { y: -9.6, z: -0.4, spine: 2.7 },
  { y: -11.4, z: -0.48, spine: 2.8 },
  { y: -13.2, z: -0.58, spine: 3.0 },
  { y: -15.0, z: -0.78, spine: 3.9 }, // C7, vertebra prominens
];

function vertebra(level: Level): Sdf {
  const { y: yb, z: zb, spine } = level;
  const zc = zb - 1.75;
  const transverse = band([1.0, yb, zb - 0.55], [2.45, yb - 0.1, zb - 0.9], 0.3, 0.25, FORWARD);
  const pillar = capsule([1.5, yb + 0.55, zc + 0.15], [1.5, yb - 0.55, zc + 0.05], 0.45);
  const spinous = roundCone([0, yb, zc - 0.85], [0, yb - 0.7, zc - spine], 0.34, 0.26);
  const bodyAndArch: Sdf = (x, y, z) => {
    const dr = (Math.sqrt((x / 0.95) ** 2 + ((z - zb) / 0.7) ** 2) - 1) * 0.7;
    const dy = Math.abs(y - yb) - 0.62;
    const bodyD = Math.min(Math.max(dr, dy), 0) + Math.sqrt(Math.max(dr, 0) ** 2 + Math.max(dy, 0) ** 2) - 0.08;
    const ringR = Math.sqrt((x / 1.05) ** 2 + ((z - zc) / 0.95) ** 2) - 1;
    const ring = Math.sqrt((ringR * 0.95) ** 2 + ((y - yb) * 0.7) ** 2) - 0.28;
    return smin(bodyD, ring, 0.25);
  };
  return csg(bodyAndArch, [
    ["+", transverse, 0.2],
    ["+", pillar, 0.25],
    ["+", spinous, 0.2],
  ]);
}

export function spineSdf(): Sdf {
  const levels = CERVICAL.map(vertebra);
  const dens = capsule([0, -5.2, -0.05], [0, -4.0, -0.2], 0.45);
  const atlasRing: Sdf = (x, y, z) => {
    const r = Math.sqrt((x / 1.5) ** 2 + ((z + 1.5) / 2.0) ** 2) - 1;
    return Math.sqrt((r * 1.5) ** 2 + (y + 4.2) ** 2) - 0.3;
  };
  const lateralMass = ellipsoid([1.4, -4.2, -1.0], [0.6, 0.5, 0.85]);
  const atlasTransverse = band([1.9, -4.2, -1.05], [3.6, -4.25, -1.2], 0.35, 0.3, FORWARD);
  const tubercle = sphere([0, -4.25, -3.55], 0.35);
  return mirrorX((x, y, z) => {
    let d = smin(atlasRing(x, y, z), lateralMass(x, y, z), 0.3);
    d = smin(d, atlasTransverse(x, y, z), 0.2);
    d = smin(d, tubercle(x, y, z), 0.2);
    d = Math.min(d, dens(x, y, z));
    for (let i = 0; i < CERVICAL.length; i += 1) {
      if (Math.abs(y - CERVICAL[i].y) < 2.4) d = Math.min(d, levels[i](x, y, z));
    }
    return d;
  });
}

/* ------------------------------------------------------------------ */
/* Cerebrum                                                            */
/* ------------------------------------------------------------------ */

/**
 * Underside of the hemispheres. It follows the cranial floor laterally, but
 * medially the basal forebrain sits above the optic chiasm and the tracts
 * (y ~3.25), leaving the diencephalon, peduncles and nerve origins exposed.
 */
function cerebralFloorY(ax: number, z: number): number {
  const basal = 3.25 * (1 - smoothstep(1.9, 2.8, ax)) * smoothstep(-1.8, -0.8, z) * (1 - smoothstep(3.2, 4.2, z));
  return smax(cranialFloorY(ax, z) + 0.45, basal, 0.4);
}

function cerebrumBase(): Sdf {
  const main = ellipsoid([3.0, 4.7, -0.5], [3.1, 6.1, 8.6]);
  const occipital = ellipsoid([2.9, 3.3, -5.6], [2.9, 3.4, 3.6]);
  const temporal = orientedEllipsoid([3.95, 1.25, 0.3], [0.08, -0.12, 1], [4.3, 1.7, 1.95]);
  return (x, y, z) => {
    const ax = Math.abs(x);
    let d = smin(main(ax, y, z), temporal(ax, y, z), 0.9);
    d = smin(d, occipital(ax, y, z), 1.0);
    d = smax(d, cerebralFloorY(ax, z) - y, 0.7);
    return smax(d, 0.17 - ax, 0.25);
  };
}

export function cerebrumSdf(): { sdf: Sdf; coarse: Sdf } {
  const base = cerebrumBase();
  const noise = createNoise3(11);
  const sylvian = group(
    0,
    chain(
      [
        [5.3, 2.55, 4.3],
        [5.9, 3.15, 1.8],
        [5.9, 3.95, -0.9],
        [5.5, 4.85, -2.8],
      ],
      0.3,
    ),
    chain(
      [
        [4.5, 2.6, 4.0],
        [5.0, 3.1, 1.8],
        [5.0, 3.8, -0.8],
      ],
      0.32,
    ),
  );
  const central = chain(
    [
      [0.35, 10.4, -1.3],
      [2.2, 9.7, -0.7],
      [4.2, 8.0, 0.1],
      [5.5, 5.8, 0.9],
      [5.9, 4.6, 1.2],
    ],
    0.17,
  );
  const sdf: Sdf = (x, y, z) => {
    let d = base(x, y, z);
    if (d > 1.1 || d < -1.4) return d;
    const ax = Math.abs(x);
    d = smax(d, -sylvian(ax, y, z), 0.2);
    d = smax(d, -central(ax, y, z), 0.15);
    const o = x < 0 ? 31.7 : 0;
    const warp = noise(ax * 0.23 + o, y * 0.23, z * 0.23) * 0.9;
    const g1 = noise(ax * 0.46 + warp + o, y * 0.46 + warp, z * 0.46 - warp);
    const g2 = noise(ax * 0.9 + o + 7, y * 0.9, z * 0.9);
    // Smooth |g1| so groove floors are rounded rather than creased.
    const s1 = Math.sqrt(g1 * g1 + 0.0025);
    // Narrow deep sulci between broad, rounded gyral crowns.
    const sulcus = 1 - smoothstep(0.05, 0.28, s1);
    const crown = smoothstep(0.24, 0.75, s1);
    const tertiary = 1 - smoothstep(0, 0.1, Math.abs(g2));
    return d + 0.46 * sulcus - 0.14 * crown + 0.05 * tertiary * crown;
  };
  return { sdf, coarse: base };
}

/* ------------------------------------------------------------------ */
/* Cerebellum                                                          */
/* ------------------------------------------------------------------ */

export function cerebellumSdf(): { sdf: Sdf; coarse: Sdf } {
  const noise = createNoise3(23);
  const hemi = ellipsoid([2.4, -0.15, -5.35], [2.5, 2.0, 3.0]);
  const vermis = ellipsoid([0, -0.1, -5.2], [1.1, 2.0, 2.9]);
  const tonsil = ellipsoid([0.75, -1.9, -3.9], [0.55, 0.5, 0.75]);
  const flocculus = ellipsoid([2.7, 0.3, -2.75], [0.5, 0.35, 0.45]);
  const stemBed = ellipsoid([0, 0.4, -1.4], [1.45, 3.2, 1.35]);
  const notch = ellipsoid([0, -0.9, -8.4], [0.5, 1.2, 0.9]);
  const coarse: Sdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = smin(hemi(ax, y, z), vermis(ax, y, z), 0.9);
    d = smin(d, tonsil(ax, y, z), 0.35);
    d = smin(d, flocculus(ax, y, z), 0.3);
    d = smax(d, -stemBed(ax, y, z), 0.5);
    d = smax(d, -notch(ax, y, z), 0.4);
    return smax(d, y - 1.75 - 0.08 * ax, 0.6);
  };
  const sdf: Sdf = (x, y, z) => {
    const d = coarse(x, y, z);
    if (d > 0.8 || d < -1) return d;
    const ty = y + 0.2;
    const tz = z + 4.3;
    const theta = Math.atan2(ty, -tz);
    const wobble = noise(x * 0.5, y * 0.5, z * 0.5) * 1.4;
    const folia = 1 - smoothstep(0, 0.55, Math.abs(Math.sin(theta * 21 + wobble)));
    const fissure = 1 - smoothstep(0, 0.12, Math.abs(Math.sin(theta * 3.2 + 0.4)));
    return d + 0.07 * folia + 0.26 * fissure;
  };
  return { sdf, coarse };
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export const NEURO_MODELS: OrganModel[] = [
  {
    id: "brainstem",
    layer: "brainstem",
    material: "stem",
    grid: { min: [-2.95, -6.3, -3.45], max: [2.95, 6.6, 1.95], cell: 0.055, lipschitz: 1.4 },
    build: () => ({ sdf: brainstemSdf() }),
  },
  {
    id: "skull",
    layer: "skull",
    material: "bone",
    grid: { min: [-7.6, -6.6, -11.2], max: [7.6, 12.4, 11.2], cell: 0.14, lipschitz: 1.6 },
    build: () => ({ sdf: skullSdf() }),
  },
  {
    id: "mandible",
    layer: "skull",
    material: "bone",
    grid: { min: [-6.3, -10.1, 0.2], max: [6.3, 0.6, 9.4], cell: 0.1, lipschitz: 1.6 },
    build: () => ({ sdf: mandibleSdf() }),
  },
  {
    id: "spine",
    layer: "skull",
    material: "bone",
    grid: { min: [-4.1, -16.2, -7.0], max: [4.1, -2.9, 1.3], cell: 0.09, lipschitz: 1.5 },
    build: () => ({ sdf: spineSdf() }),
  },
  {
    id: "cerebellum",
    layer: "brain",
    material: "cerebellum",
    grid: { min: [-5.2, -2.9, -8.9], max: [5.2, 2.2, -1.6], cell: 0.075, lipschitz: 1.6, slack: 0.45 },
    build: () => cerebellumSdf(),
  },
  {
    id: "cerebrum",
    layer: "brain",
    material: "cortex",
    grid: { min: [-6.6, -1.4, -9.6], max: [6.6, 10.9, 8.4], cell: 0.105, lipschitz: 1.6, slack: 0.6 },
    build: () => cerebrumSdf(),
  },
];

export function buildOrganMesh(model: Pick<OrganModel, "grid" | "build">): MeshData {
  const { sdf, coarse } = model.build();
  return meshSdf(sdf, { ...model.grid, coarse: coarse ?? model.grid.coarse });
}
