import { NextRequest, NextResponse } from "next/server";
import db from "@/src/lib/db";
import { ApiResponse } from "@/src/lib/types/prompts";

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
    const totalUsage = parseInt(totalUsageResult.rows[0].total, 10);

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

    const promptUsage = promptUsageResult.rows.map((row: any) => ({
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

    const usageByDay = usageByDayResult.rows.map((row: any) => ({
      date: row.date.toISOString().split("T")[0],
      count: parseInt(row.count, 10),
    }));

    const usageByUseCase = usageByUseCaseResult.rows.map((row: any) => ({
      useCase: row.use_case,
      count: parseInt(row.count, 10),
    }));

    const response: ApiResponse<any> = {
      success: true,
      data: {
        totalUsage,
        promptUsage,
        usageByDay,
        usageByUseCase,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching prompt analytics:", error);

    const response: ApiResponse<any> = {
      success: false,
      error: "Failed to fetch prompt analytics",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
