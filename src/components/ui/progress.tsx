"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  className?: string;
  value?: number;
  max?: number;
  indicatorClassName?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  status?: "default" | "success" | "error" | "warning";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      indicatorClassName,
      showValue = false,
      size = "md",
      status = "default",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const roundedPercentage = Math.round(percentage);

    const sizeClasses = {
      sm: "h-2",
      md: "h-4",
      lg: "h-6",
    };

    const statusClasses = {
      default: "bg-primary",
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={String(roundedPercentage)}
        aria-valuetext={`${roundedPercentage} percent`}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-primary/20",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-200 ease-in-out",
            statusClasses[status],
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">{roundedPercentage}%</span>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
