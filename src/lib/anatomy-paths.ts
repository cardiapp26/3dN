/**
 * Cranial nerve courses, ganglia, nuclei, the eyeball and camera views in
 * the anatomy scene frame (cm; +x patient left, +y up, +z
 * anterior; origin between the ear canals on the Frankfort plane).
 *
 * Courses are authored on the +x (left) side and mirrored. Each follows its
 * real route through the skull base: the foramina carved in
 * `anatomy/neuro-models.ts` sit on these points. Central ends marked with an
 * `anchor` are snapped onto the sculpted brainstem (or, for the forebrain
 * nerves, the cerebrum) at load, so no nerve starts or ends in mid-air.
 */
import { CatmullRomCurve3, Vector3 } from "three";
import { brainstemSdf, cerebrumSdf } from "./anatomy/neuro-models.ts";
import { projectToSurface, type Sdf } from "./anatomy/sdf.ts";

export type Vec3 = [number, number, number];

export type AnchorTarget = "brainstem" | "cerebrum";

export type Course = {
  points: Vec3[];
  /** Which end touches the brain and is snapped onto its surface. */
  anchor?: "start" | "end";
  /** Surface the anchored end is snapped to (default: brainstem). */
  anchorTo?: AnchorTarget;
  /** Draw on one side only (1 = +x/left, -1 = right) for asymmetric routes. */
  side?: 1 | -1;
};

export type NervePath = {
  id: number;
  /** Tube radius at the root in cm; courses taper distally. */
  radius: number;
  /** Afferent nerves are authored periphery -> brain, so signals run that way. */
  afferent: boolean;
  main: Course;
  branches: Course[];
};

