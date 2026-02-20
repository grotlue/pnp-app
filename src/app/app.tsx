import type { ReactNode } from "react";
import FrontendLayout from "@/components/common/frontend-layout";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

type AppProps = {
  children: ReactNode;
};

const App = ({ children }: AppProps) => {
  return (
    <AppProviders>
      <AppRouter>
        <FrontendLayout>{children}</FrontendLayout>
      </AppRouter>
    </AppProviders>
  );
};

export default App;
