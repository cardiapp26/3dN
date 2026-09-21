import { CatmullRomCurve3, Vector3 } from "three";

export type Vec3 = [number, number, number];

export type NervePath = {
  id: number;
  name: string;
  points: Vec3[];
};

/** Right-sided paths (patient right = +X). Left is mirrored. */
export const NERVE_PATHS: NervePath[] = [
  {
    id: 1,
    name: "I",
    points: [
      [0.28, -0.15, 2.55],
      [0.32, 0.55, 2.05],
      [0.38, 1.05, 1.72],
      [0.42, 1.38, 1.42],
      [0.5, 1.48, 0.95],
    ],
  },
  {
    id: 2,
    name: "II",
    points: [
      [1.62, 0.2, 2.42],
      [1.15, 0.18, 1.85],
      [0.55, 0.12, 1.25],
      [0.12, 0.08, 0.92],
      [0.35, 0.18, 0.15],
      [0.55, 0.35, -0.55],
    ],
  },
  {
    id: 3,
    name: "III",
    points: [
      [0.18, 0.28, -0.22],
      [0.42, 0.18, 0.25],
      [0.85, 0.08, 0.85],
      [1.25, 0.14, 1.55],
      [1.55, 0.22, 2.15],
    ],
  },
  {
    id: 4,
    name: "IV",
    points: [
      [0.12, 0.48, -0.92],
      [0.55, 0.42, -0.7],
      [0.95, 0.28, -0.25],
      [1.15, 0.16, 0.55],
      [1.35, 0.32, 1.45],
      [1.48, 0.55, 2.15],
    ],
  },
  {
    id: 5,
    name: "V",
    points: [
      [0.78, -0.42, 0.12],
      [1.15, -0.22, 0.55],
      [1.42, -0.08, 0.95],
    ],
  },
  {
    id: 6,
    name: "VI",
    points: [
      [0.22, -1.12, 0.02],
      [0.38, -0.7, 0.35],
      [0.62, -0.22, 0.72],
      [0.95, 0.02, 1.15],
      [1.45, 0.16, 1.85],
      [2.08, 0.2, 2.38],
    ],
  },
  {
    id: 7,
    name: "VII",
    points: [
      [1.05, -0.92, 0.02],
      [1.35, -0.78, 0.42],
      [1.58, -0.95, 0.72],
      [1.68, -1.35, 1.05],
      [1.55, -0.85, 1.55],
      [1.45, -0.15, 1.95],
    ],
  },
  {
    id: 8,
    name: "VIII",
    points: [
      [1.12, -1.0, -0.02],
      [1.42, -0.82, 0.38],
      [1.72, -0.72, 0.72],
      [1.95, -0.68, 0.98],
    ],
  },
  {
    id: 9,
    name: "IX",
    points: [
      [0.52, -1.62, 0.04],
      [0.95, -1.78, 0.32],
      [1.28, -1.95, 0.55],
      [0.95, -2.15, 1.15],
      [0.55, -2.05, 1.75],
    ],
  },
  {
    id: 10,
    name: "X",
    points: [
      [0.48, -1.82, 0.0],
      [0.92, -2.05, 0.32],
      [1.15, -2.45, 0.48],
      [0.95, -3.35, 0.55],
      [0.62, -4.55, 0.45],
      [0.35, -5.55, 0.55],
      [0.28, -6.55, 0.72],
      [0.42, -7.45, 0.85],
    ],
  },
  {
    id: 11,
    name: "XI",
    points: [
      [0.38, -3.35, -0.35],
      [0.32, -2.55, -0.18],
      [0.55, -2.15, 0.15],
      [1.15, -2.05, 0.42],
      [1.55, -2.55, 0.95],
      [1.85, -3.15, 0.15],
      [2.15, -3.85, -0.85],
    ],
  },
  {
    id: 12,
    name: "XII",
    points: [
      [0.28, -1.88, 0.12],
      [0.65, -2.05, 0.42],
      [1.05, -2.12, 0.72],
      [0.72, -2.05, 1.35],
      [0.32, -1.85, 1.95],
    ],
  },
];

