import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

type UiDivTextStyle =
  | "xs"
  | "sm"
  | "muted"
  | "muted-xs"
  | "muted-sm"
  | "medium"
  | "sm-medium"
  | "mono-xs-break"
  | "muted-mono-2xs-break";

type UiDivGridPreset =
  | "two-md"
  | "character-detail"
  | "home-character-header"
  | "home-character-row"
  | "home-campaign-header"
  | "home-campaign-row";

type UiDivProps = ComponentPropsWithoutRef<"div"> & {
  stack?: 1 | 2 | 3 | 4;
  gridGap?: 2 | 4;
  gridPreset?: UiDivGridPreset;
  wrapGap?: 2;
  inlineGap?: 2;
  contentAlign?: "center" | "between";
  textStyle?: UiDivTextStyle;
  surface?:
    | "danger-chip"
    | "outlined-box"
    | "avatar-frame"
    | "avatar-fallback"
    | "info-box"
    | "muted-panel"
    | "pending-row";
  mt?: 1;
  mb?: 2;
};
type UiMainProps = ComponentPropsWithoutRef<"main">;
type UiPreProps = ComponentPropsWithoutRef<"pre"> & {
  format?: "default" | "log";
};
type UiStackProps = ComponentPropsWithoutRef<"div">;
type UiFormGridProps = ComponentPropsWithoutRef<"div">;
type UiMutedTextProps = ComponentPropsWithoutRef<"div"> & {
  size?: "xs" | "sm";
};

const STACK_CLASS = {
  1: "space-y-1",
  2: "space-y-2",
  3: "space-y-3",
  4: "space-y-4",
} as const;

const GRID_GAP_CLASS = {
  2: "grid gap-2",
  4: "grid gap-4",
} as const;

const GRID_PRESET_CLASS = {
  "two-md": "grid gap-4 md:grid-cols-2",
  "character-detail": "grid gap-4 md:grid-cols-[200px_1fr]",
  "home-character-header":
    "text-muted-foreground grid gap-2 px-1 text-[11px] font-medium md:grid-cols-[1fr_170px]",
  "home-character-row": "grid gap-2 md:grid-cols-[1fr_170px]",
  "home-campaign-header":
    "text-muted-foreground grid gap-2 px-1 text-[11px] font-medium md:grid-cols-[1fr_150px_80px]",
  "home-campaign-row": "grid gap-2 md:grid-cols-[1fr_150px_80px]",
} as const;

const WRAP_GAP_CLASS = {
  2: "flex flex-wrap gap-2",
} as const;

const INLINE_GAP_CLASS = {
  2: "flex gap-2",
} as const;

export function UiDiv({ className, ...props }: UiDivProps) {
  const {
    stack,
    gridGap,
    gridPreset,
    wrapGap,
    inlineGap,
    contentAlign,
    textStyle,
    surface,
    mt,
    mb,
    ...domProps
  } = props;

  return (
    <div
      className={cn(
        stack ? STACK_CLASS[stack] : "",
        gridGap ? GRID_GAP_CLASS[gridGap] : "",
        gridPreset ? GRID_PRESET_CLASS[gridPreset] : "",
        wrapGap ? WRAP_GAP_CLASS[wrapGap] : "",
        inlineGap ? INLINE_GAP_CLASS[inlineGap] : "",
        contentAlign === "center" ? "items-center" : "",
        contentAlign === "between" ? "items-center justify-between" : "",
        textStyle === "xs" ? "text-xs" : "",
        textStyle === "sm" ? "text-sm" : "",
        textStyle === "muted" ? "text-muted-foreground" : "",
        textStyle === "muted-xs" ? "text-muted-foreground text-xs" : "",
        textStyle === "muted-sm" ? "text-muted-foreground text-sm" : "",
        textStyle === "medium" ? "font-medium" : "",
        textStyle === "sm-medium" ? "text-sm font-medium" : "",
        textStyle === "mono-xs-break" ? "font-mono text-xs break-all" : "",
        textStyle === "muted-mono-2xs-break"
          ? "text-muted-foreground font-mono text-[11px] break-all"
          : "",
        surface === "danger-chip"
          ? "border-destructive/40 bg-destructive/10 text-destructive inline-flex w-fit rounded-md border px-2 py-1 text-xs font-medium"
          : "",
        surface === "outlined-box" ? "border-border rounded border p-2" : "",
        surface === "avatar-frame"
          ? "border-border bg-muted/30 overflow-hidden rounded-lg border"
          : "",
        surface === "avatar-fallback"
          ? "text-muted-foreground flex h-[200px] items-center justify-center text-xs"
          : "",
        surface === "info-box"
          ? "border-border bg-background/70 text-muted-foreground rounded-lg border p-3 text-xs"
          : "",
        surface === "muted-panel"
          ? "border-border bg-muted/40 rounded-md border p-3"
          : "",
        surface === "pending-row"
          ? "border-border flex flex-wrap items-center gap-2 rounded border px-2 py-2 text-xs"
          : "",
        mt === 1 ? "mt-1" : "",
        mb === 2 ? "mb-2" : "",
        className,
      )}
      {...domProps}
    />
  );
}

export function UiMain({ className, ...props }: UiMainProps) {
  return <main className={cn(className)} {...props} />;
}

export function UiPre({ className, format = "default", ...props }: UiPreProps) {
  return (
    <pre
      className={cn(
        format === "log"
          ? "mt-1 overflow-auto text-xs whitespace-pre-wrap"
          : "",
        className,
      )}
      {...props}
    />
  );
}

export function UiStack({ className, ...props }: UiStackProps) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function UiFormGrid({ className, ...props }: UiFormGridProps) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function UiMutedText({
  className,
  size = "xs",
  ...props
}: UiMutedTextProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground",
        size === "xs" ? "text-xs" : "text-sm",
        className,
      )}
      {...props}
    />
  );
}
