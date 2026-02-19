import { Lock } from "lucide-react";

type TitleWithPrivacyProps = {
  title: string;
  isPrivate?: boolean;
  className?: string;
  iconClassName?: string;
  weight?: "normal" | "medium";
};

export function TitleWithPrivacy({
  title,
  isPrivate = false,
  className,
  iconClassName,
  weight: _weight = "normal",
}: TitleWithPrivacyProps) {
  void _weight;
  return (
    <span className={className}>
      <span>{title}</span>
      {isPrivate ? <Lock className={iconClassName} /> : null}
    </span>
  );
}
