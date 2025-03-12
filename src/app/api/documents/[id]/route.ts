import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { useCase } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    if (!useCase) {
      return NextResponse.json(
        { error: "Use case is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Update document use case
      const result = await client.query(
        "UPDATE documents SET use_case = $1 WHERE id = $2 RETURNING id, use_case",
        [useCase, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating document use case:", error);
    return NextResponse.json(
      { error: "Failed to update document use case" },
      { status: 500 }
    );
  }
}
