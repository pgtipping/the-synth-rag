import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { fileQueue } from "@/lib/queue";
import { FileAssembler } from "@/lib/file-assembler";
import Busboy from "busboy";
import { Readable } from "stream";
import fs from "node:fs/promises";
import { ReadableStream as WebReadableStream } from "stream/web";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

const validateFile = (file: File): FileValidationResult => {
  const maxSize = 100 * 1024 * 1024; // 100MB
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
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  const isChunkedUpload = contentType.includes("multipart/form-data");

  if (isChunkedUpload) {
    return handleChunkedUpload(request);
  }

  return handleRegularUpload(request);
}

async function handleRegularUpload(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const useCase = formData.get("useCase") as string;

  if (!file || !useCase) {
    return NextResponse.json(
      { error: "Missing file or use case" },
      { status: 400 }
    );
  }

  const validation = validateFile(file);
  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = await put(file.name, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      cacheControlMaxAge: 86400,
    });

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

async function handleChunkedUpload(request: Request) {
  const busboy = Busboy({
    headers: Object.fromEntries(request.headers.entries()),
  });
  const fileId = FileAssembler.generateFileId();
  let assembler: FileAssembler | null = null;

  return new Promise<NextResponse>((resolve) => {
    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const metadata = {
        totalChunks: parseInt(request.headers.get("x-total-chunks") || "1"),
        chunkNumber: parseInt(request.headers.get("x-chunk-number") || "0"),
        originalName: filename,
        mimeType,
        fileId,
      };

      assembler = new FileAssembler(metadata);

      const chunks: Buffer[] = [];
      file.on("data", (chunk) => {
        chunks.push(chunk);
      });

      file.on("end", async () => {
        try {
          await assembler!.addChunk(
            metadata.chunkNumber,
            Buffer.concat(chunks)
          );

          if (metadata.chunkNumber === metadata.totalChunks - 1) {
            const { filePath } = await assembler!.assemble();
            const file = new File([await fs.readFile(filePath)], filename, {
              type: mimeType,
            });

            const validation = validateFile(file);
            if (!validation.isValid) {
              throw new Error(validation.error);
            }

            const blob = await put(filename, await fs.readFile(filePath), {
              access: "public",
              token: process.env.BLOB_READ_WRITE_TOKEN,
              cacheControlMaxAge: 86400,
            });

            await fileQueue.add("process-file", {
              file,
              useCase: request.headers.get("x-use-case") || "default",
              blobUrl: blob.url,
            });

            resolve(
              NextResponse.json({
                message: "File upload completed successfully",
                blobUrl: blob.url,
              })
            );
          } else {
            resolve(
              NextResponse.json({
                message: "Chunk received successfully",
                chunkNumber: metadata.chunkNumber,
              })
            );
          }
        } catch (error) {
          console.error("Chunked upload failed:", error);
          await assembler?.cleanup();
          resolve(
            NextResponse.json(
              { error: "File processing failed. Please try again later." },
              { status: 500 }
            )
          );
        }
      });
    });

    busboy.on("error", async (error) => {
      console.error("Busboy error:", error);
      await assembler?.cleanup();
      resolve(
        NextResponse.json(
          { error: "File processing failed. Please try again later." },
          { status: 500 }
        )
      );
    });

    if (request.body instanceof WebReadableStream) {
      const readable = Readable.fromWeb(request.body);
      readable.pipe(busboy);
    }
  });
}
