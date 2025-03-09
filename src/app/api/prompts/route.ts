import { NextRequest, NextResponse } from "next/server";
import pool from "@/src/lib/db";
import { z } from "zod";
import { QueryResult } from "pg";

interface ExamplePrompt {
  id: number;
  title: string;
  content: string;
  use_case: string;
  category_id: number;
  display_order: number;
  is_active: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface PromptWithStats extends ExamplePrompt {
  total_uses: number;
  avg_rating: number | null;
}

// Schema for validating query parameters
const QuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(10),
  category_id: z.coerce.number().optional(),
  use_case: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

// Schema for validating prompt creation
const CreatePromptSchema = z.object({
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
  is_active: z.boolean().default(true),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = QuerySchema.parse(Object.fromEntries(searchParams));

    // Calculate pagination
    const offset = (params.page - 1) * params.pageSize;

    // Build where clause parts
    const whereParts: string[] = [];
    const values: (string | number | boolean)[] = [];
    let paramCount = 1;

    if (params.category_id) {
      whereParts.push(`category_id = $${paramCount}`);
      values.push(params.category_id);
      paramCount++;
    }
    if (params.use_case) {
      whereParts.push(`use_case = $${paramCount}`);
      values.push(params.use_case);
      paramCount++;
    }
    if (typeof params.is_active === "boolean") {
      whereParts.push(`is_active = $${paramCount}`);
      values.push(params.is_active);
      paramCount++;
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM example_prompts
      ${whereClause}
    `;
    const countResult = await pool.query<{ total: string }>(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalCount / params.pageSize);

    // Get prompts with usage stats
    const promptsQuery = `
      SELECT 
        p.*,
        COALESCE(us.total_uses, 0) as total_uses,
        us.avg_rating
      FROM example_prompts p
      LEFT JOIN prompt_usage_stats us ON p.id = us.prompt_id
      ${whereClause}
      ORDER BY p.display_order ASC, p.id DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    const promptsResult = await pool.query<PromptWithStats>(promptsQuery, [
      ...values,
      params.pageSize,
      offset,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: promptsResult.rows,
        totalPages,
        currentPage: params.page,
        totalItems: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreatePromptSchema.parse(body);

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert the prompt
      const promptQuery = `
        INSERT INTO example_prompts (
          title,
          content,
          use_case,
          category_id,
          display_order,
          is_active,
          description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
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
      ]);

      // Create usage stats
      await client.query(
        `
        INSERT INTO prompt_usage_stats (
          prompt_id,
          total_uses,
          avg_rating
        ) VALUES ($1, 0, NULL)
      `,
        [promptResult.rows[0].id]
      );

      await client.query("COMMIT");

      const prompt: PromptWithStats = {
        ...promptResult.rows[0],
        total_uses: 0,
        avg_rating: null,
      };

      return NextResponse.json(
        {
          success: true,
          data: prompt,
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating prompt:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid prompt data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
