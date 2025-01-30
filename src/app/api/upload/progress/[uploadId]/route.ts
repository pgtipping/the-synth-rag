import { NextResponse } from "next/server";
import redis from "@/src/lib/redis";

type UploadProgress = {
  [key: string]: string;
  totalChunks: string;
  receivedChunks: string;
  failedChunks: string;
  status: string;
  fileName: string;
};

function isValidUploadProgress(
  obj: Record<string, unknown>
): obj is UploadProgress {
  return (
    typeof obj.totalChunks === "string" &&
    typeof obj.receivedChunks === "string" &&
    typeof obj.failedChunks === "string" &&
    typeof obj.status === "string" &&
    typeof obj.fileName === "string"
  );
}

export async function GET(
  req: Request,
  { params }: { params: { uploadId: string } }
) {
  try {
    const { uploadId } = params;

    // Get upload progress from Redis
    const [progress, receivedChunks] = await Promise.all([
      redis.hgetall(uploadId),
      redis.smembers(`${uploadId}:chunks_received`),
    ]);

    // Check if upload exists and has valid structure
    if (!progress || !isValidUploadProgress(progress)) {
      return NextResponse.json(
        { error: "Upload session not found or invalid" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...progress,
      receivedChunks: receivedChunks.map(Number),
      percentage: Math.round(
        (Number(progress.receivedChunks) / Number(progress.totalChunks)) * 100
      ),
    });
  } catch (error) {
    console.error("Progress tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
