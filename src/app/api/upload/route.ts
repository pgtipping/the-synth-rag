import { NextRequest } from "next/server";
import { DocumentService } from "../../../lib/services/document-service";
import pool from "../../../lib/db";
import { processFile } from "@/src/lib/file-processor";
import { indexDocument } from "@/src/lib/pinecone-index";

// 30 minutes timeout for large files
export const maxDuration = 1800;

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Configure request handling
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  // Verify request size
  const contentLength = parseInt(
    request.headers.get("content-length") || "0",
    10
  );
  if (contentLength > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({
        error: "File size exceeds maximum limit",
        details: `Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      }),
      {
        status: 413,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.log("Upload endpoint hit:", request.url);
  let file: File | null = null;
  const documentService = new DocumentService(pool);

  try {
    let formData;
    try {
      formData = await request.formData();
      console.log("Form data received:", {
        fields: Array.from(formData.entries()).map(([key]) => key),
      });
    } catch (error) {
      console.error("Failed to parse form data:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to parse form data",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: "File size exceeds maximum limit",
          details: `Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Process file using Web APIs
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create document record
    const document = await documentService.createDocument({
      originalName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      buffer,
    });

    // Update status to processing
    await documentService.updateDocumentStatus(document.id, "processing");

    // Process the file to extract text
    const processedContent = await processFile(file, buffer);

    // Save document chunks to database
    await documentService.saveDocumentChunks(
      document.id,
      processedContent.chunks.map((chunk, index) => ({
        text: chunk.text,
        index,
        tokens: chunk.tokens,
      }))
    );

    // Index all document chunks in Pinecone
    const vectorIds = [];
    for (let i = 0; i < processedContent.chunks.length; i++) {
      const chunk = processedContent.chunks[i];
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

    return new Response(
      JSON.stringify({
        success: true,
        document: {
          ...document,
          status: "indexed",
          vectorIds,
        },
        url: document.storageUrl,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload error:", error);

    // Handle document update on failure
    if (
      error instanceof Error &&
      typeof error === "object" &&
      error !== null &&
      "id" in error &&
      typeof (error as { id: number }).id === "number"
    ) {
      try {
        await documentService.updateDocumentStatus(
          (error as { id: number }).id,
          "failed",
          error.message
        );
      } catch (updateError) {
        console.error("Failed to update document status:", updateError);
      }
    }

    // Handle timeout error
    if (error instanceof Error && error.message === "Upload timeout") {
      return new Response(
        JSON.stringify({
          error: "Upload timeout",
          totalSize: file?.size,
        }),
        {
          status: 408,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
        totalSize: file?.size,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    try {
      await pool.end();
    } catch (error) {
      console.error("Failed to close database connection:", error);
    }
  }
}
