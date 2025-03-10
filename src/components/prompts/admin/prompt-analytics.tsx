"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { ExamplePrompt } from "@/src/lib/types/prompts";

interface PromptAnalyticsData {
  totalUsage: number;
  promptUsage: {
    prompt: ExamplePrompt;
    usageCount: number;
    averageRating: number | null;
  }[];
  usageByDay: {
    date: string;
    count: number;
  }[];
  usageByUseCase: {
    useCase: string;
    count: number;
  }[];
}

export function PromptAnalytics() {
  const [analyticsData, setAnalyticsData] =
    useState<PromptAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("7days");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/prompts/analytics?timeRange=${timeRange}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch analytics data");
        }
        setAnalyticsData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Error: {error}</div>;
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8 text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by time period" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Usage</CardTitle>
            <CardDescription>Total prompt usage</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="text-4xl font-bold">{analyticsData.totalUsage}</div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Most Popular Use Case</CardTitle>
            <CardDescription>Use case with highest usage</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            {analyticsData.usageByUseCase.length > 0 ? (
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.usageByUseCase[0].useCase}
                </div>
                <div className="text-sm text-muted-foreground">
                  {analyticsData.usageByUseCase[0].count} uses
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Prompt</CardTitle>
            <CardDescription>Most used prompt</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            {analyticsData.promptUsage.length > 0 ? (
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.promptUsage[0].prompt.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {analyticsData.promptUsage[0].usageCount} uses
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prompt Usage by Prompt</CardTitle>
          <CardDescription>Usage statistics for each prompt</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Avg. Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData.promptUsage.map((item) => (
                <TableRow key={item.prompt.id}>
                  <TableCell className="font-medium">
                    {item.prompt.title}
                  </TableCell>
                  <TableCell>{item.prompt.use_case}</TableCell>
                  <TableCell>{item.usageCount}</TableCell>
                  <TableCell>
                    {item.averageRating !== null
                      ? item.averageRating.toFixed(1)
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage by Use Case</CardTitle>
          <CardDescription>
            Distribution of prompt usage by use case
          </CardDescription>
        </CardHeader>
        <div className="p-6 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Use Case</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData.usageByUseCase.map((item) => (
                <TableRow key={item.useCase}>
                  <TableCell className="font-medium">{item.useCase}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>
                    {((item.count / analyticsData.totalUsage) * 100).toFixed(1)}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
