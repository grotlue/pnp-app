import { Card, CardContent } from "@/components/ui/card";

type PageLoadingStateProps = {
  label: string;
  className?: string;
};

export function PageLoadingState({ label, className = "" }: PageLoadingStateProps) {
  return (
    <Card>
      <CardContent className={`py-8 text-sm text-muted-foreground ${className}`.trim()}>
        {label}
      </CardContent>
    </Card>
  );
}
