import { useId } from "react";
import { isEyeVisuallyClosed, type FacialState, type MimicTest, type PalsyType } from "@/lib/bell-palsy";

/**
 * Front view of the patient, drawn like a plate from the atlas: paper ground,
 * sepia ink, a warm skin wash. Every feature that the examination changes is
 * driven by the simulated state, so brow ptosis, lagophthalmos with the Bell
 * phenomenon, a flattened nasolabial fold and a drooping mouth corner appear
 * exactly on the side and in the test where they belong.
 *
 * Viewer left is the patient's right, as when facing a patient.
 */

const INK = "#4b3627";
const INK_SOFT = "rgba(75, 54, 39, 0.55)";
const SKIN = "#ead0b6";
const SKIN_SHADE = "#d1a98a";
const HAIR = "#4a352a";
const SCLERA = "#fbf8f2";
const IRIS = "#55606e";
const LIP = "#bf7668";
const LIP_LOWER = "#cf8f80";
const WEAK = "#b5473a";
const WEAK_WASH = "rgba(181, 71, 58, 0.13)";
const LIVE = "#5f8f5a";

/** Head outline, symmetric about x = 150. Shared by the fill, the clip and the wash. */
const HEAD_PATH =
  "M 150 26 C 208 26, 254 74, 254 140 C 254 205, 214 268, 172 296 C 160 303, 140 303, 128 296 C 86 268, 46 205, 46 140 C 46 74, 92 26, 150 26 Z";

type SideValues = {
  forehead: number;
  closure: number;
  bell: boolean;
  mouth: number;
  cheek: number;
  weak: boolean;
  /** Weak through a peripheral lesion, so the brow and the lids sag at rest too. */
  peripheral: boolean;
};

function sideValues(
  state: FacialState,
  side: "left" | "right",
  weak: boolean,
  peripheral: boolean,
): SideValues {
  const base = { weak, peripheral: weak && peripheral };
  return side === "left"
    ? {
        ...base,
        forehead: state.leftForeheadWrinkle,
        closure: state.leftEyeClosure,
        bell: state.leftBellPhenomenon,
        mouth: state.leftMouthPull,
        cheek: state.leftCheekTone,
      }
    : {
        ...base,
        forehead: state.rightForeheadWrinkle,
        closure: state.rightEyeClosure,
        bell: state.rightBellPhenomenon,
        mouth: state.rightMouthPull,
        cheek: state.rightCheekTone,
      };
}

/**
 * One half of the face, authored for the viewer's right (the patient's left)
 * and mirrored for the other side. Text stays outside so it never flips.
 */
