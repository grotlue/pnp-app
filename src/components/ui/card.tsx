import * as React from "react";

import { cn } from "@/lib/utils/cn";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

type CardContentProps = React.ComponentProps<"div"> & {
  stack?: 2 | 3 | 4;
  textStyle?: "sm" | "muted-sm";
  paddingY?: 8;
  paddingTop?: 6;
};

function CardContent({
  className,
  stack,
  textStyle,
  paddingY,
  paddingTop,
  ...props
}: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-6",
        stack === 2 ? "space-y-2" : "",
        stack === 3 ? "space-y-3" : "",
        stack === 4 ? "space-y-4" : "",
        textStyle === "sm" ? "text-sm" : "",
        textStyle === "muted-sm" ? "text-muted-foreground text-sm" : "",
        paddingY === 8 ? "py-8" : "",
        paddingTop === 6 ? "pt-6" : "",
        className,
      )}
      {...props}
    />
  );
}

type CardFooterProps = React.ComponentProps<"div"> & {
  layout?: "default" | "column-stretch";
};

function CardFooter({
  className,
  layout = "default",
  ...props
}: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-6 [.border-t]:pt-6",
        layout === "column-stretch" ? "flex-col items-stretch gap-2" : "",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
