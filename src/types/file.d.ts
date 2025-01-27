export interface FileWithId extends File {
  id: string;
  status?: "uploading" | "success" | "error" | "pending" | "completed";
  progress?: number;
  error?: string;
  preview: string;
  source?: "local" | "cdn";
  cdnUrl?: string;
  thumbnail?: string;
}

export interface FileWithPreview extends FileWithId {
  preview: string;
}
