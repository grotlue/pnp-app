import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ListItemRowProps = {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ListItemRow({ children, actions, className }: ListItemRowProps) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[1fr_auto]",
        className,
      )}
    >
      {children}
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
