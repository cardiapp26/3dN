/**
 * Extraocular response to a cranial-nerve action potential.
 *
 * The scene frame is centimetres, +x patient left, +y up, +z anterior.
 * Angles are for the +x globe. Positive yaw abducts it, positive pitch
 * depresses it, positive roll intorts it (12 o'clock toward the midline).
 * The -x globe uses the negated yaw and roll. Pitch is the same on both.
 *
 * III's five skeletal muscles share one mesh, so the globe shows the net of
 * stimulating the whole nerve: adduction, slight elevation and extorsion,
 * lid elevation, pupil constriction. IV and VI each own one muscle.
 * Sensory nerves and every non-ocular motor nerve stay at rest.
 */

export type EyePose = {
  /** Radians. Positive abducts the +x eye. */
  yaw: number;
  /** Radians. Positive looks down. */
  pitch: number;
  /** Radians. Positive intorts the +x eye. */
  roll: number;
  /** 0 resting fissure, 1 levator retraction. */
  lid: number;
  /** Pupil diameter scale. 1 resting, smaller is miosis. */
  pupil: number;
  /** 0 resting belly, 1 fully shortened toward the orbital apex. */
  twitch: number;
};

export type StudioSide = "both" | "left" | "right";

const REST: EyePose = { yaw: 0, pitch: 0, roll: 0, lid: 0, pupil: 1, twitch: 0 };

/** Progress window in which the spark is in the orbit. */
const RECRUIT_START = 0.68;
const RECRUIT_FULL = 0.9;

const ATTACK_S = 0.07;
const RELEASE_S = 0.26;

const DEG = Math.PI / 180;

type FullAction = {
  yaw: number;
  pitch: number;
  roll: number;
  lid: number;
  pupil: number;
};

const FULL: Record<number, FullAction> = {
  // MR adducts; SR and IR largely cancel; IO elevates and extorts; LPS and Edinger-Westphal.
  3: { yaw: -26 * DEG, pitch: -10 * DEG, roll: -8 * DEG, lid: 1, pupil: 0.62 },
  // Obliquus superior: depression, intorsion, abduction.
  4: { yaw: 12 * DEG, pitch: 18 * DEG, roll: 16 * DEG, lid: 0, pupil: 1 },
  // Rectus lateralis.
  6: { yaw: 28 * DEG, pitch: 0, roll: 0, lid: 0, pupil: 1 },
};

/** Orbital apex of each extraocular mesh, in the unmirrored +x model. */
export const EOM_APEX: Record<string, readonly [number, number, number]> = {
  "eom-oculomotor": [1.5, 1.9, 4.4],
  "eom-trochlear": [1.4, 2.3, 4.4],
  "eom-abducens": [1.75, 1.9, 4.4],
};

const EYE_ACTION: Record<number, string> = {
  3: "Sinyal orbitaya ulaşınca göz addüksiyona gelir, üst kapak yükselir ve pupil daralır.",
  4: "Sinyal orbitaya ulaşınca göz depresyona, intorsiyona ve abdüksiyona gelir.",
  6: "Sinyal orbitaya ulaşınca göz abdüksiyona gelir.",
};

export function eyeActionText(nerveId: number): string | null {
  return EYE_ACTION[nerveId] ?? null;
}

export function eomModelForNerve(nerveId: number | null): string | null {
  if (nerveId === 3) return "eom-oculomotor";
  if (nerveId === 4) return "eom-trochlear";
  if (nerveId === 6) return "eom-abducens";
  return null;
}

/**
 * Same signs as the nerve courses: Sağ is the authored +x side, Sol is the mirror.
 */
export function eyeSigns(side: StudioSide): readonly (1 | -1)[] {
  if (side === "left") return [-1];
  if (side === "right") return [1];
  return [1, -1];
}

/** 0 before the spark reaches the orbit, 1 once it is on the muscle. */
export function ocularRecruitment(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  const p = Math.min(1, Math.max(0, progress));
  if (p <= RECRUIT_START) return 0;
  if (p >= RECRUIT_FULL) return 1;
  const t = (p - RECRUIT_START) / (RECRUIT_FULL - RECRUIT_START);
  return t * t * (3 - 2 * t);
}

function poseAtTwitch(action: FullAction, twitch: number): EyePose {
  return {
    yaw: action.yaw * twitch,
    pitch: action.pitch * twitch,
    roll: action.roll * twitch,
    lid: action.lid * twitch,
    pupil: 1 + (action.pupil - 1) * twitch,
    twitch,
  };
}

/** Instant pose for this nerve at this signal clock. Non-ocular nerves rest. */
export function eyePose(nerveId: number | null, progress: number): EyePose {
  const action = nerveId === null ? undefined : FULL[nerveId];
  if (!action) return REST;
  return poseAtTwitch(action, ocularRecruitment(progress));
}

/** Fast rise, slower fall, so a clock reset reads as a twitch rather than a pop. */
export function approach(current: number, target: number, dt: number): number {
  const step = Math.min(Math.max(dt, 0), 0.1);
  if (step === 0 || current === target) return current;
  const tau = target > current ? ATTACK_S : RELEASE_S;
  const k = 1 - Math.exp(-step / tau);
  return current + (target - current) * k;
}

let smooth = 0;
let lastId: number | null | undefined;
let pose: EyePose = REST;

export function currentEyePose(): EyePose {
  return pose;
}

export function resetEyeMotion(): void {
  smooth = 0;
  lastId = undefined;
  pose = REST;
}

/** Advance the displayed twitch. Switching nerve drops the previous direction immediately. */
export function stepEyeMotion(nerveId: number | null, progress: number, dt: number): EyePose {
  if (nerveId !== lastId) {
    lastId = nerveId;
    smooth = 0;
  }
  const action = nerveId === null ? undefined : FULL[nerveId];
  smooth = action ? approach(smooth, ocularRecruitment(progress), dt) : 0;
  pose = action ? poseAtTwitch(action, smooth) : REST;
  return pose;
}
