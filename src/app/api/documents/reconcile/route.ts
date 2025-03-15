import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { indexDocument } from "../../../../lib/pinecone-index";
import { Pinecone } from "@pinecone-database/pinecone";
import { storage } from "../../../../lib/storage";
import { processFile } from "../../../../lib/file-processor";

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
  storage_url: string;
}

interface ChunkRow {
  id: number;
  document_id: number;
  chunk_index: number;
  text_content: string;
  vector_id: string | null;
}

// Status endpoint to check reconciliation progress
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

    const client = await pool.connect();
    try {
      // Get document status
      const result = await client.query<DocumentRow>(
        `SELECT id, status, error_message FROM documents WHERE id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      const document = result.rows[0];

      // Get reconciliation progress
      const chunksResult = await client.query<{
        total: number;
        reconciled: number;
      }>(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN vector_id IS NOT NULL THEN 1 END) as reconciled
        FROM document_chunks 
        WHERE document_id = $1`,
        [documentId]
      );

      const progress = chunksResult.rows[0];
      const progressPercentage =
        progress.total > 0
          ? Math.round((progress.reconciled / progress.total) * 100)
          : 100;

      return NextResponse.json({
        documentId: parseInt(documentId),
        status: document.status,
        errorMessage: document.error_message,
        progress: {
          total: progress.total,
          reconciled: progress.reconciled,
          percentage: progressPercentage,
        },
        isComplete: document.status === "indexed",
        isFailed: document.status === "failed",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error checking reconciliation status:", error);
    return NextResponse.json(
      { error: "Failed to check reconciliation status" },
      { status: 500 }
    );
  }
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

    // Update document status to processing before starting reconciliation
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE documents SET status = 'processing', error_message = NULL WHERE id = $1`,
        [documentId]
      );
    } finally {
      client.release();
    }

    // Start reconciliation process asynchronously
    reconcileDocumentChunks(documentId).catch(async (error: Error) => {
      console.error(`Error reconciling document ${documentId}:`, error);

      // Update document status to failed
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE documents SET status = 'failed', error_message = $1 WHERE id = $2`,
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
      documentId,
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
 * Also verifies that vectors exist in Pinecone and fixes any inconsistencies
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

    // If document has no chunks, we need to reprocess it from scratch
    if (chunksResult.rows.length === 0) {
      console.log(
        `Document ${documentId} has no chunks, reprocessing from scratch`
      );

      // Update document status to processing
      await client.query(
        `UPDATE documents SET status = 'processing', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [documentId]
      );

      // Get the file from storage
      try {
        // Extract filename from storage_url
        const filename = document.storage_url.split("/").pop();
        if (!filename) {
          throw new Error(`Invalid storage URL for document ${documentId}`);
        }

        // Get the file from storage
        const fileBuffer = await storage.retrieve(filename);

        // Ensure we have a Buffer
        const buffer = Buffer.isBuffer(fileBuffer)
          ? fileBuffer
          : Buffer.from(
              await new Response(fileBuffer as ReadableStream).arrayBuffer()
            );

        // Create a File object from the buffer
        const file = new File(
          [buffer],
          document.original_name || "unknown_file",
          {
            type: document.content_type || "application/octet-stream",
          }
        );

        // Process the file to extract text
        const processedContent = await processFile(file, buffer);

        // Index all document chunks in Pinecone
        for (let i = 0; i < processedContent.chunks.length; i++) {
          const chunk = processedContent.chunks[i];

          // Save chunk to database
          await client.query(
            `INSERT INTO document_chunks (document_id, chunk_index, text_content, token_count)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (document_id, chunk_index)
             DO UPDATE SET text_content = $3, token_count = $4`,
            [documentId, i, chunk.text, chunk.tokens]
          );

          // Index in Pinecone
          const vectorId = await indexDocument(chunk.text, {
            documentId: document.id,
            chunkIndex: i,
            originalName: document.original_name,
            mimeType: document.content_type,
            processedAt: new Date().toISOString(),
            text: chunk.text,
          });

          // Update vector ID in database
          await client.query(
            `UPDATE document_chunks SET vector_id = $1 WHERE document_id = $2 AND chunk_index = $3`,
            [vectorId, documentId, i]
          );
        }

        // Update document status to indexed
        await client.query(
          `UPDATE documents SET status = 'indexed', indexed_at = CURRENT_TIMESTAMP, error_message = NULL WHERE id = $1`,
          [documentId]
        );

        console.log(
          `Successfully reprocessed document ${documentId} from scratch`
        );
        return;
      } catch (error) {
        console.error(
          `Error reprocessing document ${documentId} from scratch:`,
          error
        );
        throw new Error(
          `Failed to reprocess document: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Check for chunks without vector IDs
    const chunksWithoutVectors = chunksResult.rows.filter(
      (row) => !row.vector_id
    );

    // Get chunks with vector IDs to verify they exist in Pinecone
    const chunksWithVectors = chunksResult.rows.filter(
      (row) => !!row.vector_id
    );

    console.log(
      `Document ${documentId} reconciliation: ${chunksWithoutVectors.length} chunks without vector IDs, ${chunksWithVectors.length} chunks with vector IDs`
    );

    // Update document status to processing
    await client.query(
      `UPDATE documents SET status = 'processing', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [documentId]
    );

    // Step 1: Reindex chunks without vector IDs
    if (chunksWithoutVectors.length > 0) {
      console.log(
        `Reindexing ${chunksWithoutVectors.length} chunks without vector IDs for document ${documentId}`
      );

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
    }

    // Step 2: Verify vectors exist in Pinecone and fix any inconsistencies
    if (chunksWithVectors.length > 0) {
      console.log(`Verifying ${chunksWithVectors.length} vectors in Pinecone`);

      const index = pinecone.index(process.env.PINECONE_INDEX as string);
      const vectorIds = chunksWithVectors.map((row) => row.vector_id as string);

      // Fetch vectors from Pinecone in batches of 100 (Pinecone limit)
      const batchSize = 100;
      const missingVectorIds: string[] = [];

      for (let i = 0; i < vectorIds.length; i += batchSize) {
        const batchIds = vectorIds.slice(i, i + batchSize);
        const fetchResponse = await index.fetch(batchIds);

        // Check which vectors are missing
        const fetchedIds = Object.keys(fetchResponse.records || {});
        const batchMissingIds = batchIds.filter(
          (id) => !fetchedIds.includes(id)
        );

        missingVectorIds.push(...batchMissingIds);
      }

      // Reindex missing vectors
      if (missingVectorIds.length > 0) {
        console.log(
          `Found ${missingVectorIds.length} vectors missing from Pinecone`
        );

        for (const vectorId of missingVectorIds) {
          // Find the chunk with this vector ID
          const chunk = chunksWithVectors.find((c) => c.vector_id === vectorId);
          if (chunk) {
            console.log(
              `Reindexing missing vector ${vectorId} for chunk ${chunk.id}`
            );

            // Reindex in Pinecone
            const newVectorId = await indexDocument(chunk.text_content, {
              documentId: document.id,
              chunkIndex: chunk.chunk_index,
              originalName: document.original_name,
              mimeType: document.content_type,
              processedAt: new Date().toISOString(),
              text: chunk.text_content,
            });

            // Update vector ID in database if it changed
            if (newVectorId !== vectorId) {
              await client.query(
                `UPDATE document_chunks SET vector_id = $1 WHERE id = $2`,
                [newVectorId, chunk.id]
              );
              console.log(
                `Updated vector ID from ${vectorId} to ${newVectorId} for chunk ${chunk.id}`
              );
            }
          }
        }
      } else {
        console.log(`All vectors exist in Pinecone for document ${documentId}`);
      }
    }

    // Update document status to indexed
    await client.query(
      `UPDATE documents SET status = 'indexed', indexed_at = CURRENT_TIMESTAMP, error_message = NULL WHERE id = $1`,
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
