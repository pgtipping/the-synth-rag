import { NextRequest, NextResponse } from "next/server";
import db from "@/src/lib/db";
import { ApiResponse, ExamplePrompt } from "@/src/lib/types/prompts";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const useCase = searchParams.get("use_case");
    const isActive = searchParams.get("is_active") === "true";

    // Build the query based on parameters
    let query = `
      SELECT * FROM example_prompts 
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (useCase) {
      query += ` AND use_case = $${paramIndex}`;
      queryParams.push(useCase);
      paramIndex++;
    }

    if (isActive) {
      query += ` AND is_active = $${paramIndex}`;
      queryParams.push(isActive);
      paramIndex++;
    }

    // Add ORDER BY RANDOM() to get a random prompt
    query += ` ORDER BY RANDOM() LIMIT 1`;

    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: "No prompts found matching the criteria",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Track that this prompt was viewed (not used yet)
    const prompt = result.rows[0];

    const response: ApiResponse<ExamplePrompt> = {
      success: true,
      data: {
        id: prompt.id,
        category_id: prompt.category_id,
        use_case: prompt.use_case,
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        is_active: prompt.is_active,
        display_order: prompt.display_order,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at,
        metadata: prompt.metadata || {},
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching random prompt:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to fetch random prompt",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
