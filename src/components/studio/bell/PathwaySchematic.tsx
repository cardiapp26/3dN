import { useId } from "react";
import type { PalsyType } from "@/lib/bell-palsy";

/**
 * Why the forehead is spared in a central lesion: the upper pool of the facial
 * nucleus takes fibres from both hemispheres, the lower pool only from the
 * opposite one. Drawn as a plate in the same paper and sepia as the face, with
 * the hemispheres, the brainstem and a small face for the two territories.
 * The lesion marker follows the selected case; a dead pathway is dashed red.
 */

const INK = "#4b3627";
const CORTEX = "#e4cfc0";
const STEM = "#dcc3ad";
const LIVE = "#5f8f5a";
const DEAD = "#b5473a";
const LIVE_WASH = "rgba(95, 143, 90, 0.22)";
const DEAD_WASH = "rgba(181, 71, 58, 0.2)";

function Fibre({ d, dead }: { d: string; dead: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={dead ? DEAD : LIVE}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeDasharray={dead ? "5 4" : undefined}
    />
  );
}

function Pool({ y, label, sub, dead }: { y: number; label: string; sub: string; dead: boolean }) {
  return (
    <g>
      <rect
        x={124}
        y={y}
        width={72}
        height={30}
        rx={6}
        fill="#fbf5e8"
        stroke={dead ? DEAD : LIVE}
        strokeWidth={2}
      />
      <text x={160} y={y + 13} textAnchor="middle" fill={INK} fontSize={10.5} fontWeight={700}>
        {label}
      </text>
      <text x={160} y={y + 24} textAnchor="middle" fill={INK} fontSize={8.5} opacity={0.75}>
        {sub}
      </text>
    </g>
  );
}

