"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Progress } from "@/src/components/progress/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useState, useEffect } from "react";
import {
  Activity,
  Database,
  Server,
  AlertTriangle,
  XCircle,
  AlertOctagon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";

interface SystemMetrics {
  activeSessions: number;
  errorRate: number;
  avgCompletionTime: number;
  successRate: number;
}

interface HealthMetrics {
  database: {
    status: string;
    latency: number;
    hourlyStats: {
      total_sessions: number;
      active_sessions: number;
      failed_sessions: number;
    };
  };
  system: {
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    uptime: number;
  };
  timestamp: string;
}

interface ErrorState {
  type: "auth" | "rate_limit" | "server" | "network" | "unknown";
  message: string;
  code?: number;
  retryable: boolean;
}

export default function AdminProgress() {
  const [filter, setFilter] = useState<"all" | "error" | "slow">("all");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = (error: any): ErrorState => {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        type: "network",
        message:
          "Network connection error. Please check your internet connection.",
        retryable: true,
      };
    }

    if (error.response) {
      switch (error.response.status) {
        case 401:
          return {
            type: "auth",
            message: "Authentication failed. Please log in again.",
            code: 401,
            retryable: false,
          };
        case 429:
          return {
            type: "rate_limit",
            message: "Too many requests. Please try again later.",
            code: 429,
            retryable: true,
          };
        case 500:
          return {
            type: "server",
            message: "Internal server error. Our team has been notified.",
            code: 500,
            retryable: true,
          };
        default:
          return {
            type: "unknown",
            message: "An unexpected error occurred.",
            code: error.response.status,
            retryable: true,
          };
      }
    }

    return {
      type: "unknown",
      message: "An unexpected error occurred.",
      retryable: true,
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/metrics?timeRange=${timeRange}&filter=${filter}`
      );
      if (!response.ok) {
        throw { response };
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setHealth(data.healthMetrics);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      setError(handleError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [timeRange, filter]);

  const ErrorDisplay = ({ error }: { error: ErrorState }) => {
    const icons = {
      auth: <AlertOctagon className="h-5 w-5" />,
      rate_limit: <AlertTriangle className="h-5 w-5" />,
      server: <XCircle className="h-5 w-5" />,
      network: <AlertTriangle className="h-5 w-5" />,
      unknown: <AlertTriangle className="h-5 w-5" />,
    };

    const severityClasses = {
      auth: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800",
      rate_limit:
        "border-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800",
      server: "border-red-500 bg-red-50 dark:bg-red-950/20 dark:border-red-800",
      network:
        "border-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800",
      unknown:
        "border-gray-500 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700",
    };

    const errorTitles = {
      auth: "Authentication Error",
      rate_limit: "Rate Limit Exceeded",
      server: "Server Error",
      network: "Network Error",
      unknown: "Unknown Error",
    };

    const errorHelp = {
      auth: "Try logging out and logging back in to refresh your session.",
      rate_limit:
        "The system is experiencing high traffic. Please wait a moment before trying again.",
      server:
        "Our team has been automatically notified and is working to resolve this issue.",
      network: "Check your internet connection or try again later.",
      unknown: "If this error persists, please contact support.",
    };

    return (
      <Alert className={`mb-6 ${severityClasses[error.type]}`}>
        <div className="flex items-center gap-2">
          {icons[error.type]}
          <AlertTitle className="text-lg font-semibold">
            {errorTitles[error.type]} {error.code ? `(${error.code})` : ""}
          </AlertTitle>
        </div>
        <AlertDescription className="mt-2">
          <p className="text-sm mb-1">{error.message}</p>
          <p className="text-xs text-muted-foreground">
            {errorHelp[error.type]}
          </p>
          <div className="mt-3 flex gap-2">
            {error.retryable && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="gap-1"
              >
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
                  className="lucide lucide-refresh-cw"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Retry
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="gap-1"
            >
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
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Progress Monitor</h1>
        <div className="flex space-x-4">
          <Select
            value={timeRange}
            onValueChange={(value: "1h" | "24h" | "7d") => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter}
            onValueChange={(value: "all" | "error" | "slow") =>
              setFilter(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="error">Errors Only</SelectItem>
              <SelectItem value="slow">Slow Sessions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <ErrorDisplay error={error} />}

      {/* System Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics?.activeSessions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${(metrics?.errorRate || 0).toFixed(1)}%`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Avg. Completion Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading
                ? "..."
                : `${(metrics?.avgCompletionTime || 0).toFixed(1)}s`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${(metrics?.successRate || 0).toFixed(1)}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions with Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions Requiring Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress />
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Database Health */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h3 className="font-semibold">Database</h3>
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={
                      health?.database.status === "connected"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {health?.database.status || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency</span>
                  <span>{health?.database.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Active Sessions (1h)
                  </span>
                  <span>
                    {health?.database.hourlyStats.active_sessions || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Failed Sessions (1h)
                  </span>
                  <span>
                    {health?.database.hourlyStats.failed_sessions || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* System Resources */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                <h3 className="font-semibold">System Resources</h3>
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Used</span>
                  <span>{health?.system.memory.heapUsed || 0} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Total</span>
                  <span>{health?.system.memory.heapTotal || 0} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSS</span>
                  <span>{health?.system.memory.rss || 0} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span>
                    {Math.round((health?.system.uptime || 0) / 3600)}h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
