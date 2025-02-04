import { Pool } from "pg";
import { storage } from "../storage";
import crypto from "crypto";

export interface Document {
  id: number;
  filename: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  storageUrl: string;
  storageProvider: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
  indexedAt: Date | null;
  status: "uploaded" | "processing" | "indexed" | "failed";
  errorMessage: string | null;
}

export interface DocumentChunk {
  id: number;
  documentId: number;
  chunkIndex: number;
  textContent: string;
  vectorId: string | null;
  createdAt: Date;
}

interface DocumentRow {
  id: number;
  filename: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  storage_url: string;
  storage_provider: string;
  created_at: Date;
  updated_at: Date;
  processed_at: Date | null;
  indexed_at: Date | null;
  status: Document["status"];
  error_message: string | null;
}

declare module "pg" {
  interface Pool {
    query<T>(
      text: string,
      values: unknown[]
    ): Promise<{ rows: T[]; rowCount: number }>;
  }
}

export class DocumentService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createDocument(params: {
    originalName: string;
    contentType: string;
    sizeBytes: number;
    buffer: Buffer;
  }): Promise<Document> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Generate a unique filename
      const fileExtension = params.originalName.split(".").pop() || "";
      const uniqueFilename = `${crypto
        .randomBytes(16)
        .toString("hex")}.${fileExtension}`;

      // Store the file using the storage provider
      const { url } = await storage.store(
        uniqueFilename,
        params.buffer,
        params.contentType
      );

      // Insert document metadata into the database
      const result = await client.query<DocumentRow>(
        `INSERT INTO documents 
        (filename, original_name, content_type, size_bytes, storage_url, storage_provider) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          uniqueFilename,
          params.originalName,
          params.contentType,
          params.sizeBytes,
          url,
          "postgresql", // Now we only use PostgreSQL storage
        ]
      );

      await client.query("COMMIT");
      return this.mapDocumentRow(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getDocument(id: number): Promise<Document | null> {
    const result = await this.pool.query<DocumentRow>(
      "SELECT * FROM documents WHERE id = $1",
      [id]
    );
    return result.rows[0] ? this.mapDocumentRow(result.rows[0]) : null;
  }

  async updateDocumentStatus(
    id: number,
    status: Document["status"],
    errorMessage?: string
  ): Promise<void> {
    const updates = ["status = $2"];
    const values: (number | string)[] = [id, status];

    if (status === "processing") {
      updates.push("processed_at = CURRENT_TIMESTAMP");
    } else if (status === "indexed") {
      updates.push("indexed_at = CURRENT_TIMESTAMP");
    }

    if (errorMessage !== undefined) {
      updates.push("error_message = $" + (values.length + 1));
      values.push(errorMessage);
    }

    await this.pool.query(
      `UPDATE documents SET ${updates.join(", ")} WHERE id = $1`,
      values
    );
  }

  async saveDocumentChunks(
    documentId: number,
    chunks: { text: string; index: number }[]
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      for (const chunk of chunks) {
        await client.query(
          `INSERT INTO document_chunks (document_id, chunk_index, text_content)
          VALUES ($1, $2, $3)`,
          [documentId, chunk.index, chunk.text]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateChunkVectorId(
    documentId: number,
    chunkIndex: number,
    vectorId: string
  ): Promise<void> {
    await this.pool.query(
      "UPDATE document_chunks SET vector_id = $1 WHERE document_id = $2 AND chunk_index = $3",
      [vectorId, documentId, chunkIndex]
    );
  }

  async deleteDocument(id: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Get the document
      const result = await client.query<{ storage_url: string }>(
        "SELECT storage_url FROM documents WHERE id = $1",
        [id]
      );

      if (result.rows[0]) {
        // Extract UUID from storage URL
        const fileId = result.rows[0].storage_url.split("/").pop()!;
        // Soft delete from storage
        await storage.delete(fileId);
        // Delete from database (cascades to chunks)
        await client.query("DELETE FROM documents WHERE id = $1", [id]);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private mapDocumentRow(row: DocumentRow): Document {
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      storageUrl: row.storage_url,
      storageProvider: row.storage_provider,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processedAt: row.processed_at,
      indexedAt: row.indexed_at,
      status: row.status,
      errorMessage: row.error_message,
    };
  }
}
