import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type TextLinkDisplay = "inline" | "block" | "inline-flex";
type TextLinkSize = "default" | "xs";

type TextLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    display?: TextLinkDisplay;
    size?: TextLinkSize;
  };

const textLinkBaseClassName =
  "text-sky-700 underline-offset-2 decoration-sky-600 hover:text-sky-800 hover:underline";

const textLinkDisplayClassName: Record<TextLinkDisplay, string> = {
  inline: "",
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
    <Link
      className={cn(
        textLinkBaseClassName,
        textLinkDisplayClassName[display],
        textLinkSizeClassName[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
