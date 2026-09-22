import { useState, useMemo } from "react";
import { Search, Maximize2, Sparkles, Filter } from "lucide-react";
import { ATLAS_PLATES, CRANIAL_NERVES, type AtlasPlate } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";
import { AtlasLightbox } from "./AtlasLightbox";

export function AtlasView() {
  const selectedId = useStudio((s) => s.selectedId);
  const setSelected = useStudio((s) => s.setSelected);

  const [activePlate, setActivePlate] = useState<AtlasPlate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNerveId, setFilterNerveId] = useState<number | null>(null);

  // Filter plates based on search and nerve filter
  const filteredPlates = useMemo(() => {
    return ATLAS_PLATES.filter((p) => {
      // Filter by nerve
      if (filterNerveId !== null && !p.nerveIds.includes(filterNerveId)) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesLatin = p.latinTitle.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesStructures = p.structures.some((s) => s.toLowerCase().includes(q));
        const matchesNerve = p.nerveIds.some((id) => {
          const n = CRANIAL_NERVES[id - 1];
          return (
            n.roman.toLowerCase().includes(q) ||
            n.nameTr.toLowerCase().includes(q) ||
            n.nameLa.toLowerCase().includes(q)
          );
        });
        return matchesTitle || matchesLatin || matchesDesc || matchesStructures || matchesNerve;
      }
      return true;
    }).sort((a, b) => {
      if (!selectedId) return 0;
      const ar = a.nerveIds.includes(selectedId) ? 0 : 1;
      const br = b.nerveIds.includes(selectedId) ? 0 : 1;
      return ar - br;
    });
  }, [filterNerveId, searchQuery, selectedId]);

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-bg p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 max-w-4xl">
        <div className="flex items-center gap-2">
          <p className="eyebrow text-accent">Anatomi Atlası</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            <Sparkles className="size-3" /> Netter & Sobotta Ekolü
          </span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl text-fg mt-1">Klasik Kafa Çiftleri Levhaları</h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Tıbbi anatomi çizimleri. Kranial sinirlerin beyin sapından çıkışı, kafa tabanı geçişleri,
          dal anatomisi ve kas/organ innervasyonu. Ayrıntılı incelemek için levhalara tıklayabilir,
          büyüteçle yakınlaştırabilirsiniz.
        </p>

        {/* Search & Filter Bar */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Levha, yapı veya sinir ara (örn. vagus, ganglion, foramen)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scroll-thin">
            <button
              type="button"
              onClick={() => setFilterNerveId(null)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium shrink-0 transition-colors",
                filterNerveId === null
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-2 text-muted hover:text-fg",
              )}
            >
              Tümü ({ATLAS_PLATES.length})
            </button>
            {CRANIAL_NERVES.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setFilterNerveId(filterNerveId === n.id ? null : n.id)}
                title={`${n.roman} - ${n.nameTr}`}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium shrink-0 transition-colors",
                  filterNerveId === n.id
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                CN {n.roman}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid of Plates */}
      {filteredPlates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center text-muted">
          <Filter className="size-8 text-muted/50 mb-2" />
          <p className="font-medium text-fg">Eşleşen atlas levhası bulunamadı</p>
          <p className="text-xs text-muted mt-1">Arama teriminizi veya sinir filtresini değiştirmeyi deneyin.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPlates.map((p) => {
            const isRelevantToSelected = selectedId !== null && p.nerveIds.includes(selectedId);

            return (
              <figure
                key={p.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl bg-surface border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
                  isRelevantToSelected
                    ? "border-accent/40 ring-1 ring-accent/20 shadow-md"
                    : "border-border shadow-[var(--shadow-border)]",
                )}
              >
                {/* Image Container with Zoom Trigger */}
                <button
                  type="button"
                  aria-label={`${p.title} levhasını incele`}
                  className="atlas-frame-wrap relative aspect-[4/3] w-full cursor-pointer bg-[#0c0a09]"
                  onClick={() => setActivePlate(p)}
                >
                  <img
                    src={p.src}
                    alt={p.title}
                    className="atlas-img w-full h-full object-contain p-1"
                    crossOrigin="anonymous"
                    loading="lazy"
                  />

                  {/* Orientation badge */}
                  <span className="absolute left-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white/70 backdrop-blur">
                    {p.orientation === "portrait" ? "DİKEY" : "YATAY"}
                  </span>

                  {/* Hover Overlay */}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-lg">
                      <Maximize2 className="size-3.5" /> İncele & Yakınlaştır
                    </span>
                  </span>
                </button>

                {/* Card Information */}
                <figcaption className="flex flex-1 flex-col justify-between p-4.5 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-fg">
                        <button
                          type="button"
                          onClick={() => setActivePlate(p)}
                          className="text-left transition-colors hover:text-accent"
                        >
                          {p.title}
                        </button>
                      </h3>
                    </div>
                    <p className="latin text-xs text-muted/70 italic mt-0.5">{p.latinTitle}</p>
                    <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Related Nerve Badges */}
                  <div className="pt-2 border-t border-border/60">
                    <p className="text-[10px] uppercase tracking-wider text-muted/60 mb-1.5">
                      Kapsanan Sinirler
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.nerveIds.map((id) => {
                        const n = CRANIAL_NERVES[id - 1];
                        const isCurrent = selectedId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(id);
                            }}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] transition-colors",
                              isCurrent
                                ? "bg-accent text-accent-foreground font-semibold"
                                : "bg-surface-2 text-muted hover:text-fg hover:bg-surface-2/80",
                            )}
                          >
                            {n.roman} <span className="italic">{n.nameLa}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      {/* Full-resolution Interactive Lightbox */}
      <AtlasLightbox
        plate={activePlate}
        plates={ATLAS_PLATES}
        onClose={() => setActivePlate(null)}
        onSelectPlate={(plate) => setActivePlate(plate)}
      />
    </div>
  );
}
