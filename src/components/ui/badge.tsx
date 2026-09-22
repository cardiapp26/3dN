import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset",
  {
    variants: {
      tone: {
        default: "bg-surface-2 text-muted ring-border",
        sensory: "bg-sensory/10 text-sensory ring-sensory/30",
        motor: "bg-motor/10 text-motor ring-motor/30",
        mixed: "bg-mixed/10 text-mixed ring-mixed/30",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
