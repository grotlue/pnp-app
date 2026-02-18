import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { UiDiv, UiMain } from "@/components/ui/html-elements";
import { cn } from "@/lib/utils/cn";

const APP_PAGE_BACKGROUND_CLASS =
  "min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))]";
const APP_PAGE_MAIN_BASE_CLASS = "mx-auto w-full px-4 py-8";
const AUTH_CARD_PAGE_MAIN_CLASS =
  "min-h-screen bg-[linear-gradient(130deg,oklch(0.96_0.04_76),oklch(0.98_0.01_180)_40%,oklch(0.95_0.05_138))] px-4 py-12";
const AUTH_RADIAL_PAGE_MAIN_CLASS =
  "min-h-screen bg-[radial-gradient(circle_at_12%_20%,oklch(0.94_0.06_80),transparent_40%),radial-gradient(circle_at_90%_25%,oklch(0.93_0.04_185),transparent_35%)] px-4 py-12";

const APP_PAGE_MAX_WIDTH_CLASS = {
  md: "max-w-md",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
} as const;

type AppPageMaxWidth = keyof typeof APP_PAGE_MAX_WIDTH_CLASS;

type AppPageShellProps = {
  children: ReactNode;
  maxWidth?: AppPageMaxWidth;
  className?: string;
  contentClassName?: string;
};

type PageViewportProps = ComponentPropsWithoutRef<"main">;

type AppPageBackgroundProps = ComponentPropsWithoutRef<"div">;

type AppPageMainProps = ComponentPropsWithoutRef<"main"> & {
  maxWidth?: AppPageMaxWidth;
  layout?: "default" | "stack-4" | "grid-4";
};

type AuthCardPageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

type AuthCardPageMainProps = ComponentPropsWithoutRef<"main">;
type AuthCardPageContentProps = ComponentPropsWithoutRef<"div">;
type AuthRadialPageMainProps = ComponentPropsWithoutRef<"main">;
type CompactPageViewportProps = ComponentPropsWithoutRef<"main">;

export function AppPageBackground({
  className,
  ...props
}: AppPageBackgroundProps) {
  return (
    <UiDiv className={cn(APP_PAGE_BACKGROUND_CLASS, className)} {...props} />
  );
}

export function AppPageMain({
  className,
  maxWidth = "7xl",
  layout = "default",
  ...props
}: AppPageMainProps) {
  return (
    <UiMain
      className={cn(
        APP_PAGE_MAIN_BASE_CLASS,
        APP_PAGE_MAX_WIDTH_CLASS[maxWidth],
        layout === "stack-4" ? "space-y-4" : "",
        layout === "grid-4" ? "grid gap-4" : "",
        className,
      )}
      {...props}
    />
  );
}

export function AppPageShell({
  children,
  maxWidth = "7xl",
  className,
  contentClassName,
}: AppPageShellProps) {
  return (
    <AppPageBackground className={className}>
      <AppPageMain maxWidth={maxWidth} className={contentClassName}>
        {children}
      </AppPageMain>
    </AppPageBackground>
  );
}

export function PageViewport({ className, ...props }: PageViewportProps) {
  return <UiMain className={cn("min-h-screen", className)} {...props} />;
}

export function CompactPageViewport({
  className,
  ...props
}: CompactPageViewportProps) {
  return (
    <UiMain
      className={cn("mx-auto min-h-screen w-full max-w-3xl p-4", className)}
      {...props}
    />
  );
}

export function AuthCardPageShell({
  children,
  className,
  contentClassName,
}: AuthCardPageShellProps) {
  return (
    <AuthCardPageMain className={className}>
      <AuthCardPageContent className={contentClassName}>
        {children}
      </AuthCardPageContent>
    </AuthCardPageMain>
  );
}

export function AuthCardPageMain({
  className,
  ...props
}: AuthCardPageMainProps) {
  return (
    <UiMain className={cn(AUTH_CARD_PAGE_MAIN_CLASS, className)} {...props} />
  );
}

export function AuthRadialPageMain({
  className,
  ...props
}: AuthRadialPageMainProps) {
  return (
    <UiMain className={cn(AUTH_RADIAL_PAGE_MAIN_CLASS, className)} {...props} />
  );
}

export function AuthCardPageContent({
  className,
  ...props
}: AuthCardPageContentProps) {
  return (
    <UiDiv className={cn("mx-auto w-full max-w-md", className)} {...props} />
  );
}
