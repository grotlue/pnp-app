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
}: IconActionLinkButtonProps) {
  return (
    <Button asChild variant={variant} size={size} title={label}>
      <Link href={href} aria-label={label}>
        <Icon />
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
}
