import { CRANIAL_NERVES, TYPE_LABEL } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Index of the twelve pairs, set like the plate list of an anatomical atlas. */
export function NerveRail() {
  const selectedId = useStudio((s) => s.selectedId);
  const setSelected = useStudio((s) => s.setSelected);
  const setHovered = useStudio((s) => s.setHovered);

  return (
    <nav
      aria-label="Kafa çiftleri"
      className="paper scroll-thin flex gap-2 overflow-x-auto p-3 md:h-full md:flex-col md:gap-0.5 md:overflow-y-auto md:overflow-x-hidden md:p-2"
    >
      <p className="eyebrow hidden px-3 pb-2 pt-3 md:block">Nervi craniales</p>
      {CRANIAL_NERVES.map((n) => {
        const active = selectedId === n.id;
        return (
          <button
            key={n.id}
            type="button"
            aria-pressed={active}
            onClick={() => setSelected(active ? null : n.id)}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "group relative flex min-h-12 min-w-[12.5rem] shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left transition-[background-color] duration-[var(--motion-quick)] md:min-w-0 md:w-full",
              active ? "bg-surface-2 shadow-[var(--shadow-border)]" : "bg-surface md:bg-transparent hover:bg-surface-2",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold transition-opacity duration-[var(--motion-quick)]",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <span
              className="w-8 shrink-0 text-center font-display text-2xl font-semibold leading-none tabular-nums"
              style={{ color: n.color }}
            >
              {n.roman}
            </span>
            <span className="min-w-0 flex-1">
              <span className="latin block truncate text-[1.0625rem] leading-tight text-fg">{n.nameLa}</span>
              <span className="block truncate text-xs text-muted">{n.nameTr}</span>
            </span>
            <Badge tone={n.type} className="hidden sm:inline-flex">
              {TYPE_LABEL[n.type]}
            </Badge>
          </button>
        );
      })}
    </nav>
  );
}
