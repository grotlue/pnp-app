import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  label: string;
  className?: string;
  variant?: "default" | "ghost" | "panel";
};

export function EmptyState({
  label,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        variant === "default"
          ? "border-border bg-background/70 text-muted-foreground rounded-lg border p-3 text-xs"
          : variant === "panel"
            ? "text-muted-foreground bg-background p-3"
            : "text-muted-foreground border-0 bg-transparent p-0",
        className,
      )}
    >
      {label}
    </div>
  );
}
