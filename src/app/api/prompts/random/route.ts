import { NextRequest, NextResponse } from "next/server";
import db from "@/src/lib/db";
import { ApiResponse, ExamplePrompt } from "@/src/lib/types/prompts";

// Define a type for database query results
interface PromptRow {
  id: number;
  category_id: number;
  use_case: string;
  title: string;
  content: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, unknown> | null;
}

// Type guard function
function isPromptRow(row: unknown): row is PromptRow {
  return (
    typeof row === "object" &&
    row !== null &&
    "id" in row &&
    "category_id" in row &&
    "use_case" in row &&
    "title" in row &&
    "content" in row
  );
}

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
    const queryParams: (string | boolean)[] = [];
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

    // Get the prompt row
    const row = result.rows[0];

    if (!isPromptRow(row)) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Invalid prompt data returned from database",
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Convert to ExamplePrompt
    const prompt: ExamplePrompt = {
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
    };

    const response: ApiResponse<ExamplePrompt> = {
      success: true,
      data: prompt,
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