const RAW_PATHS: NervePath[] = [
  {
    id: 1,
    radius: 0.16,
    afferent: true,
    main: {
      // Olfactory mucosa -> cribriform plate -> bulb -> tract -> lateral stria.
      anchor: "end",
      anchorTo: "cerebrum",
      points: [
        [0.3, 1.6, 7.2],
        [0.5, 2.5, 7.0],
        [0.62, 3.2, 6.6],
        [0.72, 3.6, 5.8],
        [0.85, 3.62, 4.9],
        [1.05, 3.6, 4.0],
        [1.45, 3.45, 3.1],
        [1.95, 3.2, 2.5],
        [2.3, 1.98, 2.25],
      ],
    },
    branches: [
      {
        // Fila olfactoria from the septal and superior-concha mucosa.
        points: [
          [0.25, 1.7, 6.5],
          [0.45, 2.6, 6.4],
          [0.62, 3.3, 6.3],
        ],
      },
      {
        points: [
          [0.98, 1.8, 7.6],
          [0.85, 2.7, 7.35],
          [0.66, 3.35, 6.95],
        ],
      },
      {
        // Medial stria to the septal area.
        anchor: "end",
        anchorTo: "cerebrum",
        points: [
          [1.45, 3.45, 3.1],
          [0.9, 3.6, 2.75],
          [0.45, 3.7, 2.55],
        ],
      },
    ],
  },
  {
    id: 2,
    radius: 0.2,
    afferent: true,
    main: {
      // Optic tract ends in the lateral geniculate body.
      anchor: "end",
      points: [
        [2.95, 1.35, 5.85],
        [2.45, 1.62, 5.0],
        [1.8, 1.98, 4.35],
        [1.35, 2.38, 3.85],
        [0.8, 2.72, 3.15],
        [0.3, 2.95, 2.7],
        [0.6, 3.05, 2.25],
        [1.25, 3.2, 1.2],
        [1.75, 3.5, 0.0],
        [1.8, 4.0, -1.05],
      ],
    },
    branches: [
      {
        // Nasal retinal fibres cross in the chiasm to the opposite tract.
        points: [
          [0.4, 2.95, 2.65],
          [-0.55, 3.03, 2.3],
          [-1.2, 3.18, 1.25],
        ],
      },
    ],
  },
  {
    id: 3,
    radius: 0.13,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [0.45, 3.1, 0.45],
        [0.75, 3.05, 1.2],
        [1.2, 2.9, 1.9],
        [1.55, 2.6, 2.7],
        [1.85, 2.35, 3.8],
        [2.1, 2.05, 4.4],
        [2.6, 1.0, 5.2],
        [3.0, 0.35, 6.2],
      ],
    },
    branches: [
      {
        points: [
          [2.1, 2.05, 4.4],
          [2.45, 2.45, 5.1],
          [2.9, 2.6, 5.9],
        ],
      },
      {
        points: [
          [2.1, 2.05, 4.4],
          [2.05, 1.55, 5.2],
          [1.95, 1.45, 5.9],
        ],
      },
      {
        points: [
          [2.6, 1.0, 5.2],
          [3.3, 0.35, 6.4],
          [3.75, 0.5, 6.8],
        ],
      },
    ],
  },
  {
    id: 4,
    radius: 0.08,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [0.3, 2.85, -1.7],
        [0.95, 2.8, -1.6],
        [1.45, 2.8, -0.8],
        [1.55, 2.78, 0.4],
        [1.5, 2.7, 1.6],
        [1.78, 2.45, 2.8],
        [1.78, 2.62, 3.85],
        [1.9, 2.85, 4.6],
        [1.8, 2.72, 5.7],
      ],
    },
    branches: [],
  },
  {
    id: 5,
    radius: 0.26,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [1.65, 1.7, 0.1],
        [2.0, 1.75, 0.6],
        [2.3, 1.35, 1.3],
        [2.3, 1.05, 2.1],
        [2.12, 1.0, 3.2],
        [2.4, 0.75, 4.1],
        [2.75, 0.35, 4.9],
        [2.95, -0.1, 6.1],
        [2.9, -0.55, 7.6],
        [2.8, -1.3, 8.55],
        [3.15, -1.95, 9.2],
      ],
    },
    branches: [
      {
        // V1 ophthalmic: frontal nerve to the forehead.
        points: [
          [2.2, 1.35, 1.7],
          [2.0, 1.85, 2.75],
          [2.05, 2.28, 3.85],
          [2.5, 2.9, 5.2],
          [2.65, 3.2, 7.2],
          [2.6, 3.35, 8.7],
          [2.75, 5.2, 8.75],
          [2.6, 7.0, 8.25],
        ],
      },
      {
        points: [
          [2.05, 2.28, 3.85],
          [1.9, 2.15, 5.0],
          [1.75, 2.3, 6.8],
        ],
      },
      {
        points: [
          [2.5, 2.9, 5.2],
          [3.4, 2.75, 6.2],
          [4.0, 2.5, 6.9],
        ],
      },
      {
        // V3 mandibular trunk through foramen ovale.
        points: [
          [2.45, 1.1, 1.65],
          [2.45, 0.3, 2.0],
          [2.9, -0.9, 2.6],
        ],
      },
      {
        // Inferior alveolar -> mandibular canal -> mental foramen.
        points: [
          [2.9, -0.9, 2.6],
          [4.3, -3.6, 2.55],
          [4.4, -5.6, 2.4],
          [3.5, -7.55, 3.95],
          [2.85, -7.8, 5.6],
          [2.3, -7.7, 7.0],
          [2.25, -7.5, 7.6],
          [1.4, -7.7, 8.6],
        ],
      },
      {
        // Lingual nerve to the anterior tongue.
        points: [
          [2.9, -0.9, 2.6],
          [3.35, -3.4, 3.3],
          [3.15, -6.2, 4.4],
          [2.1, -6.9, 5.8],
          [1.3, -6.2, 7.3],
        ],
      },
      {
        points: [
          [2.9, -0.9, 2.6],
          [4.3, -1.1, 2.2],
          [5.35, -2.4, 2.9],
        ],
      },
      {
        points: [
          [2.9, -0.9, 2.6],
          [4.9, -0.2, 2.9],
          [6.3, 1.6, 2.6],
          [6.55, 2.6, 2.2],
        ],
      },
      {
        points: [
          [2.9, -0.9, 2.6],
          [4.3, -1.3, 0.7],
          [5.9, -0.6, 0.9],
          [6.6, 1.2, 1.1],
          [7.4, 4.0, 1.3],
        ],
      },
    ],
  },
  {
    id: 6,
    radius: 0.1,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [0.35, 0.55, 0.2],
        [0.55, 1.4, 0.95],
        [0.85, 2.1, 1.45],
        [1.45, 2.3, 2.3],
        [1.9, 2.15, 3.8],
        [2.6, 1.8, 4.8],
        [3.7, 1.6, 5.7],
      ],
    },
    branches: [],
  },
  {
    id: 7,
    radius: 0.12,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [1.25, 0.6, -0.35],
        [1.95, 0.8, -0.25],
        [2.6, 0.78, -0.15],
        [3.3, 0.8, 0.05],
        [3.55, 0.82, 0.7],
        [4.15, 0.62, 0.3],
        [4.45, 0.25, -0.5],
        [4.42, -1.2, -0.62],
        [4.3, -2.4, -0.4],
        [4.9, -2.75, 0.5],
        [5.45, -2.6, 1.7],
      ],
    },
    branches: [
      {
        points: [
          [5.45, -2.6, 1.7],
          [6.95, -0.4, 3.1],
          [6.5, 2.4, 5.0],
          [4.3, 5.0, 7.6],
        ],
      },
      {
        points: [
          [5.45, -2.6, 1.7],
          [6.55, -1.2, 4.2],
          [5.85, -0.3, 6.8],
          [5.05, 1.1, 8.7],
        ],
      },
      {
        points: [
          [5.45, -2.6, 1.7],
          [6.3, -3.2, 4.4],
          [4.4, -4.3, 7.6],
          [2.8, -5.9, 9.5],
        ],
      },
      {
        points: [
          [5.45, -2.6, 1.7],
          [6.1, -5.8, 2.9],
          [3.95, -8.4, 5.3],
          [2.5, -8.4, 8.3],
        ],
      },
      {
        points: [
          [5.45, -2.6, 1.7],
          [5.2, -6.3, 1.7],
          [4.7, -10.0, 2.8],
        ],
      },
      {
        // Greater petrosal -> pterygopalatine ganglion -> lacrimal gland.
        points: [
          [3.55, 0.82, 0.7],
          [2.8, 0.75, 2.2],
          [2.45, 0.35, 4.25],
          [3.3, 1.5, 6.1],
          [4.1, 2.5, 7.1],
        ],
      },
      {
        // Chorda tympani joins the lingual nerve.
        points: [
          [4.42, -1.0, -0.62],
          [4.3, -0.35, 0.55],
          [3.9, -0.95, 1.5],
          [3.35, -3.25, 3.35],
          [2.95, -6.3, 4.5],
          [1.7, -6.3, 7.0],
        ],
      },
    ],
  },
  {
    id: 8,
    radius: 0.15,
    afferent: true,
    main: {
      anchor: "end",
      points: [
        [3.45, 0.35, 0.35],
        [3.3, 0.5, 0.0],
        [2.6, 0.5, -0.38],
        [1.95, 0.55, -0.6],
        [1.45, 0.65, -0.62],
      ],
    },
    branches: [
      {
        points: [
          [3.9, 0.6, -0.35],
          [3.3, 0.66, -0.25],
          [2.7, 0.6, -0.45],
          [2.0, 0.58, -0.6],
        ],
      },
    ],
  },
  {
    id: 9,
    radius: 0.1,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [0.95, 0.0, -0.95],
        [1.9, -0.85, -1.3],
        [2.72, -1.45, -1.2],
        [2.85, -2.35, -0.95],
        [2.9, -3.8, 0.0],
        [2.6, -5.2, 1.3],
        [1.7, -6.7, 2.9],
        [1.05, -6.55, 4.0],
      ],
    },
    branches: [
      {
        // Tympanic -> lesser petrosal -> otic ganglion -> parotid.
        points: [
          [2.85, -2.2, -0.95],
          [3.55, -0.7, -0.35],
          [3.0, 0.3, 1.1],
          [2.35, -0.4, 2.05],
          [3.6, -1.0, 1.5],
          [5.2, -1.9, 1.3],
        ],
      },
      {
        points: [
          [2.9, -3.8, 0.0],
          [2.7, -6.5, 1.8],
          [2.6, -9.0, 2.4],
        ],
      },
    ],
  },
  {
    id: 10,
    radius: 0.13,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [0.95, -0.6, -1.1],
        [1.9, -1.2, -1.5],
        [2.82, -1.7, -1.45],
        [2.95, -2.4, -1.2],
        [3.0, -3.9, -0.6],
        [2.9, -7.0, 0.6],
        [2.8, -11.0, 1.3],
        [2.7, -15.0, 1.8],
        [2.9, -18.2, 2.4],
        [3.4, -21.0, 1.4],
        [2.5, -25.5, 0.7],
        [1.1, -30.0, 0.35],
        [1.2, -35.8, 2.0],
        [3.2, -41.8, 3.4],
      ],
    },
    branches: [
      {
        points: [
          [3.0, -3.5, -0.7],
          [2.2, -4.8, 1.0],
          [1.75, -5.8, 2.0],
        ],
      },
      {
        points: [
          [3.0, -4.3, -0.45],
          [2.6, -8.0, 2.2],
          [1.5, -11.2, 4.1],
        ],
      },
      {
        // Left recurrent laryngeal hooks under the aortic arch.
        side: 1,
        points: [
          [2.9, -18.2, 2.4],
          [3.2, -20.2, 1.9],
          [3.1, -22.6, 0.7],
          [1.2, -22.6, -0.2],
          [1.0, -18.0, 1.6],
          [1.0, -14.5, 2.4],
          [1.0, -12.8, 3.6],
        ],
      },
      {
        // Right recurrent laryngeal hooks under the subclavian artery.
        side: -1,
        points: [
          [2.79, -16.4, 2.06],
          [4.1, -18.0, 2.3],
          [4.4, -19.3, 1.0],
          [2.8, -18.8, 0.4],
          [1.0, -15.5, 1.8],
          [1.0, -12.8, 3.6],
        ],
      },
      {
        // Cardiac branches to the plexus under the arch.
        points: [
          [2.8, -14.0, 1.7],
          [1.9, -19.5, 2.4],
          [0.6, -22.6, 2.4],
        ],
      },
      {
        points: [
          [2.5, -25.5, 0.7],
          [4.2, -26.5, 0.6],
        ],
      },
    ],
  },
  {
    id: 11,
    radius: 0.11,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [0.62, -5.8, -2.4],
        [0.72, -4.0, -2.3],
        [0.8, -3.0, -2.15],
        [1.3, -1.6, -1.75],
        [2.95, -1.85, -1.65],
        [3.55, -3.2, -1.9],
        [4.1, -5.2, -1.6],
        [4.8, -7.8, -3.2],
        [5.3, -10.5, -4.2],
        [7.2, -13.4, -4.6],
      ],
    },
    branches: [
      {
        anchor: "start",
        points: [
          [0.85, -1.3, -1.3],
          [1.35, -1.5, -1.6],
        ],
      },
      {
        points: [
          [4.1, -5.2, -1.6],
          [4.35, -5.9, -0.2],
          [4.3, -6.3, 0.6],
        ],
      },
    ],
  },
  {
    id: 12,
    radius: 0.12,
    afferent: false,
    main: {
      anchor: "start",
      points: [
        [0.45, -0.7, -0.4],
        [1.1, -1.55, -0.9],
        [1.65, -2.5, -0.95],
        [2.4, -3.4, -0.6],
        [3.1, -5.8, 1.05],
        [2.9, -8.1, 2.4],
        [2.1, -7.95, 4.2],
        [1.3, -7.0, 5.6],
        [0.7, -6.5, 7.0],
      ],
    },
    branches: [
      {
        points: [
          [1.3, -7.0, 5.6],
          [1.6, -6.1, 6.6],
        ],
      },
      {
        points: [
          [1.3, -7.0, 5.6],
          [0.5, -7.6, 5.0],
        ],
      },
    ],
  },
];

