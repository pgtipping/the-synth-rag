"use client";

import { useProgressStore } from "../../lib/stores/progress-store";
import { Progress } from "../ui/progress";
import { CheckIcon, XIcon, AlertTriangleIcon } from "lucide-react";
import type { ProgressStep } from "../../types/progress";

export function ProgressSteps() {
  const { currentSession } = useProgressStore();

  if (!currentSession) {
    return null;
  }

  const { steps } = currentSession;

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XIcon className="h-5 w-5 text-red-500" />;
      case "paused":
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300">
            {step.status === "active" && (
              <div className="h-full w-full animate-pulse rounded-full bg-blue-500" />
            )}
          </div>
        );
    }
  };

  const getStepStatus = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "paused":
        return "warning";
      case "active":
        return "default";
      default:
        return undefined;
    }
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="space-y-2">
          <div className="flex items-center space-x-3">
            {getStepIcon(step)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{step.stepName}</h4>
                <span className="text-sm text-gray-500">
                  {step.completionPercentage}%
                </span>
              </div>
              <Progress
                value={step.completionPercentage}
                className="mt-2"
                size="sm"
                status={getStepStatus(step)}
              />
            </div>
          </div>

          {/* Step Details */}
          {step.status === "active" && step.metadata && (
            <div className="ml-8 mt-2 text-sm text-gray-500">
              {typeof step.metadata === "object" &&
                "message" in step.metadata && (
                  <p>{step.metadata.message as string}</p>
                )}
            </div>
          )}

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="ml-2.5 h-6 w-px bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
}
