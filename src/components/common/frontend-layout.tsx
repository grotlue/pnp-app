import type { ReactNode } from "react";
import { AuthenticatedAppHeader } from "@/components/common/authenticated-app-header";

type FrontendLayoutProps = {
  children: ReactNode;
};

export function FrontendLayout({ children }: FrontendLayoutProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <AuthenticatedAppHeader />
      {children}
    </div>
  );
}
