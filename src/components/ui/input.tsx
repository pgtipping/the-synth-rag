"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "search" | "chat";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full text-[17px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          {
            "h-[44px] rounded-[22px] px-5 bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7]":
              variant === "default",
            "h-[44px] rounded-[22px] pl-12 pr-5 bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7]":
              variant === "search",
            "h-[44px] rounded-[22px] px-5 bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-[0_1px_3px_rgba(0,0,0,0.1)]":
              variant === "chat",
          },
          "border-none focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#0a84ff]",
          "placeholder:text-[#6e6e73] dark:placeholder:text-[#aeaeb2]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
