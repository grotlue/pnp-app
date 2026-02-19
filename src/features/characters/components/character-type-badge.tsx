import type { CharacterType } from "@/features/characters/types";
import { StatusBadge } from "@/components/ui/status-badge";

type Translator = (key: string, fallback?: string) => string;

type CharacterTypeBadgeProps = {
  type: CharacterType;
  t: Translator;
  withTopSpacing?: boolean;
};

export function CharacterTypeBadge({
  type,
  t,
  withTopSpacing = false,
}: CharacterTypeBadgeProps) {
  return (
    <StatusBadge
      label={t(`ui.labels.characterType.${type}`)}
      tone={type === "player" ? "blue" : "amber"}
      withTopSpacing={withTopSpacing}
    />
  );
}
