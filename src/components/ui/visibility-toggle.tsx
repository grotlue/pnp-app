import { Switch } from "@/components/ui/switch";

type VisibilityToggleProps = {
  isPrivate: boolean;
  label: string;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
};

const VisibilityToggle = ({
  isPrivate,
  label,
  onLabel,
  offLabel,
  onToggle,
}: VisibilityToggleProps) => {
  return (
    <div>
      <span>
        {label}: {isPrivate ? onLabel : offLabel}
      </span>
      <Switch
        checked={isPrivate}
        aria-label={`${label}: ${isPrivate ? onLabel : offLabel}`}
        onCheckedChange={() => onToggle()}
      />
    </div>
  );
};

export { VisibilityToggle as default, VisibilityToggle };
