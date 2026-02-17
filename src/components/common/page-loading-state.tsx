import { Card, CardContent } from "@/components/ui/card";

type PageLoadingStateProps = {
  label: string;
  className?: string;
};

export function PageLoadingState({
  label,
  className = "",
}: PageLoadingStateProps) {
  return (
    <Card>
      <CardContent
        className={`text-muted-foreground py-8 text-sm ${className}`.trim()}
      >
        {label}
      </CardContent>
    </Card>
  );
}
