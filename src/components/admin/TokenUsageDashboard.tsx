"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DatePicker } from "@/src/components/ui/date-picker";
import { Button } from "@/src/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";

interface TokenUsageData {
  date?: string;
  model?: string;
  feature?: string;
  user_id?: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  request_count: number;
}

interface TokenUsageSummary {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
  total_requests: number;
  model_count: number;
  feature_count: number;
  user_count: number;
}

interface TokenUsageResponse {
  success: boolean;
  data: {
    usageData: TokenUsageData[];
    summaryMetrics: TokenUsageSummary;
    params: {
      startDate: string;
      endDate: string;
      model?: string;
      feature?: string;
      userId?: string;
      groupBy: "day" | "model" | "feature" | "user";
    };
  };
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
];

export default function TokenUsageDashboard() {
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [groupBy, setGroupBy] = useState<"day" | "model" | "feature" | "user">(
    "day"
  );
  const [model, setModel] = useState<string | undefined>(undefined);
  const [feature, setFeature] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TokenUsageResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate.toISOString().split("T")[0]);
      params.append("endDate", endDate.toISOString().split("T")[0]);
      params.append("groupBy", groupBy);

      if (model) params.append("model", model);
      if (feature) params.append("feature", feature);
      if (userId) params.append("userId", userId);

      const response = await fetch(
        `/api/admin/token-usage?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Error fetching token usage data: ${response.statusText}`
        );
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching token usage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading token usage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <h3 className="text-lg font-medium">Error loading token usage data</h3>
        <p>{error}</p>
        <Button onClick={fetchData} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  const summary = data?.data.summaryMetrics;
  const usageData = data?.data.usageData || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
          <CardDescription>Customize the token usage data view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex space-x-2">
                <DatePicker date={startDate} setDate={setStartDate} />
                <span className="flex items-center">to</span>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Group By</label>
              <Select
                value={groupBy}
                onValueChange={(value) => setGroupBy(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="model">Model</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchData} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(summary.total_tokens)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Input: {formatNumber(summary.total_input_tokens)} | Output:{" "}
                {formatNumber(summary.total_output_tokens)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estimated Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCost(summary.total_cost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {formatNumber(summary.total_requests)} requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Models Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.model_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Different AI models
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.user_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {summary.feature_count} features
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Token Usage</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Usage Over Time</CardTitle>
              <CardDescription>
                Input and output tokens by {groupBy}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={groupBy === "day" ? "date" : groupBy}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatNumber(value as number)}
                    />
                    <Legend />
                    <Bar
                      dataKey="input_tokens"
                      name="Input Tokens"
                      fill="#0088FE"
                    />
                    <Bar
                      dataKey="output_tokens"
                      name="Output Tokens"
                      fill="#00C49F"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>Estimated costs by {groupBy}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={groupBy === "day" ? "date" : groupBy}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      formatter={(value) => formatCost(value as number)}
                    />
                    <Legend />
                    <Bar
                      dataKey="estimated_cost_usd"
                      name="Estimated Cost"
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Distribution</CardTitle>
              <CardDescription>
                Distribution of tokens by {groupBy}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageData}
                      dataKey="total_tokens"
                      nameKey={groupBy === "day" ? "date" : groupBy}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={(entry) =>
                        entry[groupBy === "day" ? "date" : groupBy]
                      }
                    >
                      {usageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatNumber(value as number)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Token Usage Data</CardTitle>
          <CardDescription>Raw data grouped by {groupBy}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    {groupBy === "day"
                      ? "Date"
                      : groupBy === "model"
                      ? "Model"
                      : groupBy === "feature"
                      ? "Feature"
                      : "User"}
                  </th>
                  <th className="text-right p-2">Input Tokens</th>
                  <th className="text-right p-2">Output Tokens</th>
                  <th className="text-right p-2">Total Tokens</th>
                  <th className="text-right p-2">Estimated Cost</th>
                  <th className="text-right p-2">Requests</th>
                </tr>
              </thead>
              <tbody>
                {usageData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      {
                        item[
                          groupBy === "day"
                            ? "date"
                            : (groupBy as keyof TokenUsageData)
                        ] as string
                      }
                    </td>
                    <td className="text-right p-2">
                      {formatNumber(item.input_tokens)}
                    </td>
                    <td className="text-right p-2">
                      {formatNumber(item.output_tokens)}
                    </td>
                    <td className="text-right p-2">
                      {formatNumber(item.total_tokens)}
                    </td>
                    <td className="text-right p-2">
                      {formatCost(item.estimated_cost_usd)}
                    </td>
                    <td className="text-right p-2">
                      {formatNumber(item.request_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
