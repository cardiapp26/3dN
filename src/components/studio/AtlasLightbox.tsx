import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CRANIAL_NERVES, type AtlasPlate } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";

interface AtlasLightboxProps {
  plate: AtlasPlate | null;
  plates: readonly AtlasPlate[];
  onClose: () => void;
  onSelectPlate: (plate: AtlasPlate) => void;
}

export function AtlasLightbox({ plate, plates, onClose, onSelectPlate }: AtlasLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // The info panel sits beside the plate on wide screens; on phones it would bury it.
  const [showInfo, setShowInfo] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 768px)").matches,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const open = plate !== null;

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedId = useStudio((s) => s.selectedId);
  const setSelected = useStudio((s) => s.setSelected);

  const currentIndex = plate ? plates.findIndex((p) => p.id === plate.id) : -1;

  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onSelectPlate(plates[currentIndex - 1]);
      resetTransform();
    } else if (currentIndex === 0) {
      onSelectPlate(plates[plates.length - 1]);
      resetTransform();
    }
  }, [currentIndex, plates, onSelectPlate, resetTransform]);

  const handleNext = useCallback(() => {
    if (currentIndex < plates.length - 1) {
      onSelectPlate(plates[currentIndex + 1]);
      resetTransform();
    } else if (currentIndex === plates.length - 1) {
      onSelectPlate(plates[0]);
      resetTransform();
    }
  }, [currentIndex, plates, onSelectPlate, resetTransform]);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.35, 4));
  const zoomOut = () =>
    setZoom((z) => {
      const next = Math.max(z - 0.35, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });

  // Keyboard navigation
  useEffect(() => {
    if (!plate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && plates.length > 1) {
        handlePrev();
      } else if (e.key === "ArrowRight" && plates.length > 1) {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        resetTransform();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [plate, plates.length, onClose, handlePrev, handleNext, resetTransform]);

  // Prevent background scroll while open
  useEffect(() => {
    if (plate) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [plate]);

  // Move focus into the dialog so Esc and the arrow keys act on it at once.
  useEffect(() => {
    if (open) containerRef.current?.focus();
  }, [open]);

  // Track the real fullscreen state: the browser also leaves fullscreen on Esc.
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void containerRef.current?.requestFullscreen().catch(() => {});
  };

  // Pointer events so a zoomed plate pans with touch as well as the mouse.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (!plate) return null;

  // Portal to <body>: a transformed or display:none ancestor (the animated
  // detail panel, the hidden desktop panel on phones) would trap a fixed overlay.
  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={plate.title}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md transition-all duration-200 focus:outline-none"
    >
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-xs uppercase tracking-[0.2em] text-accent">
            Tabula {currentIndex + 1}/{plates.length}
          </span>
          <div className="hidden sm:block">
            <span className="font-medium text-white">{plate.title}</span>
            <span className="ml-2 italic text-white/50 text-xs">{plate.latinTitle}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={zoomIn}
            title="Yakınlaştır (+)"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={zoomOut}
            disabled={zoom <= 1}
            title="Uzaklaştır (-)"
            className="text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={resetTransform}
            disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
            title="Sıfırla (0)"
            className="text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <RotateCcw className="size-4" />
          </Button>
          <span className="text-xs tabular-nums text-white/60 min-w-10 text-center">
            %{Math.round(zoom * 100)}
          </span>

          <div className="mx-1 h-4 w-px bg-white/15" />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowInfo((s) => !s)}
            title="Bilgi Panelini Aç/Kapat"
            className={cn(
              "text-white/80 hover:bg-white/10 hover:text-white",
              showInfo && "bg-white/10 text-accent",
            )}
          >
            <Info className="size-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFullscreen}
            title="Tam Ekran"
            className="hidden sm:flex text-white/80 hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>

          <div className="mx-1 h-4 w-px bg-white/15" />

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            title="Kapat (Esc)"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Stage: the plate and its paging arrows, laid out apart from the info panel */}
        <div className="relative flex min-w-0 flex-1">
          {plates.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Önceki levha"
              className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white/70 backdrop-blur transition-colors hover:bg-black/80 hover:text-white"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          <div
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center overflow-hidden p-4 select-none",
              zoom > 1
                ? isDragging
                  ? "cursor-grabbing touch-none"
                  : "cursor-grab touch-none"
                : "cursor-default",
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={() => {
              if (zoom > 1) {
                resetTransform();
              } else {
                setZoom(2);
              }
            }}
          >
            <div
              className="relative flex items-center justify-center transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                maxHeight: "100%",
                maxWidth: "100%",
              }}
            >
              <img
                src={plate.src}
                alt={plate.title}
                draggable={false}
                className={cn(
                  "max-h-[calc(100dvh-8rem)] max-w-[calc(100vw-6rem)] rounded-lg object-contain shadow-2xl ring-1 ring-white/15",
                  showInfo && "md:max-w-[calc(100vw-26rem)]",
                )}
              />
            </div>
          </div>

          {plates.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Sonraki levha"
              className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white/70 backdrop-blur transition-colors hover:bg-black/80 hover:text-white"
            >
              <ChevronRight className="size-6" />
            </button>
          )}
        </div>

        {/* Anatomical Information Sidebar */}
        {showInfo && (
          <aside className="scroll-thin absolute inset-x-0 bottom-0 z-30 max-h-[55%] overflow-y-auto border-t border-white/10 bg-black/90 p-5 text-white backdrop-blur-md md:static md:max-h-none md:w-80 md:shrink-0 md:border-l md:border-t-0 md:bg-black/80">
            <div className="space-y-5">
              <div>
                <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">
                  Atlas Levhası
                </p>
                <h3 className="text-xl font-semibold text-white mt-1">{plate.title}</h3>
                <p className="italic text-sm text-white/60 mt-0.5">{plate.latinTitle}</p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-[0.16em] text-white/50 font-medium">
                  Anatomik Açıklama
                </h4>
                <p className="mt-1.5 text-sm text-white/80 leading-relaxed">{plate.description}</p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-[0.16em] text-white/50 font-medium mb-2">
                  İzlenen Yapılar
                </h4>
                <ul className="space-y-1.5">
                  {plate.structures.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-white/85">
                      <CheckCircle2 className="size-3.5 text-accent shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-[0.16em] text-white/50 font-medium mb-2">
                  İlgili Kafa Çiftleri
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {plate.nerveIds.map((id) => {
                    const n = CRANIAL_NERVES[id - 1];
                    const isCurrent = selectedId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelected(id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all",
                          isCurrent
                            ? "bg-accent text-accent-foreground font-semibold ring-2 ring-accent/50"
                            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white",
                        )}
                      >
                        <span className="font-bold">{n.roman}</span>
                        <span className="italic">{n.nameLa}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-3 text-xs text-white/50 border border-white/5">
                <p className="font-medium text-white/70 mb-1">İpucu:</p>
                <p>
                  Görseli çift tıklayarak büyütebilir, büyüttükten sonra sürükleyerek
                  kaydırabilirsiniz.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>,
    document.body,
  );
}
