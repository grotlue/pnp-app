import type { ReactNode } from "react";

type FrontendLayoutProps = {
  children: ReactNode;
};

export function FrontendLayout({ children }: FrontendLayoutProps) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
