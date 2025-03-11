import { NextRequest, NextResponse } from "next/server";
import db from "@/src/lib/db";
import { withCors } from "@/src/lib/middleware/cors";
import { rateLimit } from "@/src/lib/rate-limit";

interface TokenUsageParams {
  startDate?: string;
  endDate?: string;
  model?: string;
  feature?: string;
  userId?: string;
  groupBy?: "day" | "model" | "feature" | "user";
}

export async function GET(request: NextRequest) {
  return withCors(request, handleTokenUsageRequest);
}

async function handleTokenUsageRequest(request: NextRequest) {
  try {
    // Rate limiting
    const limiter = await rateLimit("admin_token_usage");
    const remaining = await limiter.remaining();
    if (!remaining) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate =
      searchParams.get("startDate") ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    const endDate =
      searchParams.get("endDate") || new Date().toISOString().split("T")[0];
    const model = searchParams.get("model");
    const feature = searchParams.get("feature");
    const userId = searchParams.get("userId");
    const groupBy =
      (searchParams.get("groupBy") as "day" | "model" | "feature" | "user") ||
      "day";

    // Get token usage data
    const usageData = await getTokenUsage({
      startDate,
      endDate,
      model: model || undefined,
      feature: feature || undefined,
      userId: userId || undefined,
      groupBy,
    });

    // Get summary metrics
    const summaryMetrics = await getTokenUsageSummary({
      startDate,
      endDate,
      model: model || undefined,
      feature: feature || undefined,
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        usageData,
        summaryMetrics,
        params: {
          startDate,
          endDate,
          model: model || undefined,
          feature: feature || undefined,
          userId: userId || undefined,
          groupBy,
        },
      },
    });
  } catch (error) {
    console.error("Token Usage API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function getTokenUsage(params: TokenUsageParams) {
  const { startDate, endDate, model, feature, userId, groupBy } = params;

  // Build the query based on groupBy parameter
  let query = "";
  let groupByClause = "";
  let orderByClause = "";

  switch (groupBy) {
    case "day":
      query = `
        SELECT 
          DATE(created_at) as date,
          SUM(input_tokens) as input_tokens,
          SUM(output_tokens) as output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost_usd) as estimated_cost_usd,
          COUNT(*) as request_count
        FROM token_usage
        WHERE created_at >= $1 AND created_at <= $2
      `;
      groupByClause = "GROUP BY DATE(created_at)";
      orderByClause = "ORDER BY date ASC";
      break;

    case "model":
      query = `
        SELECT 
          model,
          SUM(input_tokens) as input_tokens,
          SUM(output_tokens) as output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost_usd) as estimated_cost_usd,
          COUNT(*) as request_count
        FROM token_usage
        WHERE created_at >= $1 AND created_at <= $2
      `;
      groupByClause = "GROUP BY model";
      orderByClause = "ORDER BY total_tokens DESC";
      break;

    case "feature":
      query = `
        SELECT 
          feature,
          SUM(input_tokens) as input_tokens,
          SUM(output_tokens) as output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost_usd) as estimated_cost_usd,
          COUNT(*) as request_count
        FROM token_usage
        WHERE created_at >= $1 AND created_at <= $2
      `;
      groupByClause = "GROUP BY feature";
      orderByClause = "ORDER BY total_tokens DESC";
      break;

    case "user":
      query = `
        SELECT 
          user_id,
          SUM(input_tokens) as input_tokens,
          SUM(output_tokens) as output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost_usd) as estimated_cost_usd,
          COUNT(*) as request_count
        FROM token_usage
        WHERE created_at >= $1 AND created_at <= $2
      `;
      groupByClause = "GROUP BY user_id";
      orderByClause = "ORDER BY total_tokens DESC";
      break;
  }

  // Add filters
  const queryParams: string[] = [startDate || "", endDate || ""];
  let filterClause = "";

  if (model) {
    queryParams.push(model);
    filterClause += ` AND model = $${queryParams.length}`;
  }

  if (feature) {
    queryParams.push(feature);
    filterClause += ` AND feature = $${queryParams.length}`;
  }

  if (userId) {
    queryParams.push(userId);
    filterClause += ` AND user_id = $${queryParams.length}`;
  }

  // Complete the query
  const fullQuery = `${query}${filterClause} ${groupByClause} ${orderByClause}`;

  // Execute the query
  const result = await db.query(fullQuery, queryParams);
  return result.rows;
}

async function getTokenUsageSummary(params: TokenUsageParams) {
  const { startDate, endDate, model, feature, userId } = params;

  // Build the query
  let query = `
    SELECT 
      SUM(input_tokens) as total_input_tokens,
      SUM(output_tokens) as total_output_tokens,
      SUM(total_tokens) as total_tokens,
      SUM(estimated_cost_usd) as total_cost,
      COUNT(*) as total_requests,
      COUNT(DISTINCT model) as model_count,
      COUNT(DISTINCT feature) as feature_count,
      COUNT(DISTINCT user_id) as user_count
    FROM token_usage
    WHERE created_at >= $1 AND created_at <= $2
  `;

  // Add filters
  const queryParams: string[] = [startDate || "", endDate || ""];

  if (model) {
    queryParams.push(model);
    query += ` AND model = $${queryParams.length}`;
  }

  if (feature) {
    queryParams.push(feature);
    query += ` AND feature = $${queryParams.length}`;
  }

  if (userId) {
    queryParams.push(userId);
    query += ` AND user_id = $${queryParams.length}`;
  }

  // Execute the query
  const result = await db.query(query, queryParams);
  return result.rows[0];
}
