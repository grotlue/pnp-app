import type { ReactNode } from "react";
import App from "./app";

type RootTemplateProps = {
  children: ReactNode;
};

export default function RootTemplate({ children }: RootTemplateProps) {
  return <App>{children}</App>;
}
