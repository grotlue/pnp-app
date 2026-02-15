import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Campaign } from "../types";

type CampaignCardProps = {
  campaign: Campaign;
  ownerLabel: string;
  roleLabel: string;
  editLabel: string;
  deleteLabel: string;
  isOwner: boolean;
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
  onEdit,
  onDelete,
}: CampaignCardProps) {
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[1fr_auto]">
      <Link href={`/campaigns/${campaign.id}`}>
        <div className="font-medium">{campaign.title}</div>
        <div className="text-xs text-muted-foreground">{campaign.description || "-"}</div>
        <div className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-[10px] uppercase">
          {isOwner ? ownerLabel : roleLabel}
        </div>
      </Link>
      {isOwner ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            {editLabel}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            {deleteLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
