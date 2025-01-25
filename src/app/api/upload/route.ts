import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { fileQueue } from "@/lib/queue";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

const validateFile = (file: File): FileValidationResult => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "application/pdf",
    "text/csv",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported`,
    };
  }

  return { isValid: true };
};

export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const useCase = formData.get("useCase") as string;

  if (!file || !useCase) {
    return NextResponse.json(
      { error: "Missing file or use case" },
      { status: 400 }
    );
  }

  // Validate file before processing
  const validation = validateFile(file);
  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    // Store file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(file.name, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      cacheControlMaxAge: 86400, // 24h in seconds
    });

    // Enqueue processing job
    await fileQueue.add("process-file", {
      file,
      useCase,
      blobUrl: blob.url,
    });

    return NextResponse.json({
      message:
        "File upload accepted. Processing will continue in the background.",
      blobUrl: blob.url,
    });
  } catch (error) {
    console.error("Upload failed:", {
      error,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      useCase,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "File processing failed. Please try again later." },
      { status: 500 }
    );
  }
}
