"use client";

import { useProgressStore } from "@/lib/stores/progress-store";
import { ProgressSteps } from "./ProgressSteps";
import { ProgressMetrics } from "./ProgressMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XIcon, AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export function Progress() {
  const { currentSession, error, reset } = useProgressStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!currentSession && !error) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full max-w-md transform transition-transform duration-200 ease-in-out">
      {error && (
        <Alert variant="destructive" className="m-4 shadow-lg">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="mr-2"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {currentSession && (
        <Card className="m-4 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Progress</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 rounded-full p-0"
              >
                {isMinimized ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-up"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-down"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                <span className="sr-only">
                  {isMinimized ? "Expand" : "Minimize"} progress panel
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                className="h-8 w-8 rounded-full p-0"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close progress panel</span>
              </Button>
            </div>
          </CardHeader>
          {!isMinimized && (
            <CardContent>
              <div className="space-y-6">
                {/* Progress Steps */}
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-4 text-sm font-medium">Current Progress</h3>
                  <ProgressSteps />
                </div>

                {/* Progress Metrics */}
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-4 text-sm font-medium">Metrics</h3>
                  <ProgressMetrics />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
