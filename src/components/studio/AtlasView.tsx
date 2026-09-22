import { ATLAS_PLATES, CRANIAL_NERVES } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";

export function AtlasView() {
  const selectedId = useStudio((s) => s.selectedId);
  const setSelected = useStudio((s) => s.setSelected);
  const plates = selectedId
    ? [...ATLAS_PLATES].sort((a, b) => {
        const ar = (a.nerveIds as readonly number[]).includes(selectedId) ? 0 : 1;
        const br = (b.nerveIds as readonly number[]).includes(selectedId) ? 0 : 1;
        return ar - br;
      })
    : ATLAS_PLATES;

  return (
    <div className="scroll-thin h-full overflow-y-auto bg-bg p-4 md:p-6">
      <header className="mb-5 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Anatomi atlası</p>
        <h2 className="font-display text-3xl text-fg">Netter tarzı levhalar</h2>
        <p className="mt-2 text-sm text-muted">
          Gerçeğe yakın yağlıboya anatomik çizimler. Levha etiketleri 3D sahnede ve sağ panelde;
          çizimler kas, organ ve sinir seyrini gösterir.
        </p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {plates.map((p) => (
          <figure
            key={p.src}
            className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
          >
            <img
              src={p.src}
              alt={p.title}
              className="atlas-frame w-full object-cover"
              crossOrigin="anonymous"
            />
            <figcaption className="space-y-2 p-4">
              <p className="font-medium text-fg">{p.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.nerveIds.map((id) => {
                  const n = CRANIAL_NERVES[id - 1];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelected(id)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        selectedId === id ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted",
                      )}
                    >
                      {n.roman} <span className="italic">{n.nameLa}</span>
                    </button>
                  );
                })}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
