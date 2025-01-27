import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

interface ChunkMetadata {
  totalChunks: number;
  chunkNumber: number;
  originalName: string;
  mimeType: string;
  fileId: string;
}

export class FileAssembler {
  private fileId: string;
  private totalChunks: number;
  private receivedChunks: Set<number> = new Set();
  private originalName: string;
  private mimeType: string;

  constructor(metadata: ChunkMetadata) {
    this.fileId = metadata.fileId;
    this.totalChunks = metadata.totalChunks;
    this.originalName = metadata.originalName;
    this.mimeType = metadata.mimeType;
  }

  async addChunk(chunkNumber: number, data: Buffer): Promise<void> {
    const chunkPath = this.getChunkPath(chunkNumber);
    await fs.mkdir(path.dirname(chunkPath), { recursive: true });
    await fs.writeFile(chunkPath, data);
    this.receivedChunks.add(chunkNumber);
  }

  async assemble(): Promise<{ filePath: string; fileSize: number }> {
    if (this.receivedChunks.size !== this.totalChunks) {
      throw new Error("Not all chunks have been received");
    }

    const finalPath = this.getFinalPath();
    await fs.mkdir(path.dirname(finalPath), { recursive: true });

    for (let i = 0; i < this.totalChunks; i++) {
      const chunkPath = this.getChunkPath(i);
      const data = await fs.readFile(chunkPath);
      await fs.appendFile(finalPath, data);
      await fs.unlink(chunkPath);
    }

    const stats = await fs.stat(finalPath);
    return {
      filePath: finalPath,
      fileSize: stats.size,
    };
  }

  async cleanup(): Promise<void> {
    try {
      for (let i = 0; i < this.totalChunks; i++) {
        const chunkPath = this.getChunkPath(i);
        await fs.unlink(chunkPath).catch(() => {});
      }
      const finalPath = this.getFinalPath();
      await fs.unlink(finalPath).catch(() => {});
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }

  private getChunkPath(chunkNumber: number): string {
    return path.join(UPLOAD_DIR, this.fileId, `chunk-${chunkNumber}`);
  }

  private getFinalPath(): string {
    return path.join(UPLOAD_DIR, this.fileId, this.originalName);
  }

  static generateFileId(): string {
    return uuidv4();
  }
}
