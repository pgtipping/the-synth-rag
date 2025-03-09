import { NextRequest, NextResponse } from "next/server";
import db from "@/src/lib/db";
import { ApiResponse, CreatePromptUsageRequest } from "@/src/lib/types/prompts";
import { z } from "zod";

// Validation schema for prompt usage
const promptUsageSchema = z.object({
  prompt_id: z.number(),
  session_id: z.number().optional(),
  success_rating: z.number().min(1).max(5).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = promptUsageSchema.safeParse(body);
    if (!validationResult.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid request: ${validationResult.error.message}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const data = validationResult.data as CreatePromptUsageRequest;

    // Insert usage record
    const result = await db.query(
      `INSERT INTO prompt_usage 
        (prompt_id, session_id, used_at, success_rating, metadata) 
       VALUES 
        ($1, $2, NOW(), $3, $4)
       RETURNING id`,
      [
        data.prompt_id,
        data.session_id || null,
        data.success_rating || null,
        data.metadata || {},
      ]
    );

    const response: ApiResponse<{ id: number }> = {
      success: true,
      data: {
        id: result.rows[0].id,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error tracking prompt usage:", error);

    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to track prompt usage",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
