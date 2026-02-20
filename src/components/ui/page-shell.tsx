import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { UiDiv, UiMain } from "@/components/ui/html-elements";

type AppPageMaxWidth = "md" | "4xl" | "5xl" | "7xl";

type AppPageShellProps = {
  children: ReactNode;
  maxWidth?: AppPageMaxWidth;
  className?: string;
  contentClassName?: string;
};

type PageViewportProps = ComponentPropsWithoutRef<"main">;

type AppPageMainProps = ComponentPropsWithoutRef<"main"> & {
  maxWidth?: AppPageMaxWidth;
  layout?: "default" | "stack-4" | "grid-4";
  viewportClassName?: string;
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

const AppPageMain = ({
  children,
  className,
  viewportClassName,
  maxWidth: _maxWidth = "7xl",
  layout: _layout = "default",
  ...props
}: AppPageMainProps) => {
  void _maxWidth;
  void _layout;
  return (
    <UiMain className={viewportClassName} {...props}>
      <UiDiv className={className}>{children}</UiDiv>
    </UiMain>
  );
};

const AppPageShell = ({
  children,
  maxWidth = "7xl",
  className,
  contentClassName,
}: AppPageShellProps) => {
  return (
    <AppPageMain
      maxWidth={maxWidth}
      viewportClassName={className}
      className={contentClassName}
    >
      {children}
    </AppPageMain>
  );
};

const PageViewport = ({ className, ...props }: PageViewportProps) => {
  return <UiMain className={className} {...props} />;
};

const CompactPageViewport = ({
  className,
  ...props
}: CompactPageViewportProps) => {
  return <UiMain className={className} {...props} />;
};

const AuthCardPageShell = ({
  children,
  className,
  contentClassName,
}: AuthCardPageShellProps) => {
  return (
    <AuthCardPageMain className={className}>
      <AuthCardPageContent className={contentClassName}>
        {children}
      </AuthCardPageContent>
    </AuthCardPageMain>
  );
};

const AuthCardPageMain = ({ className, ...props }: AuthCardPageMainProps) => {
  return <UiMain className={className} {...props} />;
};

const AuthRadialPageMain = ({
  className,
  ...props
}: AuthRadialPageMainProps) => {
  return <UiMain className={className} {...props} />;
};

const AuthCardPageContent = ({
  className,
  ...props
}: AuthCardPageContentProps) => {
  return <UiDiv className={className} {...props} />;
};

export {
  AppPageMain,
  AppPageShell,
  AuthCardPageContent,
  AuthCardPageMain,
  AuthCardPageShell,
  AuthRadialPageMain,
  CompactPageViewport,
  PageViewport,
};
