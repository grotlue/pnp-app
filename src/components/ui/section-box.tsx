import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionBoxProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  stack?: 1 | 2 | 3 | 4;
  textStyle?: "sm";
};

export function SectionBox({
  title,
  children,
  className,
  titleClassName,
  stack,
  textStyle,
}: SectionBoxProps) {
  return (
    <div
      className={cn(
        "border-border bg-background/70 rounded-lg border p-3",
        stack === 1 ? "space-y-1" : "",
        stack === 2 ? "space-y-2" : "",
        stack === 3 ? "space-y-3" : "",
        stack === 4 ? "space-y-4" : "",
        textStyle === "sm" ? "text-sm" : "",
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
