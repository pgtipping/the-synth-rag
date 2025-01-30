import { NextResponse, NextRequest } from "next/server";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import redis from "@/src/lib/redis";
import { put } from "@vercel/blob";

// File type processors
const processPlainText = (buffer: Buffer): Buffer => buffer;

const processCSV = (buffer: Buffer): Buffer => {
  // Remove BOM if present
  return buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf
    ? buffer.slice(3)
    : buffer;
};

const processOfficeDocument = (buffer: Buffer): Buffer => {
  return buffer;
};

type RouteParams = {
  params: {
    uploadId: string;
    [key: string]: string | string[]; // Matches Next.js dynamic route type
  };
};

type UploadMeta = {
  totalChunks: string;
  fileName: string;
  receivedChunks: string;
  contentType?: string;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { uploadId } = params;

    // Get upload metadata with explicit type casting
    const uploadData = (await redis.hgetall(uploadId)) as Partial<UploadMeta>;

    if (!uploadData) {
      return NextResponse.json(
        { error: "Upload session not found" },
        { status: 404 }
      );
    }

    const receivedChunks = await redis.smembers(`${uploadId}:chunks_received`);

    if (!uploadData.totalChunks || !uploadData.fileName) {
      return NextResponse.json(
        { error: "Invalid upload metadata" },
        { status: 400 }
      );
    }

    if (Number(uploadData.receivedChunks) !== Number(uploadData.totalChunks)) {
      return NextResponse.json(
        { error: "Not all chunks received" },
        { status: 400 }
      );
    }

    // Sort chunks by index
    const sortedChunks = receivedChunks
      .map(Number)
      .sort((a: number, b: number) => a - b);

    // Read all chunks
    const chunkBuffers = await Promise.all(
      sortedChunks.map(async (index: number) => {
        const chunkPath = join(tmpdir(), `${uploadId}-${index}`);
        return readFile(chunkPath);
      })
    );

    // Combine chunks
    const finalBuffer = Buffer.concat(chunkBuffers);

    // Process based on file type
    const contentType = uploadData.contentType || "application/octet-stream";
    let processedBuffer: Buffer;

    switch (contentType) {
      case "text/plain":
        processedBuffer = processPlainText(finalBuffer);
        break;
      case "text/csv":
        processedBuffer = processCSV(finalBuffer);
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      case "application/vnd.ms-powerpoint":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      case "application/vnd.ms-excel":
        processedBuffer = processOfficeDocument(finalBuffer);
        break;
      default:
        processedBuffer = finalBuffer;
    }

    // Upload to Vercel Blob with explicit response typing
    const options = {
      access: "public" as const,
      contentType: contentType as string,
    };

    const { url } = (await put(
      uploadData.fileName,
      processedBuffer,
      options
    )) as { url: string };

    // Clean up chunks
    await Promise.all([
      ...sortedChunks.map((index: number) =>
        unlink(join(tmpdir(), `${uploadId}-${index}`))
      ),
      redis.del(uploadId),
      redis.del(`${uploadId}:chunks_received`),
    ]);

    return NextResponse.json({
      success: true,
      url,
      fileName: uploadData.fileName,
      size: processedBuffer.length,
      contentType,
    });
  } catch (error) {
    console.error("File assembly error:", error);
    return NextResponse.json(
      { error: "Failed to assemble file" },
      { status: 500 }
    );
  }
}
