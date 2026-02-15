import { CampaignCard } from "./campaign-card";
import type { Campaign } from "../types";

type CampaignsListProps = {
  campaigns: Campaign[];
  currentUserId?: string;
  ownerLabel: string;
  playerLabel: string;
  editLabel: string;
  deleteLabel: string;
  emptyLabel: string;
  isOwner: (campaign: Campaign, userId?: string) => boolean;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
};

export function CampaignsList({
  campaigns,
  currentUserId,
  ownerLabel,
  playerLabel,
  editLabel,
  deleteLabel,
  emptyLabel,
  isOwner,
  onEdit,
  onDelete,
}: CampaignsListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background/70 p-3 text-xs text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          ownerLabel={ownerLabel}
          roleLabel={playerLabel}
          editLabel={editLabel}
          deleteLabel={deleteLabel}
          isOwner={isOwner(campaign, currentUserId)}
          onEdit={() => onEdit(campaign)}
          onDelete={() => onDelete(campaign)}
        />
      ))}
    </div>
  );
}
