import { isEyeVisuallyClosed, type FacialState, type MimicTest, type PalsyType } from "@/lib/bell-palsy";

/**
 * Front view of the patient drawn from the simulated facial state: forehead
 * lines, lid closure, Bell phenomenon, nasolabial fold and mouth corner all move
 * with the numbers, so the asymmetry is the first thing a student sees.
 *
 * Viewer left is the patient's right, as when facing a patient.
 */

const SKIN = "var(--color-surface-2)";
const LINE = "color-mix(in oklab, var(--color-fg) 45%, transparent)";
const STRONG = "var(--color-fg)";
const WEAK = "var(--color-motor)";

type SideValues = {
  forehead: number;
  closure: number;
  bell: boolean;
  mouth: number;
  cheek: number;
  weak: boolean;
};

function sideValues(state: FacialState, side: "left" | "right", weak: boolean): SideValues {
  const v =
    side === "left"
      ? {
          forehead: state.leftForeheadWrinkle,
          closure: state.leftEyeClosure,
          bell: state.leftBellPhenomenon,
          mouth: state.leftMouthPull,
          cheek: state.leftCheekTone,
        }
      : {
          forehead: state.rightForeheadWrinkle,
          closure: state.rightEyeClosure,
          bell: state.rightBellPhenomenon,
          mouth: state.rightMouthPull,
          cheek: state.rightCheekTone,
        };
  return { ...v, weak };
}

