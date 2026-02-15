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
  disabled,
  onClick,
}: IconActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon />
      <span className="sr-only">{label}</span>
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
    <Button asChild variant={variant} size={size} title={label} className="relative">
      <Link href={href} aria-label={label}>
        <Icon />
        {showBadge ? (
          <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full border border-background bg-destructive px-1.5 text-[10px] font-semibold leading-none text-white">
            {badgeLabel}
          </span>
        ) : null}
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
}
