import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type TextLinkDisplay = "inline" | "block" | "inline-flex";
type TextLinkSize = "default" | "xs";

type TextLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    display?: TextLinkDisplay;
    size?: TextLinkSize;
  };

const textLinkBaseClassName = "";
const textLinkDisplayClassName: Record<TextLinkDisplay, string> = {
  inline: "inline",
  block: "block",
  "inline-flex": "inline-flex items-center gap-1",
};

const textLinkSizeClassName: Record<TextLinkSize, string> = {
  default: "",
  xs: "text-xs",
};

export function TextLink({
  className,
  display = "inline",
  size = "default",
  children,
  ...props
}: TextLinkProps) {
  return (
    <Button
      asChild
      variant="link"
      size="link"
      className={cn(
        textLinkBaseClassName,
        textLinkDisplayClassName[display],
        textLinkSizeClassName[size],
        className,
      )}
    >
      <Link {...props}>{children}</Link>
    </Button>
  );
}
