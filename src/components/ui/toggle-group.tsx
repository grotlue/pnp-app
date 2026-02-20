"use client";

import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";

import { cn } from "@/lib/utils/cn";
import { Toggle, toggleVariants } from "@/components/ui/toggle";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
});

type BaseToggleGroupProps = Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive>,
  "value" | "defaultValue" | "onValueChange" | "multiple"
> & {
  variant?: VariantProps<typeof toggleVariants>["variant"];
  size?: VariantProps<typeof toggleVariants>["size"];
  spacing?: number;
};

type ToggleGroupSingleProps = BaseToggleGroupProps & {
  type?: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type ToggleGroupMultipleProps = BaseToggleGroupProps & {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

const ToggleGroup = ({
  className,
  variant,
  size,
  spacing = 0,
  type = "single",
  children,
  value,
  defaultValue,
  onValueChange,
  ...props
}: ToggleGroupProps) => {
  const primitiveValue =
    value === undefined
      ? undefined
      : type === "single"
        ? [value as string]
        : (value as string[]);
  const primitiveDefaultValue =
    defaultValue === undefined
      ? undefined
      : type === "single"
        ? [defaultValue as string]
        : (defaultValue as string[]);

  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      style={{ "--gap": spacing } as React.CSSProperties}
      multiple={type === "multiple"}
      value={primitiveValue}
      defaultValue={primitiveDefaultValue}
      onValueChange={(nextValues) => {
        if (!onValueChange) {
          return;
        }

        if (type === "multiple") {
          (onValueChange as (value: string[]) => void)(nextValues as string[]);
          return;
        }

        (onValueChange as (value: string) => void)(
          (nextValues[0] as string | undefined) ?? "",
        );
      }}
      className={cn(
        "group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
};

const ToggleGroupItem = ({
  className,
  variant,
  size,
  ...props
}: Omit<React.ComponentProps<typeof Toggle>, "variant" | "size"> &
  VariantProps<typeof toggleVariants>) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <Toggle
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      variant={context.variant || variant}
      size={context.size || size}
      className={cn(
        "w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10",
        "data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
        className,
      )}
      {...props}
    />
  );
};

export { ToggleGroup, ToggleGroupItem };
