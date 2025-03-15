"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Loader2, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface UsageAlert {
  id: string;
  type: "cost_spike" | "quota_approaching" | "unusual_activity";
  severity: "low" | "medium" | "high";
  message: string;
  details: Record<string, unknown>;
  created_at: string;
  resolved: boolean;
}

// Helper function to safely format numbers
const safeToFixed = (value: unknown, digits: number): string => {
  if (typeof value === "number") {
    return value.toFixed(digits);
  }
  return "0";
};

// Helper function to check if a property exists and is not null/undefined
const hasProperty = (obj: Record<string, unknown>, prop: string): boolean => {
  return obj && prop in obj && obj[prop] !== null && obj[prop] !== undefined;
};

export default function UsageAlerts() {
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeResolved, setIncludeResolved] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/usage-alerts?includeResolved=${includeResolved}`
      );
      if (!response.ok) {
        throw new Error(`Error fetching alerts: ${response.statusText}`);
      }
      const data = await response.json();
      setAlerts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching usage alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Set up polling every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [includeResolved]);

  const getAlertIcon = (
    type: UsageAlert["type"],
    severity: UsageAlert["severity"]
  ) => {
    if (severity === "high") {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (severity === "medium") {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    } else {
      return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: UsageAlert["severity"]) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getTypeBadge = (type: UsageAlert["type"]) => {
    switch (type) {
      case "cost_spike":
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 border-purple-200"
          >
            Cost Spike
          </Badge>
        );
      case "quota_approaching":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            Quota Limit
          </Badge>
        );
      case "unusual_activity":
        return (
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-800 border-orange-200"
          >
            Unusual Activity
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const markAsResolved = async (alertId: string) => {
    // In a real implementation, this would call an API to mark the alert as resolved
    // For now, we'll just update the local state
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading alerts...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Usage Alerts</CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Show Resolved</span>
          <Button
            variant={includeResolved ? "outline" : "default"}
            size="sm"
            onClick={() => setIncludeResolved(!includeResolved)}
          >
            {includeResolved ? "Hide Resolved" : "Show Resolved"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            className="ml-2"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No alerts found. Everything looks normal!
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                className={`${getSeverityColor(alert.severity)} ${
                  alert.resolved ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start">
                  <div className="mr-2">
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <AlertTitle className="flex items-center">
                        {alert.message}
                        <span className="ml-2">{getTypeBadge(alert.type)}</span>
                      </AlertTitle>
                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsResolved(alert.id)}
                          className="ml-2 bg-white"
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                    <AlertDescription className="mt-1">
                      <div className="text-xs text-muted-foreground">
                        Detected at {formatDate(alert.created_at)}
                      </div>
                      {alert.type === "cost_spike" && (
                        <div className="mt-2 text-sm">
                          Today&apos;s cost: $
                          {safeToFixed(alert.details.today_cost, 4)} | Average
                          cost: ${safeToFixed(alert.details.avg_cost, 4)} |
                          Increase:{" "}
                          {safeToFixed(alert.details.increase_factor, 1)}x
                        </div>
                      )}
                      {alert.type === "quota_approaching" && (
                        <div className="mt-2 text-sm">
                          {hasProperty(alert.details, "daily_percentage") && (
                            <div>
                              Daily usage:{" "}
                              {safeToFixed(alert.details.daily_percentage, 1)}%
                            </div>
                          )}
                          {hasProperty(alert.details, "monthly_percentage") && (
                            <div>
                              Monthly usage:{" "}
                              {safeToFixed(alert.details.monthly_percentage, 1)}
                              %
                            </div>
                          )}
                        </div>
                      )}
                      {alert.type === "unusual_activity" && (
                        <div className="mt-2 text-sm">
                          Requests:{" "}
                          {safeToFixed(alert.details.requests_ratio, 1)}x normal
                          | Tokens: {safeToFixed(alert.details.tokens_ratio, 1)}
                          x normal
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
