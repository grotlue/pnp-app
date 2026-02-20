import { StatusBadge } from "@/components/ui/status-badge";

type Translator = (key: string, fallback?: string) => string;

type CampaignUserRole = "owner" | "player";

type CampaignRoleBadgeProps = {
  role: CampaignUserRole;
  t: Translator;
  withTopSpacing?: boolean;
};

const CampaignRoleBadge = ({
  role,
  t,
  withTopSpacing = false,
}: CampaignRoleBadgeProps) => {
  return (
    <StatusBadge
      label={t(`ui.labels.campaignRole.${role}`)}
      tone={role === "owner" ? "green" : "violet"}
      withTopSpacing={withTopSpacing}
    />
  );
};

export { CampaignRoleBadge as default, CampaignRoleBadge };
export type { CampaignUserRole };
