import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import redis from "@/src/lib/redis";
import crypto from "crypto";

// Supported MIME types and their extensions
const SUPPORTED_MIME_TYPES = new Set([
  // Documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",

  // Presentations
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",

  // Spreadsheets
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",

  // Plain text
  "text/plain",
]);

export async function POST(req: Request) {
  try {
    const uploadId = req.headers.get("upload-id");
    const chunkIndex = req.headers.get("chunk-index");
    const chunkHash = req.headers.get("chunk-hash");
    const contentType = req.headers.get("content-type");

    if (!uploadId || !chunkIndex || !chunkHash) {
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!contentType || !SUPPORTED_MIME_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    const buffer = await req.arrayBuffer();
    const chunk = Buffer.from(buffer);

    // Validate chunk integrity
    const computedHash = crypto
      .createHash("sha256")
      .update(chunk)
      .digest("hex");

    if (computedHash !== chunkHash) {
      await redis.hincrby(uploadId, "failedChunks", 1);
      return NextResponse.json(
        { error: "Chunk integrity check failed" },
        { status: 400 }
      );
    }

    // Store chunk in temporary directory
    const chunkPath = join(tmpdir(), `${uploadId}-${chunkIndex}`);
    await writeFile(chunkPath, chunk);

    // Update progress in Redis
    await redis
      .multi()
      .hincrby(uploadId, "receivedChunks", 1)
      .sadd(`${uploadId}:chunks_received`, chunkIndex)
      .exec();

    // Get current progress
    const [totalChunks, receivedChunks] = await Promise.all([
      redis.hget(uploadId, "totalChunks"),
      redis.hget(uploadId, "receivedChunks"),
    ]);

    // Check if upload is complete
    if (Number(receivedChunks) === Number(totalChunks)) {
      await redis.hset(uploadId, { status: "assembling" });
      // Trigger assembly process
      await fetch(`/api/upload/assemble/${uploadId}`, {
        method: "POST",
      });
    }

    return NextResponse.json({
      success: true,
      progress: {
        total: Number(totalChunks),
        received: Number(receivedChunks),
      },
    });
  } catch (error) {
    console.error("Chunk upload error:", error);
    return NextResponse.json(
      { error: "Failed to process chunk" },
      { status: 500 }
    );
  }
}
