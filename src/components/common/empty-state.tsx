import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  label: string;
  className?: string;
};

export function EmptyState({ label, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-background/70 text-muted-foreground rounded-lg border p-3 text-xs",
        className,
      )}
    >
      {label}
    </div>
  );
}
