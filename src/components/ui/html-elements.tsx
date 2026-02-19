import type { ComponentPropsWithoutRef } from "react";

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
  layout?: "inline-between" | (string & {});
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
  paddingTop?: number;
  paddingY?: number;
  paddingBottom?: number;
  paddingX?: number;
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

export function UiDiv({
  className,
  stack: _stack,
  layout: _layout,
  gridGap: _gridGap,
  gridPreset: _gridPreset,
  wrapGap: _wrapGap,
  inlineGap: _inlineGap,
  contentAlign: _contentAlign,
  textStyle: _textStyle,
  surface: _surface,
  mt: _mt,
  mb: _mb,
  paddingTop: _paddingTop,
  paddingY: _paddingY,
  paddingBottom: _paddingBottom,
  paddingX: _paddingX,
  ...props
}: UiDivProps) {
  void _stack;
  void _layout;
  void _gridGap;
  void _gridPreset;
  void _wrapGap;
  void _inlineGap;
  void _contentAlign;
  void _textStyle;
  void _surface;
  void _mt;
  void _mb;
  void _paddingTop;
  void _paddingY;
  void _paddingBottom;
  void _paddingX;
  return <div className={className} {...props} />;
}

export function UiMain({ className, ...props }: UiMainProps) {
  return <main className={className} {...props} />;
}

export function UiPre({
  className,
  format: _format = "default",
  ...props
}: UiPreProps) {
  void _format;
  return <pre className={className} {...props} />;
}

export function UiStack({ className, ...props }: UiStackProps) {
  return <div className={className} {...props} />;
}

export function UiFormGrid({ className, ...props }: UiFormGridProps) {
  return <div className={className} {...props} />;
}

export function UiMutedText({
  className,
  size: _size = "xs",
  ...props
}: UiMutedTextProps) {
  void _size;
  return <div className={className} {...props} />;
}
