import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

export const formControlClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function FormInput({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(formControlClass, className)} {...props} />;
}

export function FormTextarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cn(formControlClass, className)} {...props} />;
}

export function FormSelect({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return <select className={cn(formControlClass, className)} {...props} />;
}

export function FormLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  );
}
