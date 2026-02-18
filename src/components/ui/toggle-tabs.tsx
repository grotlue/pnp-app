import { Button } from "@/components/ui/button";

type ToggleTabOption<T extends string> = {
  value: T;
  label: string;
};

type ToggleTabsProps<T extends string> = {
  value: T;
  options: ToggleTabOption<T>[];
  onChange: (value: T) => void;
};

export function ToggleTabs<T extends string>({
  value,
  options,
  onChange,
}: ToggleTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
