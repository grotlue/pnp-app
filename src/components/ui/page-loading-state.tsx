import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

type PageLoadingStateProps = {
  label: string;
  className?: string;
  density?: "default" | "section" | "compact";
};

const PageLoadingState = ({
  label,
  className = "",
  density = "default",
}: PageLoadingStateProps) => {
  const skeletonRows =
    density === "default" ? [1, 2, 3] : density === "section" ? [1, 2] : [1];

  return (
    <Card>
      <CardContent className={className}>
        <Empty>
          <EmptyHeader>
            <Spinner />
            <EmptyDescription>{label}</EmptyDescription>
          </EmptyHeader>
          <div>
            {skeletonRows.map((row) => (
              <Skeleton key={row} />
            ))}
          </div>
        </Empty>
      </CardContent>
    </Card>
  );
};

export { PageLoadingState as default, PageLoadingState };
