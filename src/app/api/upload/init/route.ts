import { NextResponse } from "next/server";
import redis from "@/src/lib/redis";
import crypto from "crypto";

interface UploadMetadata {
  totalChunks: number;
  receivedChunks: number;
  failedChunks: number;
  status: string;
  fileSize: number;
  fileName: string;
  contentType: string;
  createdAt: number;
}

export async function POST(req: Request) {
  try {
    const { totalChunks, fileSize, fileName, contentType } = await req.json();
    const uploadId = `upload:${crypto.randomUUID()}`;

    const metadata: UploadMetadata = {
      totalChunks,
      receivedChunks: 0,
      failedChunks: 0,
      status: "uploading",
      fileSize,
      fileName,
      contentType,
      createdAt: Date.now(),
    };

    // Convert metadata to Record<string, string> for Redis
    const redisMetadata = Object.entries(metadata).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: String(value),
      }),
      {} as Record<string, string>
    );

    // Initialize upload session in Redis
    await redis
      .multi()
      .hset(uploadId, redisMetadata)
      .expire(uploadId, 86400) // 24-hour TTL
      .exec();

    return NextResponse.json({
      uploadId,
      endpoint: `/api/upload/chunk`,
    });
  } catch (error) {
    console.error("Upload initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize upload" },
      { status: 500 }
    );
  }
}
