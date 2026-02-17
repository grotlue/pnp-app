import { FormInput, FormSelect } from "@/components/common/form-controls";
import { Button } from "@/components/ui/button";

type ListControlOption = {
  value: string;
  label: string;
};

type ListControlsProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortLabel: string;
  sortOptions: ListControlOption[];
  filterLabel?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: ListControlOption[];
};

export function ListControls({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  sortValue,
  onSortChange,
  sortLabel,
  sortOptions,
  filterLabel,
  filterValue,
  onFilterChange,
  filterOptions = [],
}: ListControlsProps) {
  return (
    <div className="border-border bg-background/70 space-y-3 rounded-lg border p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_220px]">
        <FormInput
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
        <div className="grid gap-1">
          <label className="text-muted-foreground text-xs">{sortLabel}</label>
          <FormSelect
            value={sortValue}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label={sortLabel}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </div>
      </div>

      {filterOptions.length > 0 &&
      filterLabel &&
      filterValue &&
      onFilterChange ? (
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs">{filterLabel}</div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={option.value === filterValue ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
