import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionBoxProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function SectionBox({
  title,
  children,
  className,
  titleClassName,
}: SectionBoxProps) {
  return (
    <div
      className={cn(
        "border-border bg-background/70 rounded-lg border p-3",
        className,
      )}
    >
      {title ? (
        <div className={cn("mb-2 text-sm font-medium", titleClassName)}>
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}
