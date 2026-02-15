import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  previousLabel,
  nextLabel,
  pageLabel,
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems <= pageSize) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
      <div>
        {pageLabel}: {safePage} / {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          {previousLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
