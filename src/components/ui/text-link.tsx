import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type TextLinkDisplay = "inline" | "block" | "inline-flex";
type TextLinkSize = "default" | "xs";

type TextLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    display?: TextLinkDisplay;
    size?: TextLinkSize;
  };

const TextLink = ({
  className,
  display: _display,
  size: _size,
  children,
  ...props
}: TextLinkProps) => {
  void _display;
  void _size;
  return (
    <Link {...props} className={className}>
      {children}
    </Link>
  );
};

export { TextLink as default, TextLink };
