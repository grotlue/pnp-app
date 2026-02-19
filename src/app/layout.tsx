import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { VercelToolbar } from "@vercel/toolbar/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { resolveSpeedInsightsEnabled } from "@/lib/features/performance-observability";
import { resolveVercelToolbarEnabled } from "@/lib/features/vercel-toolbar";
import { getTranslator } from "@/lib/i18n/index";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { getRootBodyProps } from "@/lib/ui/root-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = getTranslator(locale);

  return {
    title: t("app.title"),
    description: t("app.description"),
  };
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getRequestLocale();
  const enableToolbar = resolveVercelToolbarEnabled();
  const enableSpeedInsights = resolveSpeedInsightsEnabled();
  const bodyProps = getRootBodyProps({
    sansVariable: geistSans.variable,
    monoVariable: geistMono.variable,
  });

  return (
    <html lang={locale}>
      <body {...bodyProps}>
        {children}
        {enableToolbar ? <VercelToolbar /> : null}
        {enableSpeedInsights ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
