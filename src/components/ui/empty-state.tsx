import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";

type EmptyStateProps = {
  label: string;
  className?: string;
  variant?: "default" | "ghost" | "panel";
};

export function EmptyState({
  label,
  className,
  variant: _variant = "default",
}: EmptyStateProps) {
  void _variant;
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyDescription>{label}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
