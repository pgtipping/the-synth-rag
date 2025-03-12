import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "../../../../lib/services/document-service";
import pool from "../../../../lib/db";
import { processFile } from "@/src/lib/file-processor";
import { indexDocument } from "@/src/lib/pinecone-index";
import { storage } from "@/src/lib/storage";

// 30 minutes timeout for large files
export const maxDuration = 1800;

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Configure request handling
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const documentService = new DocumentService(pool);

  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    console.log(`Reprocessing document with ID: ${documentId}`);

    // Get the document
    const document = await documentService.getDocument(documentId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update status to processing
    await documentService.updateDocumentStatus(document.id, "processing");

    // Get the file from storage
    const fileBuffer = await storage.retrieve(document.filename);

    // Ensure we have a Buffer
    const buffer = Buffer.isBuffer(fileBuffer)
      ? fileBuffer
      : Buffer.from(
          await new Response(fileBuffer as ReadableStream).arrayBuffer()
        );

    // Create a File object from the buffer
    const file = new File([buffer], document.originalName, {
      type: document.contentType,
    });

    // Process the file to extract text
    const processedContent = await processFile(file, buffer);

    // Index all document chunks in Pinecone
    const vectorIds = [];
    for (let i = 0; i < processedContent.chunks.length; i++) {
      const chunk = processedContent.chunks[i];

      // Save chunk to database
      await documentService.saveDocumentChunks(document.id, [
        {
          text: chunk.text,
          index: i,
          tokens: chunk.tokens,
        },
      ]);

      // Index in Pinecone
      const vectorId = await indexDocument(chunk.text, {
        documentId: document.id,
        chunkIndex: i,
        originalName: document.originalName,
        mimeType: document.contentType,
        processedAt: new Date().toISOString(),
        text: chunk.text,
      });

      // Update vector ID in database
      await documentService.updateChunkVectorId(document.id, i, vectorId);

      vectorIds.push(vectorId);
    }

    // Update status to indexed
    await documentService.updateDocumentStatus(document.id, "indexed");

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        status: "indexed",
        vectorIds,
      },
    });
  } catch (error) {
    console.error("Reprocessing error:", error);

    return NextResponse.json(
      {
        error: "Reprocessing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
