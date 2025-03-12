import { encode } from "gpt-tokenizer";
import { db } from "@/src/lib/db";

interface TokenUsageEvent {
  model: string;
  feature: string;
  userId?: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

interface TokenUsageMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  requestCount: number;
  averageTokensPerRequest: number;
}

export class TokenUsageTracker {
  private static instance: TokenUsageTracker;
  private modelCosts: Map<string, { input: number; output: number }>;

  private constructor() {
    this.modelCosts = new Map([
      ["gpt-4-turbo-preview", { input: 0.01, output: 0.03 }],
      ["gpt-4", { input: 0.03, output: 0.06 }],
      ["gpt-3.5-turbo", { input: 0.0005, output: 0.0015 }],
      ["text-embedding-3-small", { input: 0.00002, output: 0.00002 }],
    ]);
  }

  public static getInstance(): TokenUsageTracker {
    if (!TokenUsageTracker.instance) {
      TokenUsageTracker.instance = new TokenUsageTracker();
    }
    return TokenUsageTracker.instance;
  }

  public async trackUsage(
    event: Omit<TokenUsageEvent, "timestamp">
  ): Promise<void> {
    const timestamp = new Date();
    const usageEvent: TokenUsageEvent = {
      ...event,
      timestamp,
    };

    try {
      await db.query(
        `INSERT INTO token_usage (
          model,
          feature,
          user_id,
          input_tokens,
          output_tokens,
          estimated_cost_usd,
          metadata,
          timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          usageEvent.model,
          usageEvent.feature,
          usageEvent.userId,
          usageEvent.inputTokens,
          usageEvent.outputTokens,
          usageEvent.estimatedCostUsd,
          usageEvent.metadata || {},
          usageEvent.timestamp,
        ]
      );
    } catch (error) {
      console.error("Error tracking token usage:", error);
      throw new Error("Failed to track token usage");
    }
  }

  public calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const costs = this.modelCosts.get(model);
    if (!costs) {
      throw new Error(`Unknown model: ${model}`);
    }

    return (inputTokens * costs.input + outputTokens * costs.output) / 1000;
  }

  public async getUsageMetrics(
    startDate: Date,
    endDate: Date,
    filters: { model?: string; feature?: string; userId?: string } = {}
  ): Promise<TokenUsageMetrics> {
    const params: any[] = [startDate, endDate];
    let filterConditions = "";
    let paramIndex = 3;

    if (filters.model) {
      filterConditions += ` AND model = $${paramIndex}`;
      params.push(filters.model);
      paramIndex++;
    }
    if (filters.feature) {
      filterConditions += ` AND feature = $${paramIndex}`;
      params.push(filters.feature);
      paramIndex++;
    }
    if (filters.userId) {
      filterConditions += ` AND user_id = $${paramIndex}`;
      params.push(filters.userId);
    }

    try {
      const result = await db.query(
        `SELECT 
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(estimated_cost_usd) as total_cost_usd,
          COUNT(*) as request_count
        FROM token_usage
        WHERE timestamp >= $1 AND timestamp <= $2${filterConditions}`,
        params
      );

      const row = result.rows[0];
      return {
        totalInputTokens: parseInt(row.total_input_tokens) || 0,
        totalOutputTokens: parseInt(row.total_output_tokens) || 0,
        totalCostUsd: parseFloat(row.total_cost_usd) || 0,
        requestCount: parseInt(row.request_count) || 0,
        averageTokensPerRequest:
          Math.round(
            ((parseInt(row.total_input_tokens) || 0) +
              (parseInt(row.total_output_tokens) || 0)) /
              (parseInt(row.request_count) || 1)
          ) || 0,
      };
    } catch (error) {
      console.error("Error fetching token usage metrics:", error);
      throw new Error("Failed to fetch token usage metrics");
    }
  }

  public async getUsageByDay(
    startDate: Date,
    endDate: Date,
    filters: { model?: string; feature?: string; userId?: string } = {}
  ): Promise<
    Array<{
      date: string;
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
    }>
  > {
    const params: any[] = [startDate, endDate];
    let filterConditions = "";
    let paramIndex = 3;

    if (filters.model) {
      filterConditions += ` AND model = $${paramIndex}`;
      params.push(filters.model);
      paramIndex++;
    }
    if (filters.feature) {
      filterConditions += ` AND feature = $${paramIndex}`;
      params.push(filters.feature);
      paramIndex++;
    }
    if (filters.userId) {
      filterConditions += ` AND user_id = $${paramIndex}`;
      params.push(filters.userId);
    }

    try {
      const result = await db.query(
        `SELECT 
          DATE(timestamp) as date,
          SUM(input_tokens) as input_tokens,
          SUM(output_tokens) as output_tokens,
          SUM(estimated_cost_usd) as cost_usd
        FROM token_usage
        WHERE timestamp >= $1 AND timestamp <= $2${filterConditions}
        GROUP BY DATE(timestamp)
        ORDER BY date`,
        params
      );

      return result.rows.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        inputTokens: parseInt(row.input_tokens),
        outputTokens: parseInt(row.output_tokens),
        costUsd: parseFloat(row.cost_usd),
      }));
    } catch (error) {
      console.error("Error fetching daily token usage:", error);
      throw new Error("Failed to fetch daily token usage");
    }
  }

  public async getUsageAlerts(
    thresholds: { dailyCostUsd?: number; totalCostUsd?: number } = {}
  ): Promise<Array<{ type: string; message: string; timestamp: Date }>> {
    const alerts: Array<{ type: string; message: string; timestamp: Date }> =
      [];
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    try {
      if (thresholds.dailyCostUsd) {
        const dailyMetrics = await this.getUsageMetrics(startOfDay, today);
        if (dailyMetrics.totalCostUsd >= thresholds.dailyCostUsd) {
          alerts.push({
            type: "daily_cost_threshold",
            message: `Daily cost threshold of $${thresholds.dailyCostUsd} exceeded`,
            timestamp: new Date(),
          });
        }
      }

      if (thresholds.totalCostUsd) {
        const monthlyMetrics = await this.getUsageMetrics(startOfMonth, today);
        if (monthlyMetrics.totalCostUsd >= thresholds.totalCostUsd) {
          alerts.push({
            type: "total_cost_threshold",
            message: `Monthly cost threshold of $${thresholds.totalCostUsd} exceeded`,
            timestamp: new Date(),
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error("Error checking usage alerts:", error);
      throw new Error("Failed to check usage alerts");
    }
  }
}
