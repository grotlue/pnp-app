import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

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
    <div>
      <div>
        {pageLabel}: {safePage} / {totalPages}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <ButtonGroup>
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
            </ButtonGroup>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
