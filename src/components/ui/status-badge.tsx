import { Badge } from "@/components/ui/badge";

type StatusBadgeTone = "slate" | "blue" | "green" | "amber" | "violet" | "teal";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
  withTopSpacing?: boolean;
};

const StatusBadge = ({
  label,
  tone: _tone = "slate",
  className,
  withTopSpacing: _withTopSpacing = false,
}: StatusBadgeProps) => {
  void _tone;
  void _withTopSpacing;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

export { StatusBadge as default, StatusBadge };
