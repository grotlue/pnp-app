import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  label: string;
  className?: string;
};

export function EmptyState({ label, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground",
        className,
      )}
    >
      {label}
    </div>
  );
}
