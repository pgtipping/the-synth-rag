import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getPromptCategoryById,
  updatePromptCategory,
  deletePromptCategory,
} from "../../../../../lib/db/prompts";
import { ApiResponse, PromptCategory } from "../../../../../lib/types/prompts";

// Validation schema for updating a category
const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<PromptCategory | null>>> {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const category = await getPromptCategoryById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching prompt category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prompt category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<PromptCategory | null>>> {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateCategorySchema.safeParse(body);
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

    const category = await updatePromptCategory({ id, ...validatedData.data });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating prompt category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update prompt category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const success = await deletePromptCategory(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting prompt category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete prompt category" },
      { status: 500 }
    );
  }
}
