type VisibilityToggleProps = {
  isPrivate: boolean;
  label: string;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
};

export function VisibilityToggle({
  isPrivate,
  label,
  onLabel,
  offLabel,
  onToggle,
}: VisibilityToggleProps) {
  return (
    <button
      type="button"
      className={`rounded-md border px-3 py-2 text-left text-sm ${
        isPrivate
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background"
      }`}
      onClick={onToggle}
    >
      {label}: {isPrivate ? onLabel : offLabel}
    </button>
  );
}
