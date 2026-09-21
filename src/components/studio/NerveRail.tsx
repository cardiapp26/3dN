import { CRANIAL_NERVES, TYPE_LABEL } from "@/lib/cranial-nerves";
import { useStudio } from "@/lib/studio-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NerveRail() {
  const selectedId = useStudio((s) => s.selectedId);
  const setSelected = useStudio((s) => s.setSelected);
  const setHovered = useStudio((s) => s.setHovered);

  return (
    <nav
      aria-label="Kafa çiftleri"
      className="scroll-thin flex gap-2 overflow-x-auto p-3 md:h-full md:flex-col md:overflow-y-auto md:overflow-x-hidden"
    >
      {CRANIAL_NERVES.map((n) => {
        const active = selectedId === n.id;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => setSelected(active ? null : n.id)}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "flex min-h-11 min-w-[11.5rem] shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left shadow-[var(--shadow-border)] transition-[background-color,opacity] duration-[var(--motion-quick)] md:min-w-0 md:w-full",
              active ? "bg-surface-2" : "bg-surface hover:bg-surface-2",
            )}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums"
              style={{ background: `${n.color}22`, color: n.color }}
            >
              {n.roman}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{n.nameTr}</span>
              <span className="block truncate text-xs text-muted italic">{n.nameLa}</span>
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
