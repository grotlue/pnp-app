import { cn } from "@/lib/utils/cn";

type FeedbackMessageProps = {
  message?: string;
  className?: string;
};

export function FeedbackMessage({ message, className }: FeedbackMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={cn("rounded-md border border-border bg-background p-2 text-xs", className)}>
      {message}
    </div>
  );
}
