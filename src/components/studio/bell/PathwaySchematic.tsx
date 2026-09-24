import type { PalsyType } from "@/lib/bell-palsy";

/**
 * Why the forehead is spared in a central lesion: the upper half of the facial
 * nucleus takes fibres from both hemispheres, the lower half only from the
 * opposite one. The lesion marker moves with the selected case, and a dead
 * pathway is drawn dashed in the motor colour.
 */

const LIVE = "var(--color-mixed)";
const DEAD = "var(--color-motor)";
const EDGE = "color-mix(in oklab, var(--color-fg) 35%, transparent)";

function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  tone = "plain",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  tone?: "plain" | "live" | "dead";
}) {
  const stroke = tone === "dead" ? DEAD : tone === "live" ? LIVE : EDGE;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="var(--color-surface-2)"
        stroke={stroke}
        strokeWidth={tone === "plain" ? 1.5 : 2.5}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 2 : y + h / 2 + 4}
        textAnchor="middle"
        className="fill-[var(--color-fg)] text-[11px] font-semibold"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          className="fill-[var(--color-muted)] text-[10px]"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Path({ d, dead }: { d: string; dead: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={dead ? DEAD : LIVE}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeDasharray={dead ? "5 5" : undefined}
      opacity={dead ? 0.85 : 0.9}
    />
  );
}

/** Red cross where the lesion sits. */
function Lesion({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill="color-mix(in oklab, var(--color-motor) 22%, transparent)" />
      <path
        d={`M ${x - 5} ${y - 5} l 10 10 M ${x + 5} ${y - 5} l -10 10`}
        stroke={DEAD}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

export function PathwaySchematic({ palsy }: { palsy: PalsyType }) {
  const isCentral = palsy.startsWith("central");
  const isPeripheral = palsy.startsWith("bell");
  const affected = palsy === "normal" ? null : palsy.endsWith("left") ? "sol" : "sağ";
  const healthy = affected === "sol" ? "sağ" : "sol";

  // Central lesion kills the crossed fibres only, so the lower face dies and the
  // forehead keeps the input from the other hemisphere.
  const crossedDead = isCentral || isPeripheral;
  const upperDead = isPeripheral;
  const lowerDead = isCentral || isPeripheral;

  return (
    <figure className="rounded-lg border border-border bg-surface p-3">
      <svg
        viewBox="0 0 320 250"
        role="img"
        aria-label={
          isPeripheral
            ? "Periferik lezyon: çekirdek sonrası sinir kesilir, alın ve alt yüz birlikte felç olur"
            : isCentral
              ? "Santral lezyon: çapraz lifler kesilir, alın korunur, alt yüz felç olur"
              : "Normal: her iki yol da çalışır"
        }
        className="mx-auto block h-auto w-full max-w-[380px]"
      >
        <Box x={8} y={8} w={126} h={34} label="Karşı korteks" sub={`${healthy} hemisfer`} />
        <Box x={186} y={8} w={126} h={34} label="Aynı taraf korteks" sub={`${affected ?? "aynı"} hemisfer`} />

        {/* Crossed fibres from the opposite hemisphere feed both halves */}
        <Path d="M 71 42 C 71 70, 150 70, 150 88" dead={crossedDead && upperDead} />
        <Path d="M 71 42 C 71 96, 150 108, 150 128" dead={lowerDead} />
        {/* Uncrossed fibres from the same side reach only the upper half */}
        <Path d="M 249 42 C 249 70, 170 70, 170 88" dead={upperDead} />

        {isCentral && <Lesion x={92} y={70} />}

        {/* Facial nucleus, split into the upper and lower face pools */}
        <Box
          x={112}
          y={88}
          w={96}
          h={38}
          label="Üst yüz"
          sub="iki taraflı girdi"
          tone={upperDead ? "dead" : "live"}
        />
        <Box
          x={112}
          y={128}
          w={96}
          h={38}
          label="Alt yüz"
          sub="tek taraflı girdi"
          tone={lowerDead ? "dead" : "live"}
        />
        <text x={160} y={82} textAnchor="middle" className="fill-[var(--color-muted)] text-[10px]">
          NUCLEUS N. FACIALIS
        </text>

        {/* The peripheral nerve leaves the nucleus as one trunk */}
        <Path d="M 160 166 L 160 196" dead={isPeripheral} />
        <Path d="M 160 196 C 160 206, 96 206, 96 216" dead={upperDead} />
        <Path d="M 160 196 C 160 206, 224 206, 224 216" dead={lowerDead} />

        {isPeripheral && <Lesion x={160} y={181} />}
        {isPeripheral && (
          <text x={176} y={185} className="fill-[var(--color-motor)] text-[10px] font-semibold">
            n. facialis
          </text>
        )}

        <Box
          x={36}
          y={216}
          w={120}
          h={30}
          label="Alın, göz"
          tone={upperDead ? "dead" : "live"}
        />
        <Box
          x={164}
          y={216}
          w={120}
          h={30}
          label="Ağız, yanak"
          tone={lowerDead ? "dead" : "live"}
        />
      </svg>

      <figcaption className="mt-2 text-xs leading-relaxed text-muted">
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
