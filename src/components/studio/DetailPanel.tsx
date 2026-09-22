import { useState, type ReactNode } from "react";
import { Play, Pause, RotateCcw, Maximize2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRANIAL_NERVES, TYPE_LABEL, ATLAS_PLATES, type AtlasPlate, nerveById } from "@/lib/cranial-nerves";
import { eyeActionText } from "@/lib/eye-motion";
import { useStudio } from "@/lib/studio-store";
import { AtlasLightbox } from "./AtlasLightbox";

export function DetailPanel() {
  const [activePlate, setActivePlate] = useState<AtlasPlate | null>(null);
  const selectedId = useStudio((s) => s.selectedId);
  const playing = useStudio((s) => s.playing);
  const setPlaying = useStudio((s) => s.setPlaying);
  const setProgress = useStudio((s) => s.setSignalProgress);
  const progress = useStudio((s) => s.signalProgress);
  const speed = useStudio((s) => s.signalSpeed);
  const setSpeed = useStudio((s) => s.setSignalSpeed);
  const setSelected = useStudio((s) => s.setSelected);

  if (selectedId === null) {
    return (
      <aside className="paper hidden h-full flex-col gap-5 overflow-y-auto p-6 lg:flex">
        <div>
          <p className="eyebrow">Atlas</p>
          <h2 className="latin mt-1 text-3xl leading-tight text-fg">Nervi craniales</h2>
          <p className="text-sm text-muted">On iki kafa çifti</p>
          <hr className="rule-gold mt-4" />
        </div>
        <p className="text-sm text-muted">
          Bir sinir seçin. 3D modelde yolu, innerve ettiği kas ve organlar, çekirdekleri ve klinik
          muayene belirir. Sinyal modunda aksiyon potansiyeli çekirdekten hedefe akar.
        </p>
        <ol className="space-y-0.5">
          {CRANIAL_NERVES.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setSelected(n.id)}
                className="grid w-full grid-cols-[2rem_1fr_auto] items-baseline gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-[var(--motion-quick)] hover:bg-surface-2"
              >
                <span className="font-display text-lg font-semibold tabular-nums" style={{ color: n.color }}>
                  {n.roman}
                </span>
                <span className="min-w-0">
                  <span className="latin block truncate text-base text-fg">{n.nameLa}</span>
                </span>
                <span className="text-xs text-subtle">{n.functionShort}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    );
  }

  const n = nerveById(selectedId);
  const plate = ATLAS_PLATES.find((p) => p.src === n.atlas) ?? ATLAS_PLATES[0];

  return (
    <aside className="paper panel-enter scroll-thin flex max-h-[46vh] flex-col gap-5 overflow-y-auto p-5 md:max-h-none lg:h-full lg:p-6">
      <header>
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow">
            Nervus cranialis <span style={{ color: n.color }}>{n.roman}</span>
          </p>
          <Badge tone={n.type}>{TYPE_LABEL[n.type]}</Badge>
        </div>
        <h2 className="latin mt-1 text-[2.25rem] leading-[1.05] text-fg">{n.nameLa}</h2>
        <p className="mt-1 text-sm text-muted">{n.nameTr}</p>
        <hr className="rule-gold mt-4" />
      </header>

      <div className="flex items-center gap-2 rounded-lg bg-surface p-2 shadow-[var(--shadow-border)]">
        <Button
          size="icon"
          variant="secondary"
          aria-label={playing ? "Duraklat" : "Sinyali oynat"}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4 ml-px" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Sıfırla"
          onClick={() => {
            setProgress(0);
            setPlaying(false);
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          hız
          <input
            type="range"
            min={0.08}
            max={0.55}
            step={0.01}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-16 accent-gold"
          />
        </label>
      </div>

      {eyeActionText(n.id) && <p className="text-xs leading-relaxed text-muted">{eyeActionText(n.id)}</p>}

      <Section title="Functio" caption="İşlev">
        <ul className="list-disc space-y-1 pl-4 marker:text-subtle">
          {n.functions.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </Section>

      <Section title="Innervatio" caption="İnnervasyon">
        <ul className="divide-y divide-border">
          {n.targets.map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-3 py-1.5">
              <span className="min-w-0">
                <span className="latin text-base text-fg">{t.nameLa}</span>
                {t.nameTr !== t.nameLa && <span className="ml-2 text-xs text-subtle">{t.nameTr}</span>}
              </span>
              <span className="eyebrow shrink-0 tracking-[0.14em]">{kindLabel(t.kind)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Nuclei" caption="Çekirdekler">
        {n.nuclei.map((k) => (
          <p key={k.name}>
            <span className="latin text-base text-fg">{k.name}</span>
            <span className="block text-xs text-muted">{k.location}</span>
          </p>
        ))}
      </Section>

      <Section title="Cursus" caption="Seyir">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-fg">Çıkış</dt>
          <dd>{n.origin}</dd>
          <dt className="text-fg">Foramen</dt>
          <dd className="latin text-base text-fg">{n.foramen}</dd>
        </dl>
        <p>{n.course}</p>
        <ul className="mt-2 list-disc pl-4 marker:text-subtle">
          {n.branches.map((b) => (
            <li key={b} className="latin text-base text-fg/90">
              {b}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Clinica" caption="Klinik">
        <p>
          <span className="text-fg">Muayene. </span>
          {n.clinical.test}
        </p>
        <p>
          <span className="text-fg">Lezyon. </span>
          {n.clinical.lesion}
        </p>
        <div role="note" className="rounded-md border-l-2 border-gold bg-surface px-3 py-2">
          <p className="eyebrow text-gold/80">Klinik inci</p>
          <p className="mt-1 text-sm text-fg/90">{n.clinical.pearl}</p>
        </div>
      </Section>

      <Section title="Tabula" caption="Atlas Levhası">
        <button
          type="button"
          onClick={() => setActivePlate(plate)}
          className="group relative block w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-surface text-left transition-all hover:border-gold/50 hover:shadow-md"
        >
          <span className="atlas-frame-wrap relative block aspect-square overflow-hidden">
            <img
              src={plate.src}
              alt={plate.title}
              loading="lazy"
              className="atlas-img"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-black shadow">
                <Maximize2 className="size-3" /> Levhayı Büyüt
              </span>
            </span>
          </span>
          <span className="block p-2.5">
            <span className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-fg transition-colors group-hover:text-gold">
                {plate.title}
              </span>
              <BookOpen className="size-3.5 shrink-0 text-muted" />
            </span>
            <span className="latin block truncate text-[11px] text-muted">{plate.latinTitle}</span>
          </span>
        </button>
      </Section>

      <AtlasLightbox
        plate={activePlate}
        plates={ATLAS_PLATES}
        onClose={() => setActivePlate(null)}
        onSelectPlate={(p) => setActivePlate(p)}
      />
    </aside>
  );
}

/** Latin section title with its Turkish caption, like a plate heading. */
function Section({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-baseline gap-2 border-b border-border pb-1">
        <span className="latin text-lg text-fg">{title}</span>
        <span className="eyebrow">{caption}</span>
      </h3>
      <div className="space-y-2 text-sm text-muted">{children}</div>
    </section>
  );
}

function kindLabel(kind: string) {
  switch (kind) {
    case "muscle":
      return "kas";
    case "organ":
      return "organ";
    case "gland":
      return "bez";
    case "sense":
      return "duyu";
    case "skin":
      return "deri";
    default:
      return kind;
  }
}
