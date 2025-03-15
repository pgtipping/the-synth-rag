import { NextRequest, NextResponse } from "next/server";
import db from "@/src/lib/db";
import { withCors } from "@/src/lib/middleware/cors";
import { rateLimit } from "@/src/lib/rate-limit";

interface UsageAlert {
  id: string;
  type: "cost_spike" | "quota_approaching" | "unusual_activity";
  severity: "low" | "medium" | "high";
  message: string;
  details: Record<string, unknown>;
  created_at: string;
  resolved: boolean;
  timestamp?: string;
  acknowledged?: boolean;
}

interface HourlyData {
  hour: string;
  request_count: string;
  total_tokens: string;
}

interface QuotaData {
  user_id: string;
  daily_limit: number;
  monthly_limit: number;
  current_daily_usage: number;
  current_monthly_usage: number;
}

export async function GET(request: NextRequest) {
  return withCors(request, handleUsageAlertsRequest);
}

async function handleUsageAlertsRequest(request: NextRequest) {
  try {
    // Rate limiting
    const limiter = await rateLimit("admin_usage_alerts");
    const remaining = await limiter.remaining();
    if (!remaining) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get("includeResolved") === "true";

    // Get alerts
    const alerts = await detectUsageAlerts(includeResolved);

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Usage Alerts API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function detectUsageAlerts(
  includeResolved: boolean
): Promise<UsageAlert[]> {
  const alerts: UsageAlert[] = [];

  // 1. Detect cost spikes
  const costSpikeAlerts = await detectCostSpikes();
  alerts.push(...costSpikeAlerts);

  // 2. Detect users approaching quota limits
  const quotaAlerts = await detectQuotaApproaching();
  alerts.push(...quotaAlerts);

  // 3. Detect unusual activity patterns
  const unusualActivityAlerts = await detectUnusualActivity();
  alerts.push(...unusualActivityAlerts);

  // Filter out resolved alerts if not requested
  return includeResolved ? alerts : alerts.filter((alert) => !alert.resolved);
}

async function detectCostSpikes(): Promise<UsageAlert[]> {
  try {
    // Get daily cost data for the past 30 days
    const result = await db.query(`
      SELECT 
        date, 
        SUM(estimated_cost_usd) as daily_cost
      FROM token_usage_summary
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    const dailyCosts = result.rows as { date: string; daily_cost: string }[];
    if (dailyCosts.length < 7) {
      return []; // Not enough data
    }

    // Calculate average daily cost for the past 7 days (excluding today)
    const recentCosts = dailyCosts
      .filter((row) => row.date < new Date().toISOString().split("T")[0])
      .slice(-7);

    const avgCost =
      recentCosts.reduce((sum, row) => sum + parseFloat(row.daily_cost), 0) /
      recentCosts.length;

    // Check if today's cost is significantly higher than the average
    const today = dailyCosts.find(
      (row) => row.date === new Date().toISOString().split("T")[0]
    );
    if (today && parseFloat(today.daily_cost) > avgCost * 2) {
      return [
        {
          id: `cost_spike_${new Date().toISOString().split("T")[0]}`,
          type: "cost_spike",
          severity:
            parseFloat(today.daily_cost) > avgCost * 3 ? "high" : "medium",
          message: `Cost spike detected: Today's cost is ${(
            parseFloat(today.daily_cost) / avgCost
          ).toFixed(1)}x higher than the 7-day average`,
          details: {
            today_cost: parseFloat(today.daily_cost),
            avg_cost: avgCost,
            increase_factor: parseFloat(today.daily_cost) / avgCost,
          },
          created_at: new Date().toISOString(),
          resolved: false,
        },
      ];
    }

    return [];
  } catch (error) {
    console.error("Error detecting cost spikes:", error);
    return [];
  }
}

async function detectQuotaApproaching(): Promise<UsageAlert[]> {
  try {
    // Get users approaching their quota limits
    const result = await db.query(`
      SELECT 
        user_id,
        daily_limit,
        monthly_limit,
        current_daily_usage,
        current_monthly_usage
      FROM user_token_quota
      WHERE 
        (daily_limit IS NOT NULL AND current_daily_usage > daily_limit * 0.8)
        OR
        (monthly_limit IS NOT NULL AND current_monthly_usage > monthly_limit * 0.8)
    `);

    return (result.rows as QuotaData[]).map((row) => {
      const isDailyApproaching =
        row.daily_limit && row.current_daily_usage > row.daily_limit * 0.8;
      const isMonthlyApproaching =
        row.monthly_limit &&
        row.current_monthly_usage > row.monthly_limit * 0.8;

      let message = "";
      let severity: "low" | "medium" | "high" = "medium";

      if (
        isDailyApproaching &&
        row.current_daily_usage > row.daily_limit * 0.95
      ) {
        message = `User ${row.user_id} is about to exceed daily token limit (${row.current_daily_usage}/${row.daily_limit})`;
        severity = "high";
      } else if (isDailyApproaching) {
        message = `User ${row.user_id} is approaching daily token limit (${row.current_daily_usage}/${row.daily_limit})`;
        severity = "medium";
      } else if (
        isMonthlyApproaching &&
        row.current_monthly_usage > row.monthly_limit * 0.95
      ) {
        message = `User ${row.user_id} is about to exceed monthly token limit (${row.current_monthly_usage}/${row.monthly_limit})`;
        severity = "high";
      } else if (isMonthlyApproaching) {
        message = `User ${row.user_id} is approaching monthly token limit (${row.current_monthly_usage}/${row.monthly_limit})`;
        severity = "medium";
      }

      return {
        id: `quota_${row.user_id}_${new Date().toISOString().split("T")[0]}`,
        type: "quota_approaching",
        severity,
        message,
        details: {
          user_id: row.user_id,
          daily_limit: row.daily_limit,
          monthly_limit: row.monthly_limit,
          current_daily_usage: row.current_daily_usage,
          current_monthly_usage: row.current_monthly_usage,
          daily_percentage: row.daily_limit
            ? (row.current_daily_usage / row.daily_limit) * 100
            : null,
          monthly_percentage: row.monthly_limit
            ? (row.current_monthly_usage / row.monthly_limit) * 100
            : null,
        },
        created_at: new Date().toISOString(),
        resolved: false,
      };
    });
  } catch (error) {
    console.error("Error detecting quota approaching:", error);
    return [];
  }
}

async function detectUnusualActivity(): Promise<UsageAlert[]> {
  try {
    const alerts: UsageAlert[] = [];

    // Get hourly usage data for the past 24 hours
    const result = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') as hour,
        COUNT(*) as request_count,
        SUM(total_tokens) as total_tokens
      FROM chat_sessions
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `);

    const hourlyData = result.rows as HourlyData[];
    if (hourlyData.length < 12) {
      return []; // Not enough data
    }

    // Calculate average requests per hour
    const avgRequestsPerHour =
      hourlyData.reduce(
        (sum: number, row: HourlyData) => sum + parseInt(row.request_count),
        0
      ) / hourlyData.length;

    // Calculate average tokens per request
    const avgTokensPerRequest =
      hourlyData.reduce(
        (sum: number, row: HourlyData) => sum + parseInt(row.total_tokens),
        0
      ) /
      hourlyData.reduce(
        (sum: number, row: HourlyData) => sum + parseInt(row.request_count),
        0
      );

    // Check for unusual activity in the past hour
    const currentHour = new Date().getHours();
    const currentHourData = hourlyData.find(
      (row: HourlyData) => parseInt(row.hour) === currentHour
    );

    if (currentHourData) {
      const requestsRatio =
        parseInt(currentHourData.request_count) / avgRequestsPerHour;
      const tokensRatio =
        parseInt(currentHourData.total_tokens) / avgTokensPerRequest;

      if (requestsRatio > 3 || tokensRatio > 3) {
        alerts.push({
          id: crypto.randomUUID(),
          type: "unusual_activity",
          severity: requestsRatio > 5 || tokensRatio > 5 ? "high" : "medium",
          message: `Unusual activity detected in the past hour (${requestsRatio.toFixed(
            1
          )}x requests, ${tokensRatio.toFixed(1)}x tokens)`,
          created_at: new Date().toISOString(),
          resolved: false,
          details: {
            current_requests: parseInt(currentHourData.request_count),
            avg_requests: avgRequestsPerHour,
            requests_ratio: requestsRatio,
            current_tokens: parseInt(currentHourData.total_tokens),
            avg_tokens: avgTokensPerRequest,
            tokens_ratio: tokensRatio,
          },
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error detecting unusual activity:", error);
    return [];
  }
}
