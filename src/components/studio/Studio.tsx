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
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAYERS, MNEMONIC, type StudioMode } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";
import { AtlasView } from "./AtlasView";
import { BellPalsyView } from "./BellPalsyView";
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
  { id: "bell", label: "Bell Paralizisi", icon: Stethoscope },
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
  const mounted = useMounted();
  const show3d = mode === "explore" || mode === "innervation" || mode === "signal";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-5">
        <div className="flex min-w-0 items-baseline gap-3">
          <p className="latin text-2xl leading-none text-fg">
            Cranialis<span className="text-gold">.</span>
          </p>
          <p className="eyebrow hidden truncate sm:block">Atlas nervorum cranialium</p>
        </div>
        <nav
          aria-label="Modlar"
          className="scroll-thin ml-auto flex min-w-0 gap-0.5 overflow-x-auto rounded-full bg-surface p-1 shadow-[var(--shadow-border)]"
        >
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <Button
                key={m.id}
                size="sm"
                variant="ghost"
                aria-label={m.label}
                aria-pressed={active}
                onClick={() => {
                  setMode(m.id);
                  if (m.id === "signal") useStudio.getState().setPlaying(true);
                  if (m.id === "innervation") {
                    const s = useStudio.getState();
                    if (!s.layers.muscles) s.toggleLayer("muscles");
                    if (!s.layers.organs) s.toggleLayer("organs");
                  }
                }}
                className={cn("shrink-0 rounded-full", active && "bg-surface-2 text-fg")}
              >
                <Icon className={cn("size-3.5", active && "text-gold")} />
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
              <p className="eyebrow pointer-events-none absolute bottom-3 left-3">
                Sürükleyerek döndür · kaydırarak yaklaş
              </p>
            </>
          )}
          {show3d && !mounted && (
            <div className="grid h-full place-items-center text-sm text-muted">
              Sahne hazırlanıyor
            </div>
          )}
          {mode === "atlas" && <AtlasView />}
          {mode === "imaging" && <ImagingView />}
          {mode === "quiz" && <QuizView />}
          {mode === "bell" && <BellPalsyView />}
        </main>

        <div className="order-3 hidden border-t border-border lg:block lg:border-l lg:border-t-0">
          {mode === "bell" && <BellSideCard />}
          {mode !== "quiz" && mode !== "atlas" && mode !== "imaging" && mode !== "bell" && (
            <DetailPanel />
          )}
          {(mode === "atlas" || mode === "imaging" || mode === "quiz") && <MnemonicCard />}
        </div>
      </div>

      {mode !== "quiz" && mode !== "atlas" && mode !== "imaging" && mode !== "bell" && (
        <div className="border-t border-border lg:hidden">
          <DetailPanel />
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
      <div className="flex flex-wrap justify-end gap-0.5 rounded-xl bg-surface/80 p-1 shadow-[var(--shadow-border)] backdrop-blur-md">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={layers[l.id]}
            onClick={() => toggle(l.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors duration-[var(--motion-quick)]",
              layers[l.id] ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
            )}
          >
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full", layers[l.id] ? "bg-gold" : "bg-subtle/50")}
            />
            {l.label}
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 rounded-xl bg-surface/80 p-1 shadow-[var(--shadow-border)] backdrop-blur-md">
        {(["both", "right", "left"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            aria-pressed={side === s}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs transition-colors duration-[var(--motion-quick)]",
              side === s ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
            )}
          >
            {s === "both" ? "Çift" : s === "right" ? "Sağ" : "Sol"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setExplode(!explode)}
          aria-pressed={explode}
          className={cn(
            "rounded-lg px-2 py-1 text-xs",
            explode ? "text-gold" : "text-muted hover:text-fg",
          )}
          aria-label="Ayır"
        >
          <SplitSquareHorizontal className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setLabels(!labels)}
          aria-pressed={labels}
          className={cn(
            "rounded-lg px-2 py-1 text-xs",
            labels ? "text-gold" : "text-muted hover:text-fg",
          )}
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
    <aside className="paper flex h-full flex-col justify-end gap-3 p-6">
      <p className="eyebrow">Mnemonica · Anımsatıcı</p>
      <p className="latin text-2xl leading-snug text-fg">{MNEMONIC.names}</p>
      <hr className="rule-gold" />
      <p className="text-sm text-muted">{MNEMONIC.namesTr}</p>
      <p className="text-sm text-muted">{MNEMONIC.types}</p>
      <p className="text-sm text-muted">{MNEMONIC.extraocular}</p>
      <p className="text-xs text-subtle">Eğitim amaçlıdır; tanı veya tedavi için kullanılmaz.</p>
    </aside>
  );
}

function BellSideCard() {
  const setSelected = useStudio((s) => s.setSelected);
  const setMode = useStudio((s) => s.setMode);

  return (
    <aside className="paper scroll-thin flex h-full flex-col justify-between gap-5 overflow-y-auto p-6">
      <div className="space-y-4">
        <div>
          <p className="eyebrow text-gold">Klinik Öğrenme Kartı</p>
          <h2 className="latin mt-1 text-2xl leading-tight text-fg">N. facialis & Bell</h2>
          <p className="text-xs text-muted">Patern · güvenlik ağı · kornea</p>
          <hr className="rule-gold mt-3" />
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-muted">
          <div className="rounded-lg bg-surface p-3">
            <p className="font-semibold text-fg">Etiyoloji ve Mekanizma</p>
            <p className="mt-1">
              Bell paralizisi idiyopatik akut periferik fasiyal nöropatidir. Viral reaktivasyon
              olası mekanizmalardan biridir; tanı diğer nedenler dışlandıktan sonra konur.
            </p>
          </div>

          <div className="rounded-lg bg-surface p-3">
            <p className="font-semibold text-fg">Santral ve Periferik Patern</p>
            <p className="mt-1">
              Alın korunması santral paterni destekler. Alın tutulumu inmeyi tek başına dışlamaz;
              eşlik eden nörolojik bulgular ve başlangıç zamanı belirleyicidir.
            </p>
          </div>

          <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
            <p className="font-semibold text-gold">En Kritik Adım: Göz Koruma</p>
            <p className="mt-1 text-fg/90">
              Lagoftalmi korneayı riske atar. Lubrikasyon ve gece koruması kapanma kusuruna göre
              planlanır; ağrı, kızarıklık veya görme azalması acil değerlendirilir.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full gap-2 border border-border"
          onClick={() => {
            setSelected(7);
            setMode("innervation");
          }}
        >
          <Sparkles className="size-3.5 text-gold" />
          <span>3D N. Facialis'e Odaklan</span>
        </Button>
        <p className="text-center text-[10px] text-subtle">Cranialis · Nörolojik Simülasyon</p>
      </div>
    </aside>
  );
}
