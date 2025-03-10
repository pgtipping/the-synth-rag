import { NextRequest, NextResponse } from "next/server";
import pool from "../../../lib/db";
import { Pinecone } from "@pinecone-database/pinecone";

interface DocumentRow {
  id: number;
  original_name: string;
  content_type: string;
  size_bytes: number;
  status: string;
  created_at: Date;
  error_message: string | null;
  use_case: string;
}

interface DocumentChunkRow {
  vector_id: string;
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const useCase = searchParams.get("useCase");

    const client = await pool.connect();
    try {
      let query = `
        SELECT id, original_name, content_type, size_bytes, status, created_at, error_message, use_case
        FROM documents
        WHERE status != 'failed'
      `;
      const params: string[] = [];

      if (useCase) {
        query += " AND use_case = $1";
        params.push(useCase);
      }

      query += " ORDER BY created_at DESC";

      const result = await client.query<DocumentRow>(query, params);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Start transaction
      await client.query("BEGIN");

      // Get vector IDs for the document
      const vectorResult = await client.query<DocumentChunkRow>(
        "SELECT vector_id FROM document_chunks WHERE document_id = $1",
        [id]
      );

      // Delete vectors from Pinecone
      if (vectorResult.rows.length > 0) {
        const index = pinecone.index(process.env.PINECONE_INDEX!);
        const vectorIds = vectorResult.rows.map((row) => row.vector_id);
        await index.deleteMany(vectorIds);
      }

      // Delete document from database
      await client.query("DELETE FROM documents WHERE id = $1", [id]);

      // Commit transaction
      await client.query("COMMIT");

      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
