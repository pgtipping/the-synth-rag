import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { processFile } from "./file-processor";
import { Pinecone } from "@pinecone-database/pinecone";
import { put } from "@vercel/blob";

type JobData =
  | {
      type: "file-processing";
      payload: {
        file: File;
        useCase: string;
      };
      delay?: number;
    }
  | {
      type: "file-deletion";
      payload: {
        fileId: string;
      };
      delay?: number;
    }
  | {
      type: "delete-file";
      payload: {
        fileId: string;
      };
      delay?: number;
    };

const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const fileQueue = new Queue("file-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const addJob = async (jobData: JobData) => {
  return fileQueue.add(jobData.type, jobData.payload, {
    delay: jobData.delay,
  });
};

// Export the Queue object itself
export { Queue };

new Worker(
  "file-processing",
  async (job) => {
    const { file, useCase } = job.data;

    try {
      // 1. Store file
      const buffer = Buffer.from(await file.arrayBuffer());
      const blob = await put(file.name, buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        cacheControlMaxAge: 86400,
      });

      // 2. Process content
      const textContent = await processFile(file, buffer);

      // 3. Vectorize and store
      const index = pinecone.index("rag-demo");
      const embeddings = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          input: textContent,
          model: "text-embedding-3-small",
        }),
      }).then((res) => res.json());

      await index.upsert([
        {
          id: blob.url,
          values: embeddings.data[0].embedding,
          metadata: {
            useCase,
            blobUrl: blob.url,
            text: textContent.chunks[0]?.text || "",
            originalName: textContent.metadata.originalName,
            mimeType: textContent.metadata.mimeType,
            processedAt: textContent.metadata.processedAt,
            expiresAt: textContent.metadata.expiresAt,
            sizeBytes: textContent.metadata.sizeBytes,
          },
        },
      ]);

      return { status: "completed", blobUrl: blob.url };
    } catch (error) {
      console.error("Queue processing error:", error);
      throw error;
    }
  },
  { connection: redis }
);
