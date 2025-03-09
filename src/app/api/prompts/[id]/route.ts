import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getExamplePromptById,
  updateExamplePrompt,
  deleteExamplePrompt,
  getPromptUsageStats,
  createPromptUsage,
} from "../../../../lib/db/prompts";
import type { ApiResponse, ExamplePrompt } from "@/src/lib/types/prompts";
import pool from "@/src/lib/db";

interface PromptWithStats extends ExamplePrompt {
  total_uses: number;
  avg_rating: number | null;
}

// Validation schema for updating a prompt
const updatePromptSchema = z.object({
  category_id: z.number().int().positive("Category ID is required").optional(),
  use_case: z.string().min(1, "Use case is required").optional(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Validation schema for recording prompt usage
const usageSchema = z.object({
  session_id: z.number().optional(),
  success_rating: z.number().min(1).max(5).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Schema for validating prompt updates
const UpdatePromptSchema = z.object({
  id: z.number().int().positive("ID must be a positive integer"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  use_case: z.string().min(1, "Use case is required"),
  category_id: z
    .number()
    .int()
    .positive("Category ID must be a positive integer"),
  display_order: z
    .number()
    .int()
    .nonnegative("Display order must be a non-negative integer"),
  is_active: z.boolean(),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<PromptWithStats>>> {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid prompt ID" },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        p.*,
        COALESCE(us.total_uses, 0) as total_uses,
        us.avg_rating
      FROM example_prompts p
      LEFT JOIN prompt_usage_stats us ON p.id = us.prompt_id
      WHERE p.id = $1
    `;
    const result = await pool.query<PromptWithStats>(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Prompt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prompt" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<PromptWithStats>>> {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid prompt ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = UpdatePromptSchema.parse({ ...body, id });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update the prompt
      const promptQuery = `
        UPDATE example_prompts
        SET
          title = $1,
          content = $2,
          use_case = $3,
          category_id = $4,
          display_order = $5,
          is_active = $6,
          description = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      const promptResult = await client.query<ExamplePrompt>(promptQuery, [
        validatedData.title,
        validatedData.content,
        validatedData.use_case,
        validatedData.category_id,
        validatedData.display_order,
        validatedData.is_active,
        validatedData.description,
        id,
      ]);

      if (promptResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Prompt not found" },
          { status: 404 }
        );
      }

      // Get usage stats
      const statsQuery = `
        SELECT total_uses, avg_rating
        FROM prompt_usage_stats
        WHERE prompt_id = $1
      `;
      const statsResult = await client.query<{
        total_uses: number;
        avg_rating: number | null;
      }>(statsQuery, [id]);

      await client.query("COMMIT");

      const prompt: PromptWithStats = {
        ...promptResult.rows[0],
        total_uses: statsResult.rows[0]?.total_uses ?? 0,
        avg_rating: statsResult.rows[0]?.avg_rating ?? null,
      };

      return NextResponse.json({
        success: true,
        data: prompt,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating prompt:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid prompt data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ id: number }>>> {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid prompt ID" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete usage stats first (due to foreign key constraint)
      await client.query(
        "DELETE FROM prompt_usage_stats WHERE prompt_id = $1",
        [id]
      );

      // Delete the prompt
      const result = await client.query(
        "DELETE FROM example_prompts WHERE id = $1 RETURNING id",
        [id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Prompt not found" },
          { status: 404 }
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        data: { id },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}

// POST endpoint for recording prompt usage
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid prompt ID" },
        { status: 400 }
      );
    }

    // Check if prompt exists
    const prompt = await getExamplePromptById(id);
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = usageSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request data: " +
            validatedData.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    await createPromptUsage({ prompt_id: id, ...validatedData.data });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error recording prompt usage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record prompt usage" },
      { status: 500 }
    );
  }
}
