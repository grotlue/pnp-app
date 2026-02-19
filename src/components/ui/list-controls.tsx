import { SearchIcon } from "lucide-react";
import { FormSelect } from "@/components/ui/form-controls";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
    <div>
      <div>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </InputGroup>
        <div>
          <label>{sortLabel}</label>
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
        <div>
          <div>{filterLabel}</div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filterValue}
            onValueChange={(value) => {
              if (value) {
                onFilterChange(value);
              }
            }}
          >
            {filterOptions.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
    </div>
  );
}
