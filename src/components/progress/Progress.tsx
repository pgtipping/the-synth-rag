"use client";

import { useProgressStore } from "@/lib/stores/progress-store";
import { ProgressSteps } from "./ProgressSteps";
import { ProgressMetrics } from "./ProgressMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

export function Progress() {
  const { currentSession, reset } = useProgressStore();

  if (!currentSession) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full max-w-md transform transition-transform duration-200 ease-in-out">
      <Card className="m-4 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Progress</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            className="h-8 w-8 rounded-full p-0"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close progress panel</span>
          </Button>
        </CardHeader>
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
      </Card>
    </div>
  );
}