export const NERVE_BRANCHES: Record<number, Vec3[][]> = {
  3: [
    [
      [1.55, 0.22, 2.15],
      [1.62, 0.55, 2.32],
    ],
    [
      [1.55, 0.22, 2.15],
      [1.62, -0.12, 2.38],
    ],
    [
      [1.55, 0.22, 2.15],
      [1.35, 0.2, 2.48],
    ],
  ],
  5: [
    [
      [1.42, -0.08, 0.95],
      [1.48, 0.55, 1.55],
      [1.35, 1.25, 2.05],
    ],
    [
      [1.42, -0.08, 0.95],
      [1.58, -0.25, 1.55],
      [1.52, -0.45, 2.15],
    ],
    [
      [1.42, -0.08, 0.95],
      [1.48, -0.85, 1.35],
      [1.35, -1.25, 1.85],
    ],
  ],
  7: [
    [
      [1.45, -0.15, 1.95],
      [1.25, 0.85, 2.05],
    ],
    [
      [1.45, -0.15, 1.95],
      [1.72, 0.25, 2.25],
    ],
    [
      [1.45, -0.15, 1.95],
      [1.55, -0.55, 2.25],
    ],
    [
      [1.45, -0.15, 1.95],
      [1.25, -1.15, 2.05],
    ],
  ],
  10: [
    [
      [0.62, -4.55, 0.45],
      [0.15, -5.15, 0.85],
    ],
    [
      [0.62, -4.55, 0.45],
      [1.35, -5.05, 0.55],
    ],
    [
      [0.35, -5.55, 0.55],
      [0.55, -6.85, 1.15],
    ],
  ],
};

export function curveFrom(points: Vec3[], scale = 1) {
  const pts = points.map(([x, y, z]) => new Vector3(x * scale, y * scale, z * scale));
  return new CatmullRomCurve3(pts, false, "catmullrom", 0.35);
}

export function mirrorX(points: Vec3[]): Vec3[] {
  return points.map(([x, y, z]) => [-x, y, z]);
}

export type TargetMesh = {
  id: string;
  nerveIds: number[];
  kind: "muscle" | "organ" | "gland" | "sense";
  position: Vec3;
  rotation?: Vec3;
  scale: Vec3;
  shape: "ellipsoid" | "cylinder" | "box";
  label: string;
};

