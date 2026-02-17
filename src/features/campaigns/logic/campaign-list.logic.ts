import type { Campaign } from "@/features/campaigns/types";
import { normalizeListQuery } from "@/lib/utils/list";

export type CampaignListSort = "updated_desc" | "created_desc" | "name_asc";

function toTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortCampaigns(
  items: Campaign[],
  sort: CampaignListSort,
): Campaign[] {
  const copy = [...items];
  copy.sort((left, right) => {
    if (sort === "name_asc") {
      return left.title.localeCompare(right.title, undefined, {
        sensitivity: "base",
      });
    }

    const leftTimestamp =
      sort === "updated_desc"
        ? toTimestamp(left.updated_at)
        : toTimestamp(left.created_at);
    const rightTimestamp =
      sort === "updated_desc"
        ? toTimestamp(right.updated_at)
        : toTimestamp(right.created_at);
    return rightTimestamp - leftTimestamp;
  });
  return copy;
}

export function searchCampaigns(items: Campaign[], query: string): Campaign[] {
  const normalizedQuery = normalizeListQuery(query);
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((campaign) => {
    const haystack = normalizeListQuery(
      `${campaign.title} ${campaign.description ?? ""} ${campaign.owner_username ?? ""}`,
    );
    return haystack.includes(normalizedQuery);
  });
}
