import type { ReactNode } from "react";

type FrontendLayoutProps = {
  children: ReactNode;
};

export function FrontendLayout({ children }: FrontendLayoutProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">{children}</div>
  );
}
