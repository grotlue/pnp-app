import { StatusBadge } from "@/components/common/status-badge";

type Translator = (key: string, fallback?: string) => string;

export type CampaignUserRole = "owner" | "player";

type CampaignRoleBadgeProps = {
  role: CampaignUserRole;
  t: Translator;
  className?: string;
};

export function CampaignRoleBadge({
  role,
  t,
  className,
}: CampaignRoleBadgeProps) {
  return (
    <StatusBadge
      label={t(`ui.labels.campaignRole.${role}`)}
      tone={role === "owner" ? "green" : "violet"}
      className={className}
    />
  );
}