function FaceHalf({
  mirrored,
  v,
  test,
  clipId,
}: {
  mirrored: boolean;
  v: SideValues;
  test: MimicTest;
  clipId: string;
}) {
  const closed = isEyeVisuallyClosed(test, v.closure);
  const lagophthalmos = test === "close-eyes" && v.closure < 0.8;
  const ptosis = v.peripheral;
  const browY = -9 * v.forehead + (ptosis ? 6 : 0);
  // Lid aperture: wide open at rest, narrowed when the patient tries to close
  const upper = lagophthalmos ? 9 : 17;
  const lower = lagophthalmos ? 6 : v.peripheral ? 12 : 9;
  const irisX = v.bell ? 195 : 191;
  const irisY = v.bell ? 141 : 151;
  const foldTone = test === "smile" ? v.mouth : v.cheek;
  const aperture = `M 166 152 C 178 ${152 - upper}, 206 ${149 - upper}, 216 149 C 206 ${149 + lower}, 178 ${152 + lower}, 166 152 Z`;

  return (
    <g transform={mirrored ? "matrix(-1 0 0 1 300 0)" : undefined}>
      {/* Frontalis: three creases that fade as the muscle fails */}
      {[0, 1, 2].map((i) => {
        const y = 82 + i * 11;
        return (
          <path
            key={i}
            d={`M 151 ${y - 3} C 167 ${y - 4}, 185 ${y - 1}, 203 ${y + 7}`}
            fill="none"
            stroke={INK}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.08 + 0.7 * v.forehead}
          />
        );
      })}

      {/* Eyebrow: a tapered shape that lifts with the frontalis or sags with it */}
      <path
        d={
          ptosis
            ? "M 160 135 C 174 129, 200 128, 226 133 C 208 133, 184 134, 164 138 Z"
            : "M 160 134 C 172 120, 200 116, 226 126 C 208 124, 184 126, 164 137 Z"
        }
        transform={`translate(0 ${browY})`}
        fill={HAIR}
        stroke={ptosis ? WEAK : "none"}
        strokeWidth={1.5}
        opacity={0.92}
      />

      {closed ? (
        <g stroke={INK} strokeLinecap="round" fill="none">
          <path d="M 166 152 C 180 163, 206 161, 216 150" strokeWidth={2.2} />
          <path d="M 180 160 l -1 5 M 192 162 l 0 5 M 204 158 l 2 5" strokeWidth={1.4} />
        </g>
      ) : (
        <g>
          <clipPath id={clipId}>
            <path d={aperture} />
          </clipPath>
          <path d={aperture} fill={SCLERA} />
          <g clipPath={`url(#${clipId})`}>
            <circle cx={irisX} cy={irisY} r={9.5} fill={IRIS} />
            <circle cx={irisX} cy={irisY} r={4.2} fill="#1c1a19" />
            <circle cx={irisX - 3} cy={irisY - 3.5} r={2} fill="#ffffff" opacity={0.85} />
          </g>
          <path
            d={aperture}
            fill="none"
            stroke={lagophthalmos ? WEAK : INK}
            strokeWidth={lagophthalmos ? 2 : 1.6}
          />
          {/* Lid crease and the lower lid line */}
          <path
            d={`M 168 ${142 - upper * 0.4} C 180 ${126 - upper * 0.4}, 206 ${124 - upper * 0.4}, 218 ${138 - upper * 0.4}`}
            fill="none"
            stroke={INK}
            strokeWidth={1.1}
            opacity={0.45}
          />
          <path
            d={`M 171 ${160 + lower * 0.4} C 186 ${166 + lower * 0.5}, 206 ${164 + lower * 0.4}, 217 ${156 + lower * 0.3}`}
            fill="none"
            stroke={INK}
            strokeWidth={1}
            opacity={0.35}
          />
        </g>
      )}

      {/* Nasolabial fold, gone when the midface loses tone */}
      <path
        d="M 165 208 C 177 220, 187 234, 187 248"
        fill="none"
        stroke={INK}
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={0.12 + 0.7 * foldTone}
      />

      {/* Puffed cheek, and the air leak when the buccinator has no tone */}
      {test === "puff-cheeks" && (
        <g>
          <ellipse
            cx={206}
            cy={216}
            rx={16 + 10 * v.cheek}
            ry={14 + 8 * v.cheek}
            fill={v.cheek < 0.5 ? WEAK_WASH : "rgba(255, 244, 230, 0.55)"}
            stroke={v.cheek < 0.5 ? WEAK : INK_SOFT}
            strokeWidth={1.4}
          />
          {v.cheek < 0.5 && (
            <path
              d="M 190 250 C 200 258, 212 262, 226 258 M 192 256 C 202 264, 214 268, 228 264"
              fill="none"
              stroke={WEAK}
              strokeWidth={1.6}
              strokeDasharray="3 3"
              strokeLinecap="round"
            />
          )}
        </g>
      )}
    </g>
  );
}