/** Surfaces nerve ends are snapped to; exported so tests check the same field. */
export const ANCHOR_SURFACES: Record<AnchorTarget, Sdf> = {
  brainstem: brainstemSdf(),
  cerebrum: cerebrumSdf().sdf,
};

/** Snap the anchored end onto its brain surface (slightly inside). */
function anchorCourse(course: Course): Course {
  if (!course.anchor) return course;
  const surface = ANCHOR_SURFACES[course.anchorTo ?? "brainstem"];
  const pts = course.points.map((p) => [...p] as Vec3);
  const i = course.anchor === "start" ? 0 : pts.length - 1;
  pts[i] = [...projectToSurface(surface, pts[i], 0.06)] as Vec3;
  return { ...course, points: pts };
}

export const NERVE_PATHS: NervePath[] = RAW_PATHS.map((n) => ({
  ...n,
  main: anchorCourse(n.main),
  branches: n.branches.map(anchorCourse),
}));

export type Ganglion = {
  nerveId: number;
  label: string;
  position: Vec3;
  /** Radii along (axis, side, up). */
  radii: Vec3;
  axis: Vec3;
};

export const GANGLIA: Ganglion[] = [
  { nerveId: 1, label: "Bulbus olfactorius", position: [0.64, 3.62, 6.15], radii: [0.75, 0.3, 0.2], axis: [0.08, 0, 1] },
  { nerveId: 3, label: "Ggl. ciliare", position: [2.55, 1.35, 5.1], radii: [0.16, 0.12, 0.12], axis: [0, 0, 1] },
  { nerveId: 5, label: "Ggl. trigeminale", position: [2.35, 1.2, 1.6], radii: [0.85, 0.32, 0.3], axis: [1, -0.2, 0.55] },
  { nerveId: 7, label: "Ggl. geniculi", position: [3.55, 0.82, 0.7], radii: [0.18, 0.15, 0.15], axis: [1, 0, 0] },
  { nerveId: 7, label: "Ggl. pterygopalatinum", position: [2.45, 0.3, 4.35], radii: [0.22, 0.16, 0.16], axis: [0, 1, 0] },
  { nerveId: 8, label: "Ggl. vestibulare", position: [3.15, 0.66, -0.25], radii: [0.2, 0.15, 0.15], axis: [1, 0, 0] },
  { nerveId: 9, label: "Ggl. inferius IX", position: [2.85, -2.3, -0.95], radii: [0.28, 0.16, 0.16], axis: [0, 1, 0] },
  { nerveId: 9, label: "Ggl. oticum", position: [2.35, -0.4, 2.05], radii: [0.17, 0.13, 0.13], axis: [0, 0, 1] },
  { nerveId: 10, label: "Ggl. superius X", position: [2.95, -2.4, -1.2], radii: [0.2, 0.17, 0.17], axis: [0, 1, 0] },
  { nerveId: 10, label: "Ggl. inferius X", position: [3.0, -3.9, -0.6], radii: [0.6, 0.21, 0.21], axis: [0, 1, 0.15] },
];

