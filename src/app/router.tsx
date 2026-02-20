import type { ReactNode } from "react";

const appRoutes = {
  home: "/",
  register: "/register",
  passwordReset: "/password-reset",
  authCallback: "/auth/callback",
  authResetPassword: "/auth/reset-password",
  characters: "/characters",
  campaigns: "/campaigns",
  notifications: "/notifications",
  profile: "/profile",
  settings: "/settings",
  admin: "/admin",
  adminUsers: "/admin/users",
  adminCampaigns: "/admin/campaigns",
  adminCharacters: "/admin/characters",
  adminMfaChallenge: "/admin/mfa-challenge",
  dashboard: "/dashboard",
} as const;

const appNavigationRoutes = [
  { href: appRoutes.characters, key: "ui.menu.characters" },
  { href: appRoutes.campaigns, key: "ui.menu.campaigns" },
] as const;

type AppRouterProps = {
  children: ReactNode;
};

// Next.js file-system routing resolves route matching.
// This component centralizes route metadata and wraps rendered routes.
const AppRouter = ({ children }: AppRouterProps) => {
  return <>{children}</>;
};

export { AppRouter, appNavigationRoutes, appRoutes };
