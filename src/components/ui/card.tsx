import * as React from "react";

import { cn } from "@/lib/utils/cn";

type CardContentProps = React.ComponentProps<"div"> & {
  stack?: number;
  textStyle?: string;
  paddingTop?: number;
  paddingY?: number;
  paddingX?: number;
};

type CardFooterProps = React.ComponentProps<"div"> & {
  layout?: string;
};

const Card = ({ className, ...props }: React.ComponentProps<"div">) => {
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
};

const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => {
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
};

const CardTitle = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
};

const CardDescription = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
};

const CardAction = ({ className, ...props }: React.ComponentProps<"div">) => {
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
};

const CardContent = ({
  className,
  stack: _stack,
  textStyle: _textStyle,
  paddingTop: _paddingTop,
  paddingY: _paddingY,
  paddingX: _paddingX,
  ...props
}: CardContentProps) => {
  void _stack;
  void _textStyle;
  void _paddingTop;
  void _paddingY;
  void _paddingX;
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
};

const CardFooter = ({
  className,
  layout: _layout,
  ...props
}: CardFooterProps) => {
  void _layout;
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
};

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
