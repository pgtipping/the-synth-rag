import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import { processFile } from "../../../../lib/file-processor";
import { storage } from "../../../../lib/storage";
import { indexDocument } from "../../../../lib/pinecone-index";

// 30 minutes timeout for large files
export const maxDuration = 1800;

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Configure request handling
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get the document from the database
    const document = await db.query(`SELECT * FROM documents WHERE id = $1`, [
      documentId,
    ]);

    if (!document.rows.length) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const doc = document.rows[0] as {
      id: number;
      filename: string;
      original_name: string;
      content_type: string;
    };

    // Update document status to processing
    await db.query(
      `UPDATE documents SET status = 'processing', error_message = NULL WHERE id = $1`,
      [documentId]
    );

    // Start processing the document asynchronously
    // We don't await this to allow the API to return immediately
    processDocumentAsync(doc).catch(async (error: Error) => {
      console.error(`Error processing document ${documentId}:`, error);

      // Update document status to failed
      await db.query(
        `UPDATE documents SET status = 'failed', error_message = $1 WHERE id = $2`,
        [error.message || "Unknown error", documentId]
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reprocessing document:", error);
    return NextResponse.json(
      { error: "Failed to reprocess document" },
      { status: 500 }
    );
  }
}

// Helper function to process a document asynchronously
async function processDocumentAsync(doc: {
  id: number;
  filename: string;
  original_name: string;
  content_type: string;
}): Promise<void> {
  try {
    // Get the file from storage
    const fileBuffer = await storage.retrieve(doc.filename);

    // Ensure we have a Buffer
    const buffer = Buffer.isBuffer(fileBuffer)
      ? fileBuffer
      : Buffer.from(
          await new Response(fileBuffer as ReadableStream).arrayBuffer()
        );

    // Create a File object from the buffer
    const file = new File([buffer], doc.original_name || "unknown_file", {
      type: doc.content_type || "application/octet-stream",
    });

    // Process the file to extract text
    const processedContent = await processFile(file, buffer);

    // Index all document chunks in Pinecone
    const vectorIds = [];
    for (let i = 0; i < processedContent.chunks.length; i++) {
      const chunk = processedContent.chunks[i];

      // Save chunk to database
      await db.query(
        `INSERT INTO document_chunks (document_id, text_content, chunk_index, token_count)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (document_id, chunk_index)
         DO UPDATE SET text_content = $2, token_count = $4`,
        [doc.id, chunk.text, i, chunk.tokens]
      );

      // Index in Pinecone
      const vectorId = await indexDocument(chunk.text, {
        documentId: doc.id,
        chunkIndex: i,
        originalName: doc.original_name,
        mimeType: doc.content_type,
        processedAt: new Date().toISOString(),
        text: chunk.text,
      });

      // Update vector ID in database
      await db.query(
        `UPDATE document_chunks SET vector_id = $1
         WHERE document_id = $2 AND chunk_index = $3`,
        [vectorId, doc.id, i]
      );

      vectorIds.push(vectorId);
    }

    // Update status to indexed
    await db.query(`UPDATE documents SET status = 'indexed' WHERE id = $1`, [
      doc.id,
    ]);

    console.log(`Document ${doc.id} successfully processed and indexed`);
  } catch (error) {
    console.error(`Error processing document ${doc.id}:`, error);
    throw error;
  }
}
