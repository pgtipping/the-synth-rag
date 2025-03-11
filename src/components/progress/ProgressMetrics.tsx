"use client";

import { useProgressStore } from "@/lib/stores/progress-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import type { ProgressStep } from "@/types/progress";

export function ProgressMetrics() {
  const { currentSession } = useProgressStore();

  if (!currentSession) {
    return null;
  }

  const { session, steps, metrics } = currentSession;

  // Calculate metrics
  const completedSteps = steps.filter(
    (step: ProgressStep) => step.status === "completed"
  ).length;
  const totalSteps = steps.length;
  const completionRate =
    totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const averageStepTime =
    steps
      .filter((step: ProgressStep) => step.startTime && step.endTime)
      .reduce((acc: number, step: ProgressStep) => {
        const duration =
          new Date(step.endTime!).getTime() -
          new Date(step.startTime!).getTime();
        return acc + duration;
      }, 0) / completedSteps || 0;

  const sessionDuration = session.endTime
    ? new Date(session.endTime).getTime() -
      new Date(session.startTime).getTime()
    : new Date().getTime() - new Date(session.startTime).getTime();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Session Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Session Progress
          </CardTitle>
          <div className="h-4 w-4 rounded-full bg-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(session.completionPercentage)}%
          </div>
          <Progress
            value={session.completionPercentage}
            className="mt-2"
            size="sm"
            status={session.status === "completed" ? "success" : "default"}
          />
          <p className="mt-2 text-xs text-gray-500">
            Started {formatDistanceToNow(new Date(session.startTime))} ago
          </p>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Step Completion</CardTitle>
          <div className="h-4 w-4 rounded-full bg-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {completedSteps}/{totalSteps}
          </div>
          <Progress
            value={completionRate}
            className="mt-2"
            size="sm"
            status="success"
          />
          <p className="mt-2 text-xs text-gray-500">
            {Math.round(completionRate)}% completion rate
          </p>
        </CardContent>
      </Card>

      {/* Average Step Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Step Time</CardTitle>
          <div className="h-4 w-4 rounded-full bg-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(averageStepTime / 1000)}s
          </div>
          <p className="mt-2 text-xs text-gray-500">Per completed step</p>
        </CardContent>
      </Card>

      {/* Session Duration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
          <div className="h-4 w-4 rounded-full bg-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(sessionDuration / 1000)}s
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {session.status === "completed" ? "Completed" : "In progress"}
          </p>
        </CardContent>
      </Card>

      {/* Custom Metrics */}
      {metrics.length > 0 && (
        <div className="col-span-full mt-4">
          <h3 className="mb-4 text-lg font-semibold">Custom Metrics</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.metricName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.metricValue}</div>
                  <p className="mt-2 text-xs text-gray-500">
                    Recorded {formatDistanceToNow(new Date(metric.recordedAt))}{" "}
                    ago
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
