import pool from "../db";
import {
  PromptCategory,
  ExamplePrompt,
  PromptUsage,
  CreatePromptCategoryRequest,
  UpdatePromptCategoryRequest,
  CreateExamplePromptRequest,
  UpdateExamplePromptRequest,
  CreatePromptUsageRequest,
  PaginatedResponse,
  PromptQueryParams,
} from "../types/prompts";

// Helper function to build WHERE clause for prompt queries
const buildWhereClause = (
  params: PromptQueryParams
): { where: string; values: (string | number | boolean)[] } => {
  const conditions: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (params.use_case) {
    conditions.push(`use_case = $${paramIndex}`);
    values.push(params.use_case);
    paramIndex++;
  }

  if (params.category_id) {
    conditions.push(`category_id = $${paramIndex}`);
    values.push(params.category_id);
    paramIndex++;
  }

  if (typeof params.is_active === "boolean") {
    conditions.push(`is_active = $${paramIndex}`);
    values.push(params.is_active);
    paramIndex++;
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, values };
};

// Prompt Categories
export async function getPromptCategories(): Promise<PromptCategory[]> {
  const result = await pool.query<PromptCategory>(
    "SELECT * FROM prompt_categories ORDER BY name"
  );
  return result.rows;
}

export async function getPromptCategoryById(
  id: number
): Promise<PromptCategory | null> {
  const result = await pool.query<PromptCategory>(
    "SELECT * FROM prompt_categories WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function createPromptCategory(
  data: CreatePromptCategoryRequest
): Promise<PromptCategory> {
  const result = await pool.query<PromptCategory>(
    "INSERT INTO prompt_categories (name, description) VALUES ($1, $2) RETURNING *",
    [data.name, data.description]
  );
  return result.rows[0];
}

export async function updatePromptCategory(
  data: UpdatePromptCategoryRequest
): Promise<PromptCategory | null> {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    values.push(data.name);
    paramIndex++;
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    values.push(data.description ?? null);
    paramIndex++;
  }

  if (updates.length === 0) return null;

  values.push(data.id);
  const result = await pool.query<PromptCategory>(
    `UPDATE prompt_categories SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deletePromptCategory(id: number): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM prompt_categories WHERE id = $1",
    [id]
  );
  return result.rowCount > 0;
}

// Example Prompts
export async function getExamplePrompts(
  params: PromptQueryParams
): Promise<PaginatedResponse<ExamplePrompt>> {
  const { where, values } = buildWhereClause(params);
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;
  const orderBy = params.orderBy || "display_order";
  const orderDirection = params.orderDirection || "asc";

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM example_prompts ${where}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(total / pageSize);

  const queryValues = [...values, pageSize, offset];
  const result = await pool.query<ExamplePrompt>(
    `SELECT * FROM example_prompts ${where} 
     ORDER BY ${orderBy} ${orderDirection} 
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    queryValues
  );

  return {
    items: result.rows,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getExamplePromptById(
  id: number
): Promise<ExamplePrompt | null> {
  const result = await pool.query<ExamplePrompt>(
    "SELECT * FROM example_prompts WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function createExamplePrompt(
  data: CreateExamplePromptRequest
): Promise<ExamplePrompt> {
  const result = await pool.query<ExamplePrompt>(
    `INSERT INTO example_prompts (
      category_id, use_case, title, content, description, 
      is_active, display_order, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      data.category_id,
      data.use_case,
      data.title,
      data.content,
      data.description,
      data.is_active ?? true,
      data.display_order ?? 0,
      data.metadata ?? {},
    ]
  );
  return result.rows[0];
}

export async function updateExamplePrompt(
  data: UpdateExamplePromptRequest
): Promise<ExamplePrompt | null> {
  const updates: string[] = [];
  const values: (string | number | boolean | Record<string, unknown> | null)[] =
    [];
  let paramIndex = 1;

  const fields: (keyof CreateExamplePromptRequest)[] = [
    "category_id",
    "use_case",
    "title",
    "content",
    "description",
    "is_active",
    "display_order",
    "metadata",
  ];

  fields.forEach((field) => {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(data[field] ?? null);
      paramIndex++;
    }
  });

  if (updates.length === 0) return null;

  values.push(data.id);
  const result = await pool.query<ExamplePrompt>(
    `UPDATE example_prompts SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteExamplePrompt(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM example_prompts WHERE id = $1", [
    id,
  ]);
  return result.rowCount > 0;
}

// Prompt Usage
export async function createPromptUsage(
  data: CreatePromptUsageRequest
): Promise<PromptUsage> {
  const result = await pool.query<PromptUsage>(
    `INSERT INTO prompt_usage (
      prompt_id, session_id, success_rating, metadata
    ) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.prompt_id, data.session_id, data.success_rating, data.metadata ?? {}]
  );
  return result.rows[0];
}

export async function getPromptUsageStats(promptId: number): Promise<{
  total_uses: number;
  avg_rating: number | null;
}> {
  const result = await pool.query<{
    total_uses: string;
    avg_rating: number | null;
  }>(
    `SELECT 
      COUNT(*) as total_uses,
      AVG(success_rating) as avg_rating
    FROM prompt_usage 
    WHERE prompt_id = $1`,
    [promptId]
  );
  return {
    total_uses: parseInt(result.rows[0].total_uses, 10),
    avg_rating: result.rows[0].avg_rating,
  };
}
