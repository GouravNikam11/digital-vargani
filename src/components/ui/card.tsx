import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-3xl border border-border bg-card p-4 shadow-sm", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & { tone?: "default" | "success" | "danger" | "warning" }) {
  const tones = {
    default: "bg-muted text-foreground",
    success: "bg-emerald-50 text-success",
    danger: "bg-rose-50 text-danger",
    warning: "bg-amber-50 text-amber-800",
  };
  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
