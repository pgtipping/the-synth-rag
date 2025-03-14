import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { indexDocument } from "../../../../lib/pinecone-index";

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

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Start reconciliation process asynchronously
    reconcileDocumentChunks(documentId).catch(async (error: Error) => {
      console.error(`Error reconciling document ${documentId}:`, error);

      // Update document status to failed
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE documents SET error_message = $1 WHERE id = $2`,
          [error.message || "Unknown error during reconciliation", documentId]
        );
      } catch (dbError) {
        console.error("Error updating document error message:", dbError);
      } finally {
        client.release();
      }
    });

    return NextResponse.json({
      success: true,
      message: "Document reconciliation started",
    });
  } catch (error) {
    console.error("Error starting document reconciliation:", error);
    return NextResponse.json(
      { error: "Failed to start document reconciliation" },
      { status: 500 }
    );
  }
}

/**
 * Reconciles document chunks by checking for missing vector IDs and reindexing them
 */
async function reconcileDocumentChunks(documentId: number): Promise<void> {
  const client = await pool.connect();
  try {
    // Get document info
    const documentResult = await client.query<DocumentRow>(
      `SELECT * FROM documents WHERE id = $1`,
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      throw new Error(`Document with ID ${documentId} not found`);
    }

    const document = documentResult.rows[0];

    // Get all chunks for the document
    const chunksResult = await client.query<ChunkRow>(
      `SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index`,
      [documentId]
    );

    // Check for chunks without vector IDs
    const chunksWithoutVectors = chunksResult.rows.filter(
      (row) => !row.vector_id
    );

    if (chunksWithoutVectors.length === 0) {
      console.log(`Document ${documentId} has no chunks missing vector IDs`);
      return;
    }

    console.log(
      `Found ${chunksWithoutVectors.length} chunks without vector IDs for document ${documentId}`
    );

    // Update document status to processing
    await client.query(
      `UPDATE documents SET status = 'processing' WHERE id = $1`,
      [documentId]
    );

    // Reindex chunks without vector IDs
    for (const chunk of chunksWithoutVectors) {
      // Index in Pinecone
      const vectorId = await indexDocument(chunk.text_content, {
        documentId: document.id,
        chunkIndex: chunk.chunk_index,
        originalName: document.original_name,
        mimeType: document.content_type,
        processedAt: new Date().toISOString(),
        text: chunk.text_content,
      });

      // Update vector ID in database
      await client.query(
        `UPDATE document_chunks SET vector_id = $1 WHERE id = $2`,
        [vectorId, chunk.id]
      );

      console.log(`Reindexed chunk ${chunk.id} with vector ID ${vectorId}`);
    }

    // Update document status to indexed
    await client.query(
      `UPDATE documents SET status = 'indexed', error_message = NULL WHERE id = $1`,
      [documentId]
    );

    console.log(`Successfully reconciled document ${documentId}`);
  } catch (error) {
    console.error(`Error reconciling document ${documentId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}
