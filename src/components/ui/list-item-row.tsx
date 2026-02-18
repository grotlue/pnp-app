import type { ReactNode } from "react";

type ListItemRowProps = {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  dimmed?: boolean;
};

export function ListItemRow({
  children,
  actions,
  className,
  dimmed: _dimmed = false,
}: ListItemRowProps) {
  void _dimmed;
  return (
    <div className={className}>
      {children}
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
