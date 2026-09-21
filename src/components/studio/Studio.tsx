import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  Layers,
  Scan,
  GraduationCap,
  Zap,
  Eye,
  SplitSquareHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAYERS, MNEMONIC, type StudioMode } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";
import { AtlasView } from "./AtlasView";
import { DetailPanel } from "./DetailPanel";
import { ImagingView } from "./ImagingView";
import { NerveRail } from "./NerveRail";
import { QuizView } from "./QuizView";

const MODES: { id: StudioMode; label: string; icon: typeof Eye }[] = [
  { id: "explore", label: "Keşif", icon: Eye },
  { id: "innervation", label: "İnnervasyon", icon: Activity },
  { id: "signal", label: "Sinyal", icon: Zap },
  { id: "atlas", label: "Atlas", icon: BookOpen },
  { id: "imaging", label: "MR / BT", icon: Scan },
  { id: "quiz", label: "Sınav", icon: GraduationCap },
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function AnatomyViewport() {
  const [CanvasComp, setCanvasComp] = useState<
    null | typeof import("@/components/anatomy/AnatomyCanvas").AnatomyCanvas
  >(null);
  useEffect(() => {
    let live = true;
    import("@/components/anatomy/AnatomyCanvas").then((m) => {
      if (live) setCanvasComp(() => m.AnatomyCanvas);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!CanvasComp) {
    return (
      <div className="absolute inset-0 grid place-items-center text-sm text-muted">
        Sahne hazırlanıyor
      </div>
    );
  }
  return (
    <div className="absolute inset-0">
      <CanvasComp />
    </div>
  );
}

export function Studio() {
  const mode = useStudio((s) => s.mode);
  const setMode = useStudio((s) => s.setMode);
  const welcome = useStudio((s) => s.welcome);
  const dismiss = useStudio((s) => s.dismissWelcome);
  const mounted = useMounted();
  const show3d = mode === "explore" || mode === "innervation" || mode === "signal";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-5">
        <div className="min-w-0">
          <p className="font-display text-lg leading-none text-fg">Cranialis</p>
          <p className="hidden truncate text-xs uppercase tracking-[0.16em] text-muted sm:block">
            Kafa çiftleri stüdyosu
          </p>
        </div>
        <nav className="scroll-thin ml-auto flex min-w-0 gap-1 overflow-x-auto">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <Button
                key={m.id}
                size="sm"
                variant={active ? "default" : "ghost"}
                onClick={() => {
                  setMode(m.id);
                  if (m.id === "signal") useStudio.getState().setPlaying(true);
                  if (m.id === "innervation") {
                    const s = useStudio.getState();
                    if (!s.layers.muscles) s.toggleLayer("muscles");
                    if (!s.layers.organs) s.toggleLayer("organs");
                  }
                }}
                className="shrink-0"
              >
                <Icon className="size-3.5" />
                <span className="hidden md:inline">{m.label}</span>
              </Button>
            );
          })}
        </nav>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] md:grid-rows-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <div className="order-2 border-t border-border md:order-none md:border-r md:border-t-0">
          <NerveRail />
        </div>

        <main className="relative order-1 min-h-0 md:order-none">
          {show3d && mounted && (
            <>
              <AnatomyViewport />
              <div className="studio-vignette absolute inset-0" />
              <LayerDock />
              <p className="pointer-events-none absolute bottom-3 left-3 text-xs uppercase tracking-[0.16em] text-muted">
                Sürükleyerek döndür · kaydırarak yaklaş
              </p>
            </>
          )}
          {show3d && !mounted && (
            <div className="grid h-full place-items-center text-sm text-muted">Sahne hazırlanıyor</div>
          )}
          {mode === "atlas" && <AtlasView />}
          {mode === "imaging" && <ImagingView />}
          {mode === "quiz" && <QuizView />}
        </main>

        <div className="order-3 hidden border-t border-border lg:block lg:border-l lg:border-t-0">
          {mode !== "quiz" && mode !== "atlas" && mode !== "imaging" && <DetailPanel />}
          {(mode === "atlas" || mode === "imaging" || mode === "quiz") && <MnemonicCard />}
        </div>
      </div>

      {mode !== "quiz" && mode !== "atlas" && mode !== "imaging" && (
        <div className="border-t border-border lg:hidden">
          <DetailPanel />
        </div>
      )}

      {welcome && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-bg/70 p-4 md:items-center">
          <div className="panel-enter max-w-lg rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Anatomi stüdyosu</p>
            <h1 className="mt-1 font-display text-3xl text-fg">On iki kafa çifti</h1>
            <p className="mt-3 text-sm text-muted">
              Beyin sapından çıkan sinirleri, innerve ettikleri kas ve organları ve aksiyon
              potansiyelinin yolunu izleyin. Atlas levhaları gerçeğe yakın anatomik çizimlerdir. MR
              ve BT paneli kesit mimarisiyle hazırdır; hasta serisi sonraki adımda bağlanacak.
            </p>
            <p className="mt-3 text-xs text-subtle">{MNEMONIC.namesTr}</p>
            <Button className="mt-5" onClick={dismiss}>
              Stüdyoyu aç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LayerDock() {
  const layers = useStudio((s) => s.layers);
  const toggle = useStudio((s) => s.toggleLayer);
  const side = useStudio((s) => s.side);
  const setSide = useStudio((s) => s.setSide);
  const explode = useStudio((s) => s.explode);
  const setExplode = useStudio((s) => s.setExplode);
  const labels = useStudio((s) => s.showLabels);
  const setLabels = useStudio((s) => s.setShowLabels);

  return (
    <div className="absolute right-3 top-3 z-10 flex max-w-full flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-1 rounded-lg bg-surface/90 p-1 shadow-[var(--shadow-border)] backdrop-blur-sm">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => toggle(l.id)}
            className={cn(
              "rounded-md px-2 py-1 text-xs",
              layers[l.id] ? "bg-surface-2 text-fg" : "text-muted",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-lg bg-surface/90 p-1 shadow-[var(--shadow-border)]">
        {(["both", "right", "left"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={cn(
              "rounded-md px-2 py-1 text-xs",
              side === s ? "bg-surface-2 text-fg" : "text-muted",
            )}
          >
            {s === "both" ? "Çift" : s === "right" ? "Sağ" : "Sol"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setExplode(!explode)}
          className={cn("rounded-md px-2 py-1 text-xs", explode ? "text-fg" : "text-muted")}
          aria-label="Ayır"
        >
          <SplitSquareHorizontal className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setLabels(!labels)}
          className={cn("rounded-md px-2 py-1 text-xs", labels ? "text-fg" : "text-muted")}
          aria-label="Etiketler"
        >
          <Layers className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function MnemonicCard() {
  return (
    <aside className="flex h-full flex-col justify-end gap-3 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-subtle">Anımsatıcı</p>
      <p className="font-display text-lg leading-snug text-fg">{MNEMONIC.names}</p>
      <p className="text-sm text-muted">{MNEMONIC.namesTr}</p>
      <p className="text-sm text-muted">{MNEMONIC.types}</p>
      <p className="text-sm text-muted">{MNEMONIC.extraocular}</p>
      <p className="text-xs text-subtle">Eğitim amaçlıdır; tanı veya tedavi için kullanılmaz.</p>
    </aside>
  );
}
