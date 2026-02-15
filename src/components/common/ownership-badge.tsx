import { StatusBadge } from "@/components/common/status-badge";

type Translator = (key: string, fallback?: string) => string;

type OwnershipBadgeMode = "mine" | "others";

type OwnershipBadgeProps = {
  mode: OwnershipBadgeMode;
  t: Translator;
  className?: string;
};

export function OwnershipBadge({ mode, t, className }: OwnershipBadgeProps) {
  return (
    <StatusBadge
      label={t(`ui.labels.ownership.${mode}`)}
      tone={mode === "mine" ? "teal" : "slate"}
      className={className}
    />
  );
}
