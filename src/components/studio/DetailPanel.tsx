import type { ReactNode } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRANIAL_NERVES, TYPE_LABEL, nerveById } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";

export function DetailPanel() {
  const selectedId = useStudio((s) => s.selectedId);
  const playing = useStudio((s) => s.playing);
  const setPlaying = useStudio((s) => s.setPlaying);
  const setProgress = useStudio((s) => s.setSignalProgress);
  const progress = useStudio((s) => s.signalProgress);
  const speed = useStudio((s) => s.signalSpeed);
  const setSpeed = useStudio((s) => s.setSignalSpeed);

  if (selectedId === null) {
    return (
      <aside className="hidden h-full flex-col gap-4 overflow-y-auto p-5 lg:flex">
        <p className="font-display text-xl text-fg">On iki kafa çifti</p>
        <p className="text-sm text-muted">
          Bir sinir seçin. 3D modelde yolu, innerve ettiği kas ve organlar, çekirdekleri ve klinik
          muayene belirir. Sinyal modunda aksiyon potansiyeli çekirdekten hedefe akar.
        </p>
        <ul className="space-y-2 text-sm text-muted">
          {CRANIAL_NERVES.map((n) => (
            <li key={n.id} className="flex items-baseline justify-between gap-3">
              <span className="text-fg">
                {n.roman}
                <span className="ml-2 text-muted">{n.nameTr}</span>
              </span>
              <span className="text-xs">{n.functionShort}</span>
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  const n = nerveById(selectedId);

  return (
    <aside className="panel-enter scroll-thin flex max-h-[46vh] flex-col gap-4 overflow-y-auto p-4 md:max-h-none lg:h-full">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Nervus cranialis {n.roman}</p>
          <h2 className="font-display text-2xl text-fg">{n.nameTr}</h2>
          <p className="italic text-muted">{n.nameLa}</p>
        </div>
        <Badge tone={n.type}>{TYPE_LABEL[n.type]}</Badge>
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
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <label className="flex items-center gap-1 text-xs text-muted">
          hız
          <input
            type="range"
            min={0.08}
            max={0.55}
            step={0.01}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-16 accent-accent"
          />
        </label>
      </div>

      <Section title="İşlev">
        <ul className="list-disc space-y-1 pl-4">
          {n.functions.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </Section>

      <Section title="İnnervasyon">
        <ul className="space-y-1.5">
          {n.targets.map((t) => (
            <li key={t.id} className="flex items-baseline justify-between gap-2">
              <span>
                {t.nameTr}
                <span className="ml-2 italic text-subtle">{t.nameLa}</span>
              </span>
              <span className="text-xs uppercase tracking-wider text-muted">{kindLabel(t.kind)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Çekirdekler">
        {n.nuclei.map((k) => (
          <p key={k.name}>
            <span className="text-fg">{k.name}</span>
            <span className="block text-xs text-muted">{k.location}</span>
          </p>
        ))}
      </Section>

      <Section title="Seyir">
        <p>
          <span className="text-fg">Çıkış: </span>
          {n.origin}
        </p>
        <p>
          <span className="text-fg">Foramen: </span>
          {n.foramen}
        </p>
        <p>{n.course}</p>
        <ul className="mt-2 list-disc pl-4">
          {n.branches.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Section>

      <Section title="Klinik">
        <p>
          <span className="text-fg">Muayene. </span>
          {n.clinical.test}
        </p>
        <p>
          <span className="text-fg">Lezyon. </span>
          {n.clinical.lesion}
        </p>
        <p className="italic text-muted">{n.clinical.pearl}</p>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">{title}</h3>
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
