import { StatusBadge } from "@/components/ui/status-badge";

type Translator = (key: string, fallback?: string) => string;

export type CampaignUserRole = "owner" | "player";

type CampaignRoleBadgeProps = {
  role: CampaignUserRole;
  t: Translator;
  withTopSpacing?: boolean;
};

export function CampaignRoleBadge({
  role,
  t,
  withTopSpacing = false,
}: CampaignRoleBadgeProps) {
  return (
    <StatusBadge
      label={t(`ui.labels.campaignRole.${role}`)}
      tone={role === "owner" ? "green" : "violet"}
      withTopSpacing={withTopSpacing}
    />
  );
}
