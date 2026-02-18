import { Card, CardContent } from "@/components/ui/card";

type PageLoadingStateProps = {
  label: string;
  className?: string;
  density?: "default" | "section" | "compact";
};

export function PageLoadingState({
  label,
  className = "",
  density = "default",
}: PageLoadingStateProps) {
  return (
    <Card>
      <CardContent
        className={`text-muted-foreground ${
          density === "default"
            ? "py-8 text-sm"
            : density === "section"
              ? "py-6 text-sm"
              : "py-3 text-xs"
        } ${className}`.trim()}
      >
        {label}
      </CardContent>
    </Card>
  );
}
