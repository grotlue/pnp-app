import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { IconActionButton } from "@/components/common/icon-action-button";
import { ListItemRow } from "@/components/common/list-item-row";
import { TitleWithPrivacy } from "@/components/common/title-with-privacy";
import type { Campaign } from "../types";

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
            <IconActionButton label={editLabel} icon={Pencil} onClick={onEdit} />
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
      <Link href={`/campaigns/${campaign.id}`}>
        <TitleWithPrivacy
          title={campaign.title}
          isPrivate={campaign.is_private}
          className="font-medium"
        />
        <div className="text-xs text-muted-foreground">{campaign.description || "-"}</div>
        <div className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-[10px] uppercase">
          {isOwner ? ownerLabel : roleLabel}
        </div>
      </Link>
    </ListItemRow>
  );
}
