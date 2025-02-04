import pool from "./db";
import { randomUUID } from "crypto";

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export interface StorageProvider {
  store(
    fileName: string,
    data: Buffer | ReadableStream,
    contentType: string,
    options?: {
      onProgress?: (bytesUploaded: number) => void;
      totalSize?: number;
    }
  ): Promise<{ url: string }>;
  retrieve(
    fileId: string,
    options?: {
      onProgress?: (bytesDownloaded: number) => void;
      asStream?: boolean;
    }
  ): Promise<Buffer | ReadableStream>;
  delete(fileId: string): Promise<void>;
  getUrl(fileId: string): string;
}

interface StorageConfig {
  baseUrl: string;
  maxAge?: number; // in seconds
}

interface FileRow {
  id: string;
  data: Buffer;
}

// Extend the Pool type to include the query method
declare module "pg" {
  interface Pool {
    query<T>(
      text: string,
      values: unknown[]
    ): Promise<{ rows: T[]; rowCount: number }>;
  }
}

class PostgresStorageProvider implements StorageProvider {
  private baseUrl: string;
  private maxAge: number;

  constructor(config: StorageConfig) {
    this.baseUrl = config.baseUrl;
    this.maxAge = config.maxAge || 24 * 60 * 60; // Default to 24 hours
  }

  async store(
    fileName: string,
    data: Buffer | ReadableStream,
    contentType: string,
    options?: {
      onProgress?: (bytesUploaded: number) => void;
      totalSize?: number;
    }
  ): Promise<{ url: string }> {
    const fileId = randomUUID();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Create temporary table for chunks
      await client.query(`
        CREATE TEMP TABLE IF NOT EXISTS file_chunks (
          chunk_number INTEGER,
          chunk_data BYTEA,
          PRIMARY KEY (chunk_number)
        ) ON COMMIT DROP
      `);

      let chunkNumber = 0;
      let bytesUploaded = 0;

      if (Buffer.isBuffer(data)) {
        // Handle Buffer input
        for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
          const chunk = data.slice(offset, offset + CHUNK_SIZE);
          await client.query(
            "INSERT INTO file_chunks (chunk_number, chunk_data) VALUES ($1, $2)",
            [chunkNumber++, chunk]
          );
          bytesUploaded += chunk.length;
          if (options?.onProgress) {
            options.onProgress(bytesUploaded);
          }
        }
      } else {
        // Handle ReadableStream input
        const reader = data.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            await client.query(
              "INSERT INTO file_chunks (chunk_number, chunk_data) VALUES ($1, $2)",
              [chunkNumber++, Buffer.from(value)]
            );
            bytesUploaded += value.length;
            if (options?.onProgress) {
              options.onProgress(bytesUploaded);
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      // Combine chunks and insert into files table
      await client.query(
        `
        INSERT INTO files (
          id, 
          filename, 
          content_type, 
          data, 
          size_bytes, 
          created_at
        ) 
        SELECT 
          $1,
          $2,
          $3,
          string_agg(chunk_data::text, '')::bytea,
          sum(length(chunk_data)),
          NOW()
        FROM file_chunks
      `,
        [fileId, fileName, contentType]
      );

      await client.query("COMMIT");
      return { url: this.getUrl(fileId) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async retrieve(
    fileId: string,
    options?: {
      onProgress?: (bytesDownloaded: number) => void;
      asStream?: boolean;
    }
  ): Promise<Buffer | ReadableStream> {
    const query = `
      SELECT data 
      FROM files 
      WHERE id = $1 
      AND deleted_at IS NULL
    `;

    const result = await pool.query<FileRow>(query, [fileId]);
    if (result.rows.length === 0) {
      throw new Error("File not found");
    }

    const data = result.rows[0].data;

    if (options?.asStream) {
      return new ReadableStream({
        start(controller) {
          let bytesDownloaded = 0;

          while (bytesDownloaded < data.length) {
            const chunk = data.slice(
              bytesDownloaded,
              bytesDownloaded + CHUNK_SIZE
            );
            controller.enqueue(chunk);
            bytesDownloaded += chunk.length;

            if (options?.onProgress) {
              options.onProgress(bytesDownloaded);
            }
          }

          controller.close();
        },
      });
    }

    if (options?.onProgress) {
      options.onProgress(data.length);
    }

    return data;
  }

  async delete(fileId: string): Promise<void> {
    const query = `
      UPDATE files 
      SET deleted_at = NOW() 
      WHERE id = $1 
      AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [fileId]);
    if (result.rowCount === 0) {
      throw new Error("File not found");
    }
  }

  getUrl(fileId: string): string {
    return `${this.baseUrl}/api/files/${fileId}`;
  }
}

function getStorageConfig(): StorageConfig {
  return {
    baseUrl:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000",
    maxAge: parseInt(process.env.STORAGE_MAX_AGE || "86400", 10), // 24 hours in seconds
  };
}

// Factory function to create the storage provider
export function createStorageProvider(): StorageProvider {
  const config = getStorageConfig();
  return new PostgresStorageProvider(config);
}

// Export a singleton instance
export const storage = createStorageProvider();
