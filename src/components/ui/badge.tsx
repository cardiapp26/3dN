import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide",
  {
    variants: {
      tone: {
        default: "bg-surface-2 text-muted",
        sensory: "bg-sensory/15 text-sensory",
        motor: "bg-motor/15 text-motor",
        mixed: "bg-mixed/15 text-mixed",
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
