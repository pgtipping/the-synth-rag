import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPromptCategories,
  createPromptCategory,
} from "../../../../lib/db/prompts";
import { ApiResponse, PromptCategory } from "../../../../lib/types/prompts";

// Validation schema for creating a category
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export async function GET(): Promise<
  NextResponse<ApiResponse<PromptCategory[]>>
> {
  try {
    const categories = await getPromptCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching prompt categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prompt categories" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PromptCategory>>> {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createCategorySchema.safeParse(body);
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

    const category = await createPromptCategory(validatedData.data);
    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating prompt category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create prompt category" },
      { status: 500 }
    );
  }
}