/** Motor and sensory nuclei (+x side, mirrored), inside the stem. */
export const NUCLEI: { id: number; position: Vec3; label: string }[] = [
  { id: 3, position: [0.22, 3.5, -0.72], label: "Ncl. III" },
  { id: 4, position: [0.22, 3.05, -0.95], label: "Ncl. IV" },
  { id: 5, position: [0.9, 1.8, -0.9], label: "Ncl. V" },
  { id: 6, position: [0.3, 1.0, -1.35], label: "Ncl. VI" },
  { id: 7, position: [0.8, 0.9, -0.6], label: "Ncl. VII" },
  { id: 8, position: [0.85, 0.55, -1.4], label: "Ncl. VIII" },
  { id: 9, position: [0.7, -0.2, -1.55], label: "Ncl. IX" },
  { id: 10, position: [0.4, -0.8, -1.85], label: "Ncl. X" },
  { id: 11, position: [0.45, -5.0, -2.3], label: "Ncl. XI" },
  { id: 12, position: [0.14, -0.9, -1.85], label: "Ncl. XII" },
];

/** Left eyeball (+x); the right is mirrored. */
export const EYE = { center: [3.2, 1.3, 7.0] as Vec3, radius: 1.2 };

export type CameraView = { position: Vec3; target: Vec3 };