/** Half of the face. `dir` is -1 for the patient's right, drawn on the viewer's left. */
function FaceHalf({ dir, v, test }: { dir: -1 | 1; v: SideValues; test: MimicTest }) {
  const eyeX = 120 + dir * 33;
  const browDrop = v.weak && v.forehead < 0.5 ? 7 : 0;
  const browY = 96 - 6 * v.forehead + browDrop;
  const closed = isEyeVisuallyClosed(test, v.closure);
  const lagophthalmos = test === "close-eyes" && v.closure < 0.8;
  const irisY = v.bell ? 114 - 6 : 114;
  const irisX = eyeX + (v.bell ? dir * 5 : 0);
  const foldTone = test === "smile" ? v.mouth : v.cheek;

  return (
    <g>
      {/* Frontalis: the wrinkle lines fade out as the muscle dies */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${120 + dir * 10} ${62 + i * 10} q ${dir * 22} ${-5} ${dir * 46} 2`}
          fill="none"
          stroke={LINE}
          strokeWidth={2.4}
          strokeLinecap="round"
          opacity={0.08 + 0.75 * v.forehead}
        />
      ))}

      {/* Eyebrow: lifts with the frontalis, sits low on the denervated side */}
      <path
        d={`M ${eyeX - 23} ${browY + browDrop / 2} q 23 ${-11 - 4 * v.forehead} 46 ${browDrop ? 5 : 0}`}
        fill="none"
        stroke={browDrop ? WEAK : STRONG}
        strokeWidth={4}
        strokeLinecap="round"
      />

      {closed ? (
        <path
          d={`M ${eyeX - 18} 114 q 18 8 36 0`}
          fill="none"
          stroke={STRONG}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse
            cx={eyeX}
            cy={114}
            rx={18}
            ry={lagophthalmos ? 11 : 9}
            fill="#f4f0e7"
            stroke={lagophthalmos ? WEAK : LINE}
            strokeWidth={lagophthalmos ? 2.5 : 2}
          />
          <circle cx={irisX} cy={irisY} r={6.5} fill="#46566b" />
          <circle cx={irisX} cy={irisY} r={2.6} fill="#151a22" />
          {lagophthalmos && (
            <text
              x={eyeX}
              y={95}
              textAnchor="middle"
              className="fill-[var(--color-motor)] text-[10px] font-semibold"
            >
              lagoftalmi
            </text>
          )}
        </>
      )}

      {/* Nasolabial fold, flat when the midface loses tone */}
      <path
        d={`M ${120 + dir * 14} 152 q ${dir * 10} 14 ${dir * 13} 30`}
        fill="none"
        stroke={LINE}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.12 + 0.75 * foldTone}
      />

      {/* Puffed cheek and, when the buccinator is out, the air leak */}
      {test === "puff-cheeks" && (
        <>
          <ellipse
            cx={120 + dir * 46}
            cy={168}
            rx={15 + 9 * v.cheek}
            ry={12 + 7 * v.cheek}
            fill={v.cheek < 0.5 ? "color-mix(in oklab, var(--color-motor) 18%, transparent)" : SKIN}
            stroke={v.cheek < 0.5 ? WEAK : LINE}
            strokeWidth={2}
          />
          {v.cheek < 0.5 && (
            <path
              d={`M ${120 + dir * 46} 188 q ${dir * 10} 12 ${dir * 22} 12`}
              fill="none"
              stroke={WEAK}
              strokeWidth={2.2}
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
          )}
        </>
      )}
    </g>
  );
}

export function FaceSchematic({
  state,
  palsy,
  test,
}: {
  state: FacialState;
  palsy: PalsyType;
  test: MimicTest;
}) {
  const weakSide: "left" | "right" | null =
    palsy === "normal" ? null : palsy.endsWith("left") ? "left" : "right";
  const left = sideValues(state, "left", weakSide === "left");
  const right = sideValues(state, "right", weakSide === "right");

  // Mouth: each corner follows its own side, the midline drags to the strong side
  const shift = state.mouthMidlineOffset * 6;
  const cornerY = (v: SideValues) => 184 - 12 * v.mouth + (v.weak ? 9 : 0);
  const yRight = cornerY(right); // viewer left
  const yLeft = cornerY(left); // viewer right

  return (
    <figure className="rounded-lg border border-border bg-surface p-3">
      <svg
        viewBox="0 0 240 250"
        role="img"
        aria-label={`${state.summaryHeading}. ${state.clinicalNote}`}
        className="mx-auto block h-auto w-full max-w-[340px]"
      >
        <defs>
          <clipPath id="face-clip">
            <ellipse cx={120} cy={132} rx={76} ry={98} />
          </clipPath>
        </defs>

        <ellipse cx={120} cy={132} rx={76} ry={98} fill={SKIN} stroke={LINE} strokeWidth={2} />

        {/* Tint the paralysed half, clipped to the face so it reads as anatomy */}
        {weakSide && (
          <rect
            x={weakSide === "left" ? 120 : 0}
            y={0}
            width={120}
            height={250}
            clipPath="url(#face-clip)"
            fill="color-mix(in oklab, var(--color-motor) 14%, transparent)"
          />
        )}

        {/* Ears and nose, so the drawing still reads as a face */}
        <path d="M 44 124 q -11 5 -4 20 q 5 9 11 3" fill="none" stroke={LINE} strokeWidth={2} />
        <path d="M 196 124 q 11 5 4 20 q -5 9 -11 3" fill="none" stroke={LINE} strokeWidth={2} />
        <path
          d="M 120 126 v 20 q 0 6 -7 8 M 120 154 q 7 2 7 -4"
          fill="none"
          stroke={LINE}
          strokeWidth={2}
          strokeLinecap="round"
        />

        <FaceHalf dir={-1} v={right} test={test} />
        <FaceHalf dir={1} v={left} test={test} />

        {/* Lips: two arcs meeting at the corners, each corner set by its own side */}
        <path
          d={`M 80 ${yRight} Q ${120 + shift} ${Math.min(yRight, yLeft) - 5} 160 ${yLeft}`}
          fill="none"
          stroke={STRONG}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <path
          d={`M 80 ${yRight} Q ${120 + shift} ${Math.max(yRight, yLeft) + 15} 160 ${yLeft}`}
          fill="none"
          stroke={STRONG}
          strokeWidth={3.5}
          strokeLinecap="round"
        />

        <text x={16} y={242} className="fill-[var(--color-muted)] text-[11px]">
          Hastanın sağı
        </text>
        <text x={158} y={242} className="fill-[var(--color-muted)] text-[11px]">
          Hastanın solu
        </text>
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-motor" />
          Etkilenen taraf
        </span>
        <span>Alın çizgileri, göz kapanması ve ağız köşesi seçime göre değişir.</span>
      </figcaption>
    </figure>
  );
}
