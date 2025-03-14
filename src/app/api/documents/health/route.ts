import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});

interface DocumentRow {
  id: number;
  original_name: string;
  content_type: string;
  status: string;
  error_message: string | null;
}

interface ChunkRow {
  id: number;
  document_id: number;
  chunk_index: number;
  text_content: string;
  vector_id: string | null;
}

interface HealthCheckResult {
  documentId: number;
  documentName: string;
  status: "healthy" | "unhealthy";
  issues: string[];
  details: {
    totalChunks: number;
    chunksWithVectors: number;
    chunksWithoutVectors: number;
    vectorsInPinecone: number;
    missingVectors: string[];
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const result = await checkDocumentHealth(parseInt(documentId, 10));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking document health:", error);
    return NextResponse.json(
      { error: "Failed to check document health" },
      { status: 500 }
    );
  }
}

/**
 * Checks the health of a document by verifying its chunks and vectors
 */
async function checkDocumentHealth(
  documentId: number
): Promise<HealthCheckResult> {
  const client = await pool.connect();
  try {
    // Get document info
    const documentResult = await client.query<DocumentRow>(
      `SELECT * FROM documents WHERE id = $1`,
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      return {
        documentId,
        documentName: "Unknown",
        status: "unhealthy",
        issues: ["Document not found"],
        details: {
          totalChunks: 0,
          chunksWithVectors: 0,
          chunksWithoutVectors: 0,
          vectorsInPinecone: 0,
          missingVectors: [],
        },
      };
    }

    const document = documentResult.rows[0];
    const issues: string[] = [];

    // Check document status
    if (document.status !== "indexed") {
      issues.push(`Document status is ${document.status}, not indexed`);
    }

    if (document.error_message) {
      issues.push(`Document has error: ${document.error_message}`);
    }

    // Get all chunks for the document
    const chunksResult = await client.query<ChunkRow>(
      `SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index`,
      [documentId]
    );

    if (chunksResult.rows.length === 0) {
      issues.push("Document has no chunks");
      return {
        documentId,
        documentName: document.original_name,
        status: "unhealthy",
        issues,
        details: {
          totalChunks: 0,
          chunksWithVectors: 0,
          chunksWithoutVectors: 0,
          vectorsInPinecone: 0,
          missingVectors: [],
        },
      };
    }

    // Check for chunks without vector IDs
    const chunksWithoutVectors = chunksResult.rows.filter(
      (row) => !row.vector_id
    );
    const chunksWithVectors = chunksResult.rows.filter(
      (row) => !!row.vector_id
    );

    if (chunksWithoutVectors.length > 0) {
      issues.push(`${chunksWithoutVectors.length} chunks without vector IDs`);
    }

    // Check if vectors exist in Pinecone
    const vectorIds = chunksWithVectors.map((row) => row.vector_id as string);
    let vectorsInPinecone: string[] = [];
    let missingVectors: string[] = [];

    if (vectorIds.length > 0) {
      try {
        const index = pinecone.index(process.env.PINECONE_INDEX as string);
        const fetchResponse = await index.fetch(vectorIds);

        vectorsInPinecone = Object.keys(fetchResponse.records || {});
        missingVectors = vectorIds.filter(
          (id) => !vectorsInPinecone.includes(id)
        );

        if (missingVectors.length > 0) {
          issues.push(`${missingVectors.length} vectors missing from Pinecone`);
        }
      } catch (error) {
        console.error("Error fetching vectors from Pinecone:", error);
        issues.push("Failed to verify vectors in Pinecone");
      }
    }

    return {
      documentId,
      documentName: document.original_name,
      status: issues.length === 0 ? "healthy" : "unhealthy",
      issues,
      details: {
        totalChunks: chunksResult.rows.length,
        chunksWithVectors: chunksWithVectors.length,
        chunksWithoutVectors: chunksWithoutVectors.length,
        vectorsInPinecone: vectorsInPinecone.length,
        missingVectors,
      },
    };
  } catch (error) {
    console.error(`Error checking document health for ${documentId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}