export const TARGETS: TargetMesh[] = [
  { id: "sr", nerveIds: [3], kind: "muscle", position: [1.62, 0.52, 2.42], scale: [0.12, 0.08, 0.38], shape: "ellipsoid", label: "Rectus sup." },
  { id: "ir", nerveIds: [3], kind: "muscle", position: [1.62, -0.1, 2.42], scale: [0.12, 0.08, 0.38], shape: "ellipsoid", label: "Rectus inf." },
  { id: "mr", nerveIds: [3], kind: "muscle", position: [1.32, 0.2, 2.48], scale: [0.1, 0.08, 0.36], shape: "ellipsoid", label: "Rectus med." },
  { id: "lr", nerveIds: [6], kind: "muscle", position: [2.05, 0.2, 2.42], scale: [0.1, 0.08, 0.36], shape: "ellipsoid", label: "Rectus lat." },
  { id: "so", nerveIds: [4], kind: "muscle", position: [1.5, 0.58, 2.28], rotation: [0.4, 0.5, 0], scale: [0.1, 0.07, 0.4], shape: "ellipsoid", label: "Obliquus sup." },
  { id: "io", nerveIds: [3], kind: "muscle", position: [1.55, -0.05, 2.55], rotation: [0.3, -0.4, 0], scale: [0.1, 0.07, 0.32], shape: "ellipsoid", label: "Obliquus inf." },
  { id: "masseter", nerveIds: [5], kind: "muscle", position: [1.55, -1.05, 1.72], scale: [0.28, 0.55, 0.22], shape: "ellipsoid", label: "Masseter" },
  { id: "temporalis", nerveIds: [5], kind: "muscle", position: [1.55, 0.55, 1.15], scale: [0.18, 0.7, 0.42], shape: "ellipsoid", label: "Temporalis" },
  { id: "frontalis", nerveIds: [7], kind: "muscle", position: [0.7, 1.55, 2.15], scale: [0.7, 0.18, 0.12], shape: "ellipsoid", label: "Frontalis" },
  { id: "oo", nerveIds: [7], kind: "muscle", position: [1.55, 0.28, 2.55], scale: [0.42, 0.28, 0.08], shape: "ellipsoid", label: "Orb. oculi" },
  { id: "or", nerveIds: [7], kind: "muscle", position: [0.45, -1.15, 2.42], scale: [0.55, 0.16, 0.1], shape: "ellipsoid", label: "Orb. oris" },
  { id: "scm", nerveIds: [11], kind: "muscle", position: [1.35, -2.55, 0.85], rotation: [0.7, 0.2, 0.4], scale: [0.18, 1.15, 0.16], shape: "ellipsoid", label: "SCM" },
  { id: "trap", nerveIds: [11], kind: "muscle", position: [1.85, -3.35, -0.55], rotation: [0.9, 0.3, 0], scale: [0.7, 1.4, 0.12], shape: "ellipsoid", label: "Trapezius" },
  { id: "tongue", nerveIds: [12], kind: "muscle", position: [0, -1.85, 2.05], scale: [0.42, 0.18, 0.7], shape: "ellipsoid", label: "Lingua" },
  { id: "heart", nerveIds: [10], kind: "organ", position: [0.15, -5.35, 0.75], scale: [0.7, 0.85, 0.55], shape: "ellipsoid", label: "Cor" },
  { id: "lung-r", nerveIds: [10], kind: "organ", position: [1.35, -5.15, 0.35], scale: [0.7, 1.25, 0.55], shape: "ellipsoid", label: "Pulmo" },
  { id: "lung-l", nerveIds: [10], kind: "organ", position: [-1.25, -5.15, 0.35], scale: [0.65, 1.2, 0.5], shape: "ellipsoid", label: "Pulmo" },
  { id: "stomach", nerveIds: [10], kind: "organ", position: [0.45, -6.95, 0.85], scale: [0.7, 0.45, 0.4], shape: "ellipsoid", label: "Gaster" },
  { id: "parotid", nerveIds: [9], kind: "gland", position: [1.72, -0.95, 1.45], scale: [0.28, 0.38, 0.22], shape: "ellipsoid", label: "Parotis" },
  { id: "lacrimal", nerveIds: [7], kind: "gland", position: [1.85, 0.55, 2.35], scale: [0.16, 0.12, 0.12], shape: "ellipsoid", label: "Lakrimal" },
  { id: "cochlea", nerveIds: [8], kind: "sense", position: [1.95, -0.68, 0.98], scale: [0.16, 0.16, 0.16], shape: "ellipsoid", label: "Koklea" },
];

export const NUCLEI: { id: number; position: Vec3; label: string }[] = [
  { id: 3, position: [0.12, 0.32, -0.28], label: "Ncl. III" },
  { id: 4, position: [0.12, 0.42, -0.55], label: "Ncl. IV" },
  { id: 5, position: [0.45, -0.35, -0.05], label: "Ncl. V" },
  { id: 6, position: [0.12, -0.95, -0.05], label: "Ncl. VI" },
  { id: 7, position: [0.42, -0.92, -0.08], label: "Ncl. VII" },
  { id: 8, position: [0.55, -1.05, -0.12], label: "Ncl. VIII" },
  { id: 9, position: [0.38, -1.55, -0.02], label: "Ncl. IX" },
  { id: 10, position: [0.32, -1.75, -0.05], label: "Ncl. X" },
  { id: 11, position: [0.28, -2.15, -0.12], label: "Ncl. XI" },
  { id: 12, position: [0.1, -1.82, -0.02], label: "Ncl. XII" },
];
