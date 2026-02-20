import type { ReactNode } from "react";
import AuthenticatedAppHeader from "@/components/common/authenticated-app-header";
import { UiDiv } from "@/components/ui/html-elements";

type FrontendLayoutProps = {
  children: ReactNode;
};

const FrontendLayout = ({ children }: FrontendLayoutProps) => {
  return (
    <UiDiv className="bg-background text-foreground min-h-screen">
      <AuthenticatedAppHeader />
      {children}
    </UiDiv>
  );
};

export default FrontendLayout;