/** Both lips as filled shapes, each corner placed by its own side. */
function Mouth({
  left,
  right,
  shift,
}: {
  left: SideValues;
  right: SideValues;
  shift: number;
}) {
  const cornerY = (v: SideValues) => 244 - 11 * v.mouth + (v.weak ? 8 : 0);
  const xR = 150 - (34 + 7 * right.mouth); // viewer left, patient's right
  const xL = 150 + (34 + 7 * left.mouth);
  const yR = cornerY(right);
  const yL = cornerY(left);
  const cx = 150 + shift;
  const yMid = (yR + yL) / 2 + 1;
  const yPeak = Math.min(yR, yL) - 7;

  const top = `M ${xR} ${yR} C ${xR + 14} ${yR - 5}, ${cx - 8} ${yPeak - 3}, ${cx} ${yPeak} C ${cx + 8} ${yPeak - 3}, ${xL - 14} ${yL - 5}, ${xL} ${yL}`;
  const midBack = `C ${xL - 14} ${yL + 2}, ${cx + 12} ${yMid}, ${cx} ${yMid} C ${cx - 12} ${yMid}, ${xR + 14} ${yR + 2}, ${xR} ${yR} Z`;
  const mid = `M ${xR} ${yR} C ${xR + 14} ${yR + 2}, ${cx - 12} ${yMid}, ${cx} ${yMid} C ${cx + 12} ${yMid}, ${xL - 14} ${yL + 2}, ${xL} ${yL}`;
  const bottomBack = `C ${xL - 10} ${yL + 14}, ${cx + 14} ${yMid + 16}, ${cx} ${yMid + 16} C ${cx - 14} ${yMid + 16}, ${xR + 10} ${yR + 14}, ${xR} ${yR} Z`;

  return (
    <g>
      <path d={`${mid} ${bottomBack}`} fill={LIP_LOWER} />
      <path d={`${top} ${midBack}`} fill={LIP} />
      <path d={mid} fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      {/* Shadow under the lower lip settles the chin */}
      <path
        d={`M ${cx - 18} ${yMid + 22} Q ${cx} ${yMid + 28} ${cx + 18} ${yMid + 22}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.2}
        opacity={0.25}
      />
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
  const uid = useId();
  const weakSide: "left" | "right" | null =
    palsy === "normal" ? null : palsy.endsWith("left") ? "left" : "right";
  const peripheral = palsy.startsWith("bell");
  const left = sideValues(state, "left", weakSide === "left", peripheral);
  const right = sideValues(state, "right", weakSide === "right", peripheral);
  const lagLeft = test === "close-eyes" && left.closure < 0.8;
  const lagRight = test === "close-eyes" && right.closure < 0.8;

  return (
    <figure className="overflow-hidden rounded-lg border border-border">
      <svg
        viewBox="0 0 300 340"
        role="img"
        aria-label={`${state.summaryHeading}. ${state.clinicalNote}`}
        className="block h-auto w-full"
      >
        <defs>
          <radialGradient id={`${uid}-paper`} cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#f6eddb" />
            <stop offset="100%" stopColor="#e6d8bb" />
          </radialGradient>
          <radialGradient id={`${uid}-skin`} cx="50%" cy="38%" r="68%">
            <stop offset="0%" stopColor="#f0d9c1" />
            <stop offset="70%" stopColor={SKIN} />
            <stop offset="100%" stopColor={SKIN_SHADE} />
          </radialGradient>
          <clipPath id={`${uid}-head`}>
            <path d={HEAD_PATH} />
          </clipPath>
          <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          {/* Central wash fades in below the eyes instead of cutting across the cheek */}
          <linearGradient id={`${uid}-wash`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={WEAK} stopOpacity={0} />
            <stop offset="0.14" stopColor={WEAK} stopOpacity={0.13} />
            <stop offset="1" stopColor={WEAK} stopOpacity={0.13} />
          </linearGradient>
        </defs>

        <rect width={300} height={340} fill={`url(#${uid}-paper)`} />

        {/* Neck and shoulders sit behind the head */}
        <path
          d="M 120 280 C 121 306, 116 322, 104 336 L 196 336 C 184 322, 179 306, 180 280 Z"
          fill={SKIN_SHADE}
          stroke={INK}
          strokeWidth={1.4}
        />
        <path d="M 60 340 C 80 322, 108 318, 120 314 M 240 340 C 220 322, 192 318, 180 314" fill="none" stroke={INK} strokeWidth={1.4} />

        <path d={HEAD_PATH} fill={`url(#${uid}-skin)`} stroke={INK} strokeWidth={1.8} />

        {/* Wash over the paralysed half, clipped to the head */}
        {weakSide && (
          <rect
            x={weakSide === "left" ? 150 : 0}
            y={peripheral ? 0 : 168}
            width={150}
            height={peripheral ? 340 : 172}
            clipPath={`url(#${uid}-head)`}
            fill={peripheral ? WEAK_WASH : `url(#${uid}-wash)`}
          />
        )}

        {/* Hair with a natural hairline */}
        <path
          d="M 50 118 C 44 62, 92 18, 150 18 C 208 18, 256 62, 250 118 C 244 92, 226 72, 204 66 C 188 61, 170 58, 150 60 C 130 58, 112 61, 96 66 C 74 72, 56 92, 50 118 Z"
          fill={HAIR}
        />
        <path d="M 120 64 C 132 56, 146 54, 160 58 M 172 62 C 186 60, 198 64, 210 72" fill="none" stroke="#6b5040" strokeWidth={1.2} opacity={0.7} />

        {/* Ears */}
        <path d="M 48 136 C 34 128, 30 152, 40 168 C 46 176, 54 174, 56 166" fill={SKIN} stroke={INK} strokeWidth={1.4} />
        <path d="M 252 136 C 266 128, 270 152, 260 168 C 254 176, 246 174, 244 166" fill={SKIN} stroke={INK} strokeWidth={1.4} />
        <path d="M 42 146 C 40 154, 42 160, 47 164 M 258 146 C 260 154, 258 160, 253 164" fill="none" stroke={INK} strokeWidth={1} opacity={0.5} />

        {/* Nose: bridge, tip, alar wings and nostrils */}
        <path d="M 142 152 C 140 176, 137 190, 133 201 M 158 152 C 160 176, 163 190, 167 201" fill="none" stroke={INK} strokeWidth={1.1} opacity={0.45} />
        <path
          d="M 133 201 C 124 199, 122 208, 131 212 C 138 215, 162 215, 169 212 C 178 208, 176 199, 167 201 C 162 195, 138 195, 133 201 Z"
          fill="rgba(210, 165, 135, 0.35)"
          stroke={INK}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <ellipse cx={140} cy={209} rx={4.5} ry={2.2} fill={INK} opacity={0.55} />
        <ellipse cx={160} cy={209} rx={4.5} ry={2.2} fill={INK} opacity={0.55} />

        {/* Soft shading under the cheekbones and along the jaw */}
        <g filter={`url(#${uid}-soft)`} opacity={0.55}>
          <ellipse cx={72} cy={200} rx={14} ry={30} fill={SKIN_SHADE} />
          <ellipse cx={228} cy={200} rx={14} ry={30} fill={SKIN_SHADE} />
          <ellipse cx={150} cy={286} rx={34} ry={10} fill={SKIN_SHADE} />
        </g>

        <FaceHalf mirrored v={right} test={test} clipId={`${uid}-eye-r`} />
        <FaceHalf mirrored={false} v={left} test={test} clipId={`${uid}-eye-l`} />
        <Mouth left={left} right={right} shift={state.mouthMidlineOffset * 6} />

        {/* Labels stay outside the mirrored groups */}
        {lagRight && (
          <text x={109} y={124} textAnchor="middle" fill={WEAK} fontSize={10} fontWeight={700}>
            lagoftalmi
          </text>
        )}
        {lagLeft && (
          <text x={191} y={124} textAnchor="middle" fill={WEAK} fontSize={10} fontWeight={700}>
            lagoftalmi
          </text>
        )}
        <text x={14} y={330} fill={INK} fontSize={10} fontWeight={600} opacity={0.75}>
          HASTANIN SAĞI
        </text>
        <text x={286} y={330} textAnchor="end" fill={INK} fontSize={10} fontWeight={600} opacity={0.75}>
          HASTANIN SOLU
        </text>
        {weakSide && (
          <text
            x={weakSide === "left" ? 286 : 14}
            y={318}
            textAnchor={weakSide === "left" ? "end" : "start"}
            fill={WEAK}
            fontSize={10}
            fontWeight={700}
          >
            felçli taraf
          </text>
        )}
      </svg>

      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-surface px-3 py-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ background: WEAK }} />
          Felçli taraf
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ background: LIVE }} />
          Sağlam
        </span>
        <span>Alın, kaş, göz kapağı, nazolabial oluk ve ağız köşesi seçime göre değişir.</span>
      </figcaption>
    </figure>
  );
}
