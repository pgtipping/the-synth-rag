import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-light-accent dark:bg-dark-accent text-white hover:opacity-90 active:scale-[0.98]",
        destructive:
          "bg-light-destructive dark:bg-dark-destructive text-white hover:opacity-90",
        outline:
          "border border-light-text-secondary dark:border-dark-text-secondary bg-transparent hover:bg-light-text-secondary/10 dark:hover:bg-dark-text-secondary/10",
        secondary:
          "bg-light-text-secondary/10 dark:bg-dark-text-secondary/10 text-light-text-primary dark:text-dark-text-primary hover:bg-light-text-secondary/20 dark:hover:bg-dark-text-secondary/20",
        ghost:
          "hover:bg-light-text-secondary/10 dark:hover:bg-dark-text-secondary/10",
        link: "text-light-accent dark:text-dark-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
