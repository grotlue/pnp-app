"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

type AspectRatioProps = React.ComponentProps<"div"> & {
  ratio?: number;
};

const AspectRatio = ({
  ratio = 1,
  className,
  style,
  children,
  ...props
}: AspectRatioProps) => {
  const safeRatio = ratio > 0 ? ratio : 1;

  return (
    <div
      data-slot="aspect-ratio"
      className="relative w-full"
      style={{ paddingBottom: `${100 / safeRatio}%` }}
      {...props}
    >
      <div className={cn("absolute inset-0", className)} style={style}>
        {children}
      </div>
    </div>
  );
};

export { AspectRatio as default, AspectRatio };
