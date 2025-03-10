import { NextRequest, NextResponse } from "next/server";
import db from "@/src/lib/db";
import { ApiResponse, ExamplePrompt } from "@/src/lib/types/prompts";

// Define types for database query results
interface TotalUsageResult {
  total: string;
}

interface PromptUsageRow extends Omit<ExamplePrompt, "metadata"> {
  usage_count: string;
  avg_rating: string | null;
  metadata: Record<string, unknown> | null;
}

interface UsageByDayRow {
  date: Date;
  count: string;
}

interface UsageByUseCaseRow {
  use_case: string;
  count: string;
}

// Define a type for the analytics response
interface AnalyticsData {
  totalUsage: number;
  promptUsage: Array<{
    prompt: ExamplePrompt;
    usageCount: number;
    averageRating: number | null;
  }>;
  usageByDay: Array<{
    date: string;
    count: number;
  }>;
  usageByUseCase: Array<{
    useCase: string;
    count: number;
  }>;
}

// Type guard functions
function isTotalUsageResult(row: unknown): row is TotalUsageResult {
  return typeof row === "object" && row !== null && "total" in row;
}

function isPromptUsageRow(row: unknown): row is PromptUsageRow {
  return (
    typeof row === "object" &&
    row !== null &&
    "id" in row &&
    "category_id" in row &&
    "use_case" in row &&
    "title" in row &&
    "content" in row &&
    "usage_count" in row
  );
}

function isUsageByDayRow(row: unknown): row is UsageByDayRow {
  return (
    typeof row === "object" && row !== null && "date" in row && "count" in row
  );
}

function isUsageByUseCaseRow(row: unknown): row is UsageByUseCaseRow {
  return (
    typeof row === "object" &&
    row !== null &&
    "use_case" in row &&
    "count" in row
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "7days";

    // Calculate the date range based on the timeRange parameter
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get total usage count
    const totalUsageResult = await db.query(
      `SELECT COUNT(*) as total FROM prompt_usage 
       WHERE used_at >= $1`,
      [startDate]
    );

    let totalUsage = 0;
    if (totalUsageResult.rows.length > 0) {
      const row = totalUsageResult.rows[0];
      if (isTotalUsageResult(row)) {
        totalUsage = parseInt(row.total, 10);
      }
    }

    // Get usage by prompt with average rating
    const promptUsageResult = await db.query(
      `SELECT 
         p.id, p.title, p.use_case, p.category_id, p.content, 
         p.description, p.is_active, p.display_order, p.created_at, 
         p.updated_at, p.metadata,
         COUNT(pu.id) as usage_count,
         AVG(pu.success_rating) as avg_rating
       FROM example_prompts p
       LEFT JOIN prompt_usage pu ON p.id = pu.prompt_id
       WHERE pu.used_at >= $1 OR pu.used_at IS NULL
       GROUP BY p.id
       ORDER BY usage_count DESC`,
      [startDate]
    );

    // Get usage by day
    const usageByDayResult = await db.query(
      `SELECT 
         DATE(used_at) as date,
         COUNT(*) as count
       FROM prompt_usage
       WHERE used_at >= $1
       GROUP BY DATE(used_at)
       ORDER BY date`,
      [startDate]
    );

    // Get usage by use case
    const usageByUseCaseResult = await db.query(
      `SELECT 
         p.use_case,
         COUNT(pu.id) as count
       FROM prompt_usage pu
       JOIN example_prompts p ON pu.prompt_id = p.id
       WHERE pu.used_at >= $1
       GROUP BY p.use_case
       ORDER BY count DESC`,
      [startDate]
    );

    const promptUsage = promptUsageResult.rows
      .filter(isPromptUsageRow)
      .map((row) => ({
        prompt: {
          id: row.id,
          category_id: row.category_id,
          use_case: row.use_case,
          title: row.title,
          content: row.content,
          description: row.description,
          is_active: row.is_active,
          display_order: row.display_order,
          created_at: row.created_at,
          updated_at: row.updated_at,
          metadata: row.metadata || {},
        },
        usageCount: parseInt(row.usage_count, 10),
        averageRating: row.avg_rating ? parseFloat(row.avg_rating) : null,
      }));

    const usageByDay = usageByDayResult.rows
      .filter(isUsageByDayRow)
      .map((row) => ({
        date: row.date.toISOString().split("T")[0],
        count: parseInt(row.count, 10),
      }));

    const usageByUseCase = usageByUseCaseResult.rows
      .filter(isUsageByUseCaseRow)
      .map((row) => ({
        useCase: row.use_case,
        count: parseInt(row.count, 10),
      }));

    const data: AnalyticsData = {
      totalUsage,
      promptUsage,
      usageByDay,
      usageByUseCase,
    };

    const response: ApiResponse<AnalyticsData> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching prompt analytics:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to fetch prompt analytics",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
