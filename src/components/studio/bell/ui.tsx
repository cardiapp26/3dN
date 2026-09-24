import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared shells for the Bell palsy module: compact cards in the studio tokens
 * (gold, motor, mixed, sensory) so the clinical screens stay in one palette.
 */

type Tone = "plain" | "danger" | "caution" | "info";

const TONE_RING: Record<Tone, string> = {
  plain: "border-border bg-surface",
  danger: "border-motor/40 bg-motor/5",
  caution: "border-gold/35 bg-gold/5",
  info: "border-sensory/35 bg-sensory/5",
};

const TONE_TEXT: Record<Tone, string> = {
  plain: "text-gold",
  danger: "text-motor",
  caution: "text-gold",
  info: "text-sensory",
};

/** Card with a small eyebrow and an optional title. */
export function Panel({
  eyebrow,
  title,
  tone = "plain",
  className,
  children,
}: {
  eyebrow?: string;
  title?: ReactNode;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border p-3.5", TONE_RING[tone], className)}>
      {(eyebrow || title) && (
        <header className="mb-2">
          {eyebrow && <p className={cn("eyebrow", TONE_TEXT[tone])}>{eyebrow}</p>}
          {title && <h3 className="latin mt-0.5 text-base leading-tight text-fg">{title}</h3>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Short warning or hint: one icon, one paragraph. */
export function Callout({
  icon: Icon,
  title,
  tone = "caution",
  children,
}: {
  icon: LucideIcon;
  title: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex gap-2.5 rounded-lg border px-3 py-2.5", TONE_RING[tone])}>
      <Icon className={cn("mt-0.5 size-3.5 shrink-0", TONE_TEXT[tone])} />
      <div className="min-w-0">
        <p className={cn("text-xs font-semibold", TONE_TEXT[tone])}>{title}</p>
        <div className="mt-0.5 text-xs leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}

/** Secondary reading, folded away so the first screen stays short. */
export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-border bg-surface">
      <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium text-fg marker:content-['']">
        {title}
        <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="space-y-2 px-3 pb-3 text-xs leading-relaxed text-muted">{children}</div>
    </details>
  );
}

/** One-line pill used by the pattern pickers. */
export function Chip({
  active,
  onClick,
  label,
  caption,
  tone = "plain",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  caption?: string;
  tone?: Tone;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={caption}
      className={cn(
        "inline-flex shrink-0 items-baseline gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-[var(--motion-quick)]",
        active
          ? cn(TONE_RING[tone === "plain" ? "caution" : tone], "text-fg")
          : "border-border bg-surface text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <span className="font-medium">{label}</span>
      {caption && <span className="latin hidden text-[11px] text-muted sm:inline">{caption}</span>}
    </button>
  );
}
