import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { ATLAS_PLATES, type AtlasPlate } from "@/lib/cranial-nerves";
import type { FacialState, MimicTest, PalsyType } from "@/lib/bell-palsy";
import { cn } from "@/lib/utils";
import { AtlasLightbox } from "./AtlasLightbox";

const FACIAL_PLATE = ATLAS_PLATES.find((plate) => plate.id === "facial") as AtlasPlate;
const FACIAL_PLATES = [FACIAL_PLATE] as const;

const TEST_TARGETS: Record<
  MimicTest,
  {
    muscle: string;
    branch: string;
    shortLabel: string;
    position: { x: number; y: number };
    read: (state: FacialState, side: "left" | "right") => number;
  }
> = {
  "wrinkle-forehead": {
    muscle: "M. frontalis",
    branch: "Rami temporales",
    shortLabel: "Alın",
    position: { x: 34, y: 14 },
    read: (state, side) =>
      side === "left" ? state.leftForeheadWrinkle : state.rightForeheadWrinkle,
  },
  "close-eyes": {
    muscle: "M. orbicularis oculi",
    branch: "Rami temporales + zygomatici",
    shortLabel: "Göz",
    position: { x: 30, y: 38 },
    read: (state, side) => (side === "left" ? state.leftEyeClosure : state.rightEyeClosure),
  },
  smile: {
    muscle: "M. zygomaticus major",
    branch: "Rami zygomatici + buccales",
    shortLabel: "Gülümseme",
    position: { x: 38, y: 54 },
    read: (state, side) => (side === "left" ? state.leftMouthPull : state.rightMouthPull),
  },
  "puff-cheeks": {
    muscle: "M. buccinator",
    branch: "Rami buccales",
    shortLabel: "Yanak",
    position: { x: 41, y: 62 },
    read: (state, side) => (side === "left" ? state.leftCheekTone : state.rightCheekTone),
  },
};

const BRANCHES: readonly {
  id: string;
  label: string;
  tests: readonly MimicTest[];
}[] = [
  { id: "temporal", label: "Temporal", tests: ["wrinkle-forehead", "close-eyes"] },
  { id: "zygomatic", label: "Zigomatik", tests: ["close-eyes", "smile"] },
  { id: "buccal", label: "Bukkal", tests: ["smile", "puff-cheeks"] },
  { id: "marginal", label: "Marjinal mandibular", tests: [] },
  { id: "cervical", label: "Servikal", tests: [] },
];

function examinedSide(palsy: PalsyType): "left" | "right" {
  return palsy.endsWith("right") ? "right" : "left";
}

function functionLabel(value: number) {
  if (value <= 0.3) return { label: "Belirgin kayıp", tone: "danger" as const };
  if (value < 0.8) return { label: "Kısmi fonksiyon", tone: "warning" as const };
  return { label: "Fonksiyon korunmuş", tone: "normal" as const };
}

export function FacialNerveAtlas({
  state,
  palsy,
  test,
}: {
  state: FacialState;
  palsy: PalsyType;
  test: MimicTest;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const target = TEST_TARGETS[test];
  const side = examinedSide(palsy);
  const functionValue = target.read(state, side);
  const status = functionLabel(functionValue);
  const sideLabel =
    palsy === "normal" ? "İki taraf" : side === "left" ? "Hasta solu" : "Hasta sağı";

  return (
    <>
      <figure className="overflow-hidden rounded-2xl border border-border bg-[#eee2c7] shadow-inner">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={FACIAL_PLATE.src}
            alt="N. facialis terminal dalları, parotis pleksusu ve mimik kaslarının anatomik atlas görünümü"
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              side === "right" && "-scale-x-100",
            )}
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/75 to-transparent p-3 pb-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                CN VII · Anatomik atlas
              </p>
              <p className="mt-0.5 text-xs font-medium text-white">{sideLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-white/25 bg-black/45 text-white transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label="N. facialis atlasını tam çözünürlükte aç"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>

          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${side === "right" ? 100 - target.position.x : target.position.x}%`,
              top: `${target.position.y}%`,
            }}
          >
            <span
              className={cn(
                "absolute inset-0 animate-ping rounded-full opacity-45 motion-reduce:animate-none",
                status.tone === "normal"
                  ? "bg-emerald-400"
                  : status.tone === "warning"
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
            />
            <span
              className={cn(
                "relative block size-4 rounded-full border-2 border-white shadow-[0_0_0_4px_rgba(0,0,0,0.28)]",
                status.tone === "normal"
                  ? "bg-emerald-500"
                  : status.tone === "warning"
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
            />
          </div>

          <figcaption className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-black/75 p-3 text-white shadow-lg backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{target.muscle}</p>
                <p className="mt-0.5 truncate text-[10px] text-white/65">{target.branch}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold",
                  status.tone === "normal" && "bg-emerald-400/20 text-emerald-200",
                  status.tone === "warning" && "bg-amber-400/20 text-amber-200",
                  status.tone === "danger" && "bg-red-400/20 text-red-200",
                )}
              >
                {status.label}
              </span>
            </div>
          </figcaption>
        </div>
      </figure>

      <div className="mt-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="N. facialis terminal dalları">
          {BRANCHES.map((branch) => {
            const active = branch.tests.includes(test);
            return (
              <li
                key={branch.id}
                className={cn(
                  "rounded-full border px-2 py-1 text-[10px] font-medium transition-colors",
                  active
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-border bg-bg/70 text-muted",
                )}
              >
                {branch.label}
                {active && <span className="sr-only"> (ilgili dal)</span>}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          <span className="font-medium text-fg">{target.shortLabel} manevrası:</span> işaretli kas
          ve ilişkili terminal dallar vurgulanır. Atlas lateral görünümü taraf karşılaştırmasının
          yerine geçmez.
        </p>
      </div>

      <AtlasLightbox
        plate={lightboxOpen ? FACIAL_PLATE : null}
        plates={FACIAL_PLATES}
        onClose={() => setLightboxOpen(false)}
        onSelectPlate={() => {}}
      />
    </>
  );
}
