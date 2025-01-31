export interface FileWithId extends File {
  id: string;
  status?: "uploading" | "indexing" | "completed" | "error";
  progress?: number;
  error?: string;
  preview: string;
  source?: "local" | "cdn";
  cdnUrl?: string;
  thumbnail?: string;
  processingStage?: {
    stage: "uploading" | "processing" | "indexing";
    progress: number;
    message?: string;
  };
}

export interface FileWithPreview extends FileWithId {
  preview: string;
}
