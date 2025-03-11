declare module "@radix-ui/react-progress" {
  import * as React from "react";

  interface ProgressProps extends React.ComponentPropsWithoutRef<"div"> {
    value?: number;
  }

  const Root: React.ForwardRefExoticComponent<ProgressProps>;
  const Indicator: React.ForwardRefExoticComponent<
    React.ComponentPropsWithoutRef<"div">
  >;

  export { Root, Indicator };
}

declare module "@radix-ui/react-slot" {
  import * as React from "react";

  interface SlotProps extends React.ComponentPropsWithoutRef<"div"> {
    children?: React.ReactNode;
  }

  const Slot: React.ForwardRefExoticComponent<SlotProps>;

  export { Slot };
}

declare module "class-variance-authority" {
  export type VariantProps<T extends (...args: any) => any> = {
    [K in keyof Parameters<T>[0]]: Parameters<T>[0][K];
  };

  export function cva(base: string, config?: any): (...args: any[]) => string;
}
