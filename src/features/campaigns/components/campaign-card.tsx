import { Pencil, Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ListItemRow } from "@/components/ui/list-item-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { TitleWithPrivacy } from "@/components/ui/title-with-privacy";
import type { Campaign } from "../types";
import { UiMutedText } from "@/components/ui/html-elements";
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

const CampaignCard = ({
  campaign,
  ownerLabel,
  roleLabel,
  editLabel,
  deleteLabel,
  isOwner,
  canManage,
  onEdit,
  onDelete,
}: CampaignCardProps) => {
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
          weight="medium"
        />
        <UiMutedText size="xs">{campaign.description || "-"}</UiMutedText>
        <StatusBadge
          label={isOwner ? ownerLabel : roleLabel}
          tone={isOwner ? "green" : "violet"}
          withTopSpacing
        />
      </TextLink>
    </ListItemRow>
  );
};

export { CampaignCard as default, CampaignCard };
