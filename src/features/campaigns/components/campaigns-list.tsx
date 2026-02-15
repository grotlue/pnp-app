import { EmptyState } from "@/components/common/empty-state";
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
  canManage: (campaign: Campaign, userId?: string) => boolean;
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
  canManage,
  onEdit,
  onDelete,
}: CampaignsListProps) {
  if (campaigns.length === 0) {
    return <EmptyState label={emptyLabel} />;
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
          canManage={canManage(campaign, currentUserId)}
          onEdit={() => onEdit(campaign)}
          onDelete={() => onDelete(campaign)}
        />
      ))}
    </div>
  );
}
