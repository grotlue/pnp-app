import type { ComponentPropsWithoutRef } from "react";

type RootBodyProps = Omit<ComponentPropsWithoutRef<"body">, "className"> & {
  fontVariables: [string, string] | string[];
};

const ROOT_BODY_CLASSNAME = "antialiased";

export function RootBody({ fontVariables, ...props }: RootBodyProps) {
  const className = [...fontVariables, ROOT_BODY_CLASSNAME].join(" ");
  return <body className={className} {...props} />;
}
