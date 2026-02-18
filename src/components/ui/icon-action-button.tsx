import Link from "next/link";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

type IconActionButtonProps = {
  label: string;
  icon: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  dataTestId?: string;
  disabled?: boolean;
  onClick?: () => void;
};

type IconActionLinkButtonProps = {
  label: string;
  icon: LucideIcon;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  badgeCount?: number;
};

export function IconActionButton({
  label,
  icon: Icon,
  variant = "outline",
  size = "icon-sm",
  dataTestId,
  disabled,
  onClick,
}: IconActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      data-testid={dataTestId}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon />
      <span>{label}</span>
    </Button>
  );
}

export function IconActionLinkButton({
  label,
  icon: Icon,
  href,
  variant = "outline",
  size = "icon-sm",
  badgeCount = 0,
}: IconActionLinkButtonProps) {
  const showBadge = badgeCount > 0;
  const badgeLabel = badgeCount > 99 ? "99+" : String(badgeCount);

  return (
    <Button asChild variant={variant} size={size} title={label}>
      <Link href={href} aria-label={label}>
        <Icon />
        {showBadge ? <span>{badgeLabel}</span> : null}
        <span>{label}</span>
      </Link>
    </Button>
  );
}
