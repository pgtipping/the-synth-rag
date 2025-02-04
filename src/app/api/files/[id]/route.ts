import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../lib/storage";
import { DocumentService } from "../../../../lib/services/document-service";
import pool from "../../../../lib/db";
import { Readable } from "stream";

// 10 minutes timeout for downloads
export const maxDuration = 600;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  let downloadProgress = 0;
  let totalSize = 0;

  try {
    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        reject(new Error("Download timeout"));
      }, maxDuration * 1000);
    });

    // Start the download
    const downloadPromise = storage.retrieve(id, {
      asStream: true,
      onProgress: (bytesDownloaded: number) => {
        downloadProgress = bytesDownloaded;
      },
    });

    // Wait for download or timeout
    const stream = (await Promise.race([
      downloadPromise,
      timeoutPromise,
    ])) as Readable;

    // Get file metadata from database
    const documentService = new DocumentService(pool);
    const document = await documentService.getDocument(parseInt(id));

    if (!document) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    totalSize = document.sizeBytes;

    // Create response with proper headers
    const response = new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": document.contentType,
        "Content-Disposition": `attachment; filename="${document.originalName}"`,
        "Content-Length": totalSize.toString(),
        "Cache-Control":
          process.env.NODE_ENV === "production"
            ? "public, max-age=31536000" // 1 year for production
            : "no-cache", // No cache for development
      },
    });

    return response;
  } catch (error) {
    console.error("Download error:", error);

    // Determine error type and return appropriate response
    if (error instanceof Error) {
      if (error.message === "Download timeout") {
        return NextResponse.json(
          {
            error: "Download timeout",
            progress: downloadProgress,
            totalSize,
          },
          { status: 408 }
        );
      }

      if (error.message === "File not found") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    return NextResponse.json(
      {
        error: "Download failed",
        details: error instanceof Error ? error.message : "Unknown error",
        progress: downloadProgress,
        totalSize,
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
