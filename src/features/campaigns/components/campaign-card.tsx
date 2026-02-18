import { Pencil, Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/common/icon-action-button";
import { ListItemRow } from "@/components/common/list-item-row";
import { StatusBadge } from "@/components/common/status-badge";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import type { Campaign } from "../types";
import { UiDiv } from "@/components/ui/html-elements";
import { TextLink } from "@/components/ui/text-link";

type CampaignCardProps = {
  campaign: Campaign;
  ownerLabel: string;
  roleLabel: string;
  editLabel: string;
  deleteLabel: string;
  isOwner: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function CampaignCard({
  campaign,
  ownerLabel,
  roleLabel,
  editLabel,
  deleteLabel,
  isOwner,
  canManage,
  onEdit,
  onDelete,
}: CampaignCardProps) {
  return (
    <ListItemRow
      actions={
        canManage ? (
          <>
            <IconActionButton
              label={editLabel}
              icon={Pencil}
              onClick={onEdit}
            />
            <IconActionButton
              label={deleteLabel}
              icon={Trash2}
              variant="destructive"
              onClick={onDelete}
            />
          </>
        ) : null
      }
    >
      <TextLink href={`/campaigns/${campaign.id}`}>
        <TitleWithPrivacy
          title={campaign.title}
          isPrivate={campaign.is_private}
          className="font-medium"
        />
        <UiDiv className="text-muted-foreground text-xs">
          {campaign.description || "-"}
        </UiDiv>
        <StatusBadge
          label={isOwner ? ownerLabel : roleLabel}
          tone={isOwner ? "green" : "violet"}
          className="mt-1"
        />
      </TextLink>
    </ListItemRow>
  );
}
