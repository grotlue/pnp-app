import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ToggleTabOption<T extends string> = {
  value: T;
  label: string;
};

type ToggleTabsProps<T extends string> = {
  value: T;
  options: ToggleTabOption<T>[];
  onChange: (value: T) => void;
};

const ToggleTabs = <T extends string>({
  value,
  options,
  onChange,
}: ToggleTabsProps<T>) => {
  const handleValueChange = (nextValue: string) => {
    onChange(nextValue as T);
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <TabsList variant="line">
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export { ToggleTabs as default, ToggleTabs };
