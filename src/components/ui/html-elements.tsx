import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

type UiDivProps = ComponentPropsWithoutRef<"div">;
type UiMainProps = ComponentPropsWithoutRef<"main">;
type UiPreProps = ComponentPropsWithoutRef<"pre">;

export function UiDiv({ className, ...props }: UiDivProps) {
  return <div className={cn(className)} {...props} />;
}

export function UiMain({ className, ...props }: UiMainProps) {
  return <main className={cn(className)} {...props} />;
}

export function UiPre({ className, ...props }: UiPreProps) {
  return <pre className={cn(className)} {...props} />;
}