export const DEFAULT_VIEW: CameraView = { position: [36, 9, 50], target: [0, -1.5, 0.5] };

/** Signal mode on the vagus frames its whole course down to the stomach. */
export const VAGUS_SIGNAL_VIEW: CameraView = { position: [52, -14, 52], target: [0, -20, 1.5] };

export const NERVE_VIEWS: Record<number, CameraView> = {
  1: { position: [14.2, -7.2, 29.9], target: [0.6, 3.0, 4.5] },
  2: { position: [8.2, 22, 24.6], target: [1.2, 2.6, 3.4] },
  3: { position: [19.7, 13.5, 18.9], target: [1.4, 2.2, 3.2] },
  4: { position: [22.7, 16.1, -9.3], target: [1.2, 2.8, 1.4] },
  5: { position: [30.6, 5.8, 22.9], target: [2.8, 0.0, 3.8] },
  6: { position: [16.7, 5.1, 24.8], target: [1.6, 1.6, 2.8] },
  7: { position: [34.5, 3.4, 21.9], target: [3.8, -1.2, 2.8] },
  8: { position: [19.2, 11.3, -11.5], target: [2.4, 0.6, -0.2] },
  9: { position: [25.1, -4.4, 16.9], target: [2.2, -3.2, 1.0] },
  10: { position: [50, -12, 50], target: [0, -18, 1.5] },
  11: { position: [30.6, -5.3, -19.2], target: [3.0, -7.5, -2.5] },
  12: { position: [22.5, -9.5, 21.9], target: [1.6, -4.6, 2.8] },
};

export function curveFrom(points: Vec3[]): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    points.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    "centripetal",
  );
}

export function mirrorX(points: Vec3[]): Vec3[] {
  return points.map(([x, y, z]) => [-x, y, z]);
}
