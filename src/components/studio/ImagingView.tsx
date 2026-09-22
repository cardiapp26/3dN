import { useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CRANIAL_NERVES } from "@/lib/cranial-nerves";
import { useStudio, type ImagingPlane } from "@/lib/studio-store";
import { cn } from "@/lib/utils";

const SLICE_MAX = 19;
const PLANES: { id: ImagingPlane; label: string }[] = [
  { id: "axial", label: "Aksiyel" },
  { id: "coronal", label: "Koronal" },
  { id: "sagittal", label: "Sagital" },
];

export function ImagingView() {
  const plane = useStudio((s) => s.imagingPlane);
  const slice = useStudio((s) => s.imagingSlice);
  const modality = useStudio((s) => s.imagingModality);
  const sequence = useStudio((s) => s.imagingSequence);
  const selectedId = useStudio((s) => s.selectedId);
  const setPlane = useStudio((s) => s.setImagingPlane);
  const setSlice = useStudio((s) => s.setImagingSlice);
  const setModality = useStudio((s) => s.setImagingModality);
  const setSequence = useStudio((s) => s.setImagingSequence);

  return (
    <div className="flex h-full flex-col gap-4 bg-bg p-4 md:flex-row md:p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Kesitsel görüntüleme</p>
            <h2 className="font-display text-2xl text-fg">
              {modality === "MR" ? "MR şematik atlas" : "BT kemik penceresi"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={modality === "MR" ? "default" : "secondary"}
              onClick={() => setModality("MR")}
            >
              MR
            </Button>
            <Button
              size="sm"
              variant={modality === "CT" ? "default" : "secondary"}
              onClick={() => setModality("CT")}
            >
              BT
            </Button>
            {modality === "MR"
              ? (["T1", "T2", "FLAIR"] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={sequence === s ? "outline" : "ghost"}
                    onClick={() => setSequence(s)}
                  >
                    {s}
                  </Button>
                ))
              : null}
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-bg shadow-[var(--shadow-border)]">
          <SliceCanvas
            plane={plane}
            slice={slice}
            modality={modality}
            sequence={sequence}
            selectedId={selectedId}
          />
          <div className="pointer-events-none absolute left-3 top-3 text-xs uppercase tracking-[0.16em] text-fg/70">
            {modality} · {sequence} · {plane} · kesit {slice + 1}/{SLICE_MAX + 1}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {PLANES.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={plane === p.id ? "default" : "ghost"}
                onClick={() => setPlane(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <label className="flex min-w-40 flex-1 items-center gap-2 text-xs text-muted">
            kesit
            <input
              type="range"
              min={0}
              max={SLICE_MAX}
              value={slice}
              onChange={(e) => setSlice(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
          </label>
        </div>
      </div>

      <aside className="flex w-full flex-col gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] md:w-72">
        <p className="text-sm text-muted">
          Bu panel gerçek DICOM serisi için hazırlandı: aksiyel / koronal / sagital, MR dizileri ve
          BT kemik penceresi. Şu an eğitim şeması çiziliyor; seçili kafa çiftinin kesitteki izdüşümü
          işaretlenir.
        </p>
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <Upload className="size-5 text-muted" />
          <p className="text-sm text-fg">Hasta MR / BT yükleme</p>
          <p className="text-xs text-muted">
            DICOM veya NIfTI serisi bir sonraki aşamada bağlanacak. 3D model ile kesit birlikte
            kaydırılacak.
          </p>
        </div>
        {selectedId !== null && (
          <p className="text-sm text-muted">
            İşaret:{" "}
            <span className="text-fg">
              CN {CRANIAL_NERVES[selectedId - 1].roman}{" "}
              <span className="italic">{CRANIAL_NERVES[selectedId - 1].nameLa}</span>{" "}
              <span className="text-muted">({CRANIAL_NERVES[selectedId - 1].nameTr})</span>
            </span>
          </p>
        )}
      </aside>
    </div>
  );
}

function SliceCanvas({
  plane,
  slice,
  modality,
  sequence,
  selectedId,
}: {
  plane: ImagingPlane;
  slice: number;
  modality: "MR" | "CT";
  sequence: string;
  selectedId: number | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const t = slice / SLICE_MAX;
    const isCT = modality === "CT";
    const t2 = sequence === "T2" || sequence === "FLAIR";

    const bg = isCT ? 8 : t2 ? 18 : 12;
    ctx.fillStyle = `rgb(${bg},${bg},${bg + 2})`;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.48;
    const rx = w * (plane === "sagittal" ? 0.28 : 0.32);
    const ry = h * (plane === "axial" ? 0.36 : 0.38);

    ctx.save();
    ctx.translate(cx, cy);

    const bone = isCT ? 210 : 70;
    ctx.fillStyle = `rgb(${bone},${bone - 8},${bone - 16})`;
    ellipse(ctx, 0, 0, rx + 18, ry + 16);
    ctx.fill();

    const csf = t2 && !isCT ? 200 : isCT ? 30 : 40;
    ctx.fillStyle = `rgb(${csf},${csf + 4},${csf + 10})`;
    ellipse(ctx, 0, 2, rx + 6, ry + 4);
    ctx.fill();

    const parenchyma = isCT ? 90 : t2 ? 70 : 120;
    ctx.fillStyle = `rgb(${parenchyma},${parenchyma - 6},${parenchyma - 10})`;
    ellipse(ctx, 0, 0, rx, ry);
    ctx.fill();

    if (plane !== "sagittal") {
      ctx.fillStyle = t2 && !isCT ? "rgb(210,214,220)" : "rgb(28,30,34)";
      ellipse(ctx, -28, -8, 22, 38 * (0.4 + t * 0.6));
      ctx.fill();
      ellipse(ctx, 28, -8, 22, 38 * (0.4 + t * 0.6));
      ctx.fill();
    }

    if (plane !== "axial" || t > 0.35) {
      ctx.fillStyle = `rgb(${parenchyma - 20},${parenchyma - 28},${parenchyma - 24})`;
      ellipse(ctx, 0, 70 - t * 40, 48, 36);
      ctx.fill();
      ctx.fillStyle = `rgb(${parenchyma + 10},${parenchyma},${parenchyma - 6})`;
      ellipse(ctx, 0, 110 - t * 30, 22, 48);
      ctx.fill();
    }

    if (selectedId !== null) {
      const n = CRANIAL_NERVES[selectedId - 1];
      const [x, y] = nerveMarker(selectedId, plane, t);
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f4f1ea";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(cx, 12);
    ctx.lineTo(cx, h - 12);
    ctx.moveTo(12, cy);
    ctx.lineTo(w - 12, cy);
    ctx.stroke();
  }, [plane, slice, modality, sequence, selectedId]);

  return (
    <canvas
      ref={ref}
      width={720}
      height={720}
      className={cn("h-full w-full object-contain")}
      aria-label="Kesitsel beyin görüntüsü"
    />
  );
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(4, rx), Math.max(4, ry), 0, 0, Math.PI * 2);
}

function nerveMarker(id: number, plane: ImagingPlane, t: number): [number, number] {
  const map: Record<number, [number, number, number]> = {
    1: [40, -90, 0.2],
    2: [30, -20, 0.45],
    3: [18, 10, 0.5],
    4: [22, 18, 0.48],
    5: [55, 30, 0.55],
    6: [12, 50, 0.62],
    7: [70, 55, 0.65],
    8: [80, 58, 0.65],
    9: [48, 90, 0.75],
    10: [42, 110, 0.8],
    11: [60, 140, 0.88],
    12: [20, 100, 0.78],
  };
  const [x, y, depth] = map[id] ?? [0, 0, 0.5];
  const drift = (t - depth) * 40;
  if (plane === "sagittal") return [drift, y];
  if (plane === "coronal") return [x, y + drift * 0.3];
  return [x, y + drift];
}