/** Red cross where the lesion sits. */
function Lesion({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="rgba(181, 71, 58, 0.18)" />
      <path
        d={`M ${x - 5} ${y - 5} l 10 10 M ${x + 5} ${y - 5} l -10 10`}
        stroke={DEAD}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

function Hemisphere({ cx, label, sub }: { cx: number; label: string; sub: string }) {
  return (
    <g>
      <path
        d={`M ${cx - 62} 66 C ${cx - 70} 30, ${cx - 30} 12, ${cx} 14 C ${cx + 30} 12, ${cx + 70} 30, ${cx + 62} 66 Z`}
        fill={CORTEX}
        stroke={INK}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* A few sulci so it reads as cortex */}
      <path
        d={`M ${cx - 40} 40 q 8 -10 16 0 M ${cx - 12} 30 q 8 -10 16 0 M ${cx + 16} 36 q 8 -10 16 0 M ${cx - 24} 54 q 8 -8 16 0`}
        fill="none"
        stroke={INK}
        strokeWidth={1}
        opacity={0.45}
      />
      <text x={cx} y={52} textAnchor="middle" fill={INK} fontSize={10} fontWeight={700}>
        {label}
      </text>
      <text x={cx} y={62} textAnchor="middle" fill={INK} fontSize={8.5} opacity={0.75}>
        {sub}
      </text>
    </g>
  );
}

export function PathwaySchematic({ palsy }: { palsy: PalsyType }) {
  const uid = useId();
  const isCentral = palsy.startsWith("central");
  const isPeripheral = palsy.startsWith("bell");
  const affected = palsy === "normal" ? null : palsy.endsWith("left") ? "sol" : "sağ";
  const healthy = affected === "sol" ? "sağ" : "sol";

  // A central lesion cuts the crossed fibres only; the upper pool keeps the
  // uncrossed input, so the forehead survives. A peripheral lesion cuts the
  // nerve after the nucleus, so both territories die together.
  const upperDead = isPeripheral;
  const lowerDead = isCentral || isPeripheral;

  return (
    <figure className="overflow-hidden rounded-lg border border-border">
      <svg
        viewBox="0 0 320 300"
        role="img"
        aria-label={
          isPeripheral
            ? "Periferik lezyon: çekirdek sonrası sinir kesilir, alın ve alt yüz birlikte felç olur"
            : isCentral
              ? "Santral lezyon: çapraz lifler kesilir, alın korunur, alt yüz felç olur"
              : "Normal: her iki yol da çalışır"
        }
        className="block h-auto w-full"
      >
        <defs>
          <radialGradient id={`${uid}-paper`} cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#f6eddb" />
            <stop offset="100%" stopColor="#e6d8bb" />
          </radialGradient>
        </defs>
        <rect width={320} height={300} fill={`url(#${uid}-paper)`} />

        <Hemisphere cx={84} label="Karşı hemisfer" sub={`${healthy} korteks`} />
        <Hemisphere cx={236} label="Aynı taraf hemisfer" sub={`${affected ?? "aynı"} korteks`} />

        {/* Brainstem holding the nucleus */}
        <path
          d="M 118 78 L 202 78 C 206 140, 196 186, 178 212 L 142 212 C 124 186, 114 140, 118 78 Z"
          fill={STEM}
          stroke={INK}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <text x={160} y={94} textAnchor="middle" fill={INK} fontSize={8.5} fontWeight={700} opacity={0.8}>
          NUCLEUS N. FACIALIS
        </text>

        {/* Crossed fibres from the opposite hemisphere reach both pools */}
        <Fibre d="M 96 66 C 100 96, 112 112, 124 116" dead={upperDead} />
        <Fibre d="M 96 66 C 96 118, 110 148, 124 154" dead={lowerDead} />
        {/* Uncrossed fibres from the same side reach only the upper pool */}
        <Fibre d="M 224 66 C 220 96, 208 112, 196 116" dead={upperDead} />

        <Pool y={102} label="Üst yüz" sub="iki taraflı girdi" dead={upperDead} />
        <Pool y={140} label="Alt yüz" sub="tek taraflı girdi" dead={lowerDead} />

        {isCentral && <Lesion x={104} y={102} />}

        {/* The nerve leaves the brainstem as one trunk, then serves both territories */}
        <Fibre d="M 160 170 L 160 236" dead={isPeripheral} />
        <Fibre d="M 160 236 C 160 244, 148 246, 146 252" dead={upperDead} />
        <Fibre d="M 160 236 C 160 256, 172 266, 176 276" dead={lowerDead} />

        {isPeripheral && <Lesion x={160} y={222} />}
        {isPeripheral && (
          <text x={174} y={226} fill={DEAD} fontSize={9.5} fontWeight={700}>
            n. facialis
          </text>
        )}

        {/* Small face: the upper and lower territories of one side */}
        <g>
          <path d="M 132 266 A 28 28 0 0 1 188 266 Z" fill={upperDead ? DEAD_WASH : LIVE_WASH} />
          <path d="M 132 266 A 28 28 0 0 0 188 266 Z" fill={lowerDead ? DEAD_WASH : LIVE_WASH} />
          <circle cx={160} cy={266} r={28} fill="none" stroke={INK} strokeWidth={1.5} />
          <path d="M 132 266 L 188 266" stroke={INK} strokeWidth={1} opacity={0.5} />
          <path d="M 146 252 q 7 -5 14 0 M 160 252 q 7 -5 14 0" fill="none" stroke={INK} strokeWidth={1.4} />
          <circle cx={153} cy={259} r={2} fill={INK} />
          <circle cx={167} cy={259} r={2} fill={INK} />
          <path d="M 148 280 q 12 8 24 0" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        </g>

        <text x={124} y={256} textAnchor="end" fill={upperDead ? DEAD : LIVE} fontSize={10} fontWeight={700}>
          Alın, göz
        </text>
        <text x={196} y={282} fill={lowerDead ? DEAD : LIVE} fontSize={10} fontWeight={700}>
          Ağız, yanak
        </text>
      </svg>

      <figcaption className="border-t border-border bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
        {isPeripheral && (
          <>
            Lezyon çekirdekten sonra, sinir gövdesindedir. Üst ve alt yüz aynı sinirden çıktığı için{" "}
            <span className="font-semibold text-fg">alın da felçtir.</span>
          </>
        )}
        {isCentral && (
          <>
            Lezyon çapraz kortikobulbar liflerdedir. Üst yüz diğer hemisferden lif almaya devam
            ettiği için <span className="font-semibold text-fg">alın korunur,</span> felç alt yüzle
            sınırlıdır.
          </>
        )}
        {!affected && <>Her iki yol da çalışıyor; yüz simetrik.</>}
      </figcaption>
    </figure>
  );
}
