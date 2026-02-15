import type { CharacterType } from "@/features/characters/types";
import { StatusBadge } from "@/components/common/status-badge";

type Translator = (key: string, fallback?: string) => string;

type CharacterTypeBadgeProps = {
  type: CharacterType;
  t: Translator;
  className?: string;
};

export function CharacterTypeBadge({ type, t, className }: CharacterTypeBadgeProps) {
  return (
    <StatusBadge
      label={t(`ui.labels.characterType.${type}`)}
      tone={type === "player" ? "blue" : "amber"}
      className={className}
    />
  );
}
