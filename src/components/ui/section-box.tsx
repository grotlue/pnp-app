import type { ReactNode } from "react";

type SectionBoxProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  stack?: 1 | 2 | 3 | 4;
  textStyle?: "sm";
};

export function SectionBox({
  title,
  children,
  className,
  titleClassName,
  stack: _stack,
  textStyle: _textStyle,
}: SectionBoxProps) {
  void _stack;
  void _textStyle;
  return (
    <div className={className}>
      {title ? <div className={titleClassName}>{title}</div> : null}
      {children}
    </div>
  );
}
