import { Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
  iconClassName = "size-3",
  weight = "normal",
}: TitleWithPrivacyProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        weight === "medium" ? "font-medium" : "",
        className,
      )}
    >
      <span>{title}</span>
      {isPrivate ? <Lock className={iconClassName} /> : null}
    </span>
  );
}
