/**
 * Type definitions for Uppy file uploader
 * Focused on the core functionality and Tus plugin
 */

/**
 * Basic metadata for uploaded files
 */
interface UppyMeta {
  /** File name */
  name: string;
  /** MIME type */
  type: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  lastModified?: number;
  /** Additional metadata fields */
  [key: string]: unknown;
}

/**
 * Represents a file being uploaded
 */
interface UppyFile<M extends UppyMeta = UppyMeta> {
  /** Unique file identifier */
  id: string;
  /** File metadata */
  meta: M;
  /** File data */
  data: Blob;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type?: string;
  /** Upload progress information */
  progress?: {
    /** Number of bytes uploaded */
    bytesUploaded: number;
    /** Total number of bytes */
    bytesTotal: number;
    /** Upload progress percentage */
    percentage: number;
    /** Whether upload is complete */
    uploadComplete: boolean;
    /** Upload start timestamp or status */
    uploadStarted: boolean | number;
  };
}

/**
 * HTTP request interface for Tus uploads
 */
interface TusRequest {
  /** Get current offset in bytes */
  getOffset(): number;
  /** Get chunk size in bytes */
  getChunkSize(): number;
  /** Set request header */
  setHeader(name: string, value: string): void;
}

/**
 * Response from successful upload
 */
interface UploadResponse {
  /** Response body */
  body?: Record<string, unknown>;
  /** HTTP status code */
  status: number;
  /** Number of bytes uploaded */
  bytesUploaded?: number;
  /** Final upload URL */
  uploadURL?: string;
}

/**
 * Error from failed upload
 */
interface UploadError {
  /** Error name */
  name: string;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: string;
}

/**
 * Uppy configuration options
 */
interface UppyOptions {
  /** Unique instance identifier */
  id: string;
  /** Whether to start upload automatically */
  autoProceed?: boolean;
  /** Upload restrictions */
  restrictions?: {
    /** Maximum file size in bytes */
    maxFileSize?: number;
    /** Allowed file types */
    allowedFileTypes?: string[];
  };
}

/**
 * Plugin interface
 */
interface Plugin<Options> {
  (opts: Options): (uppy: UppyInstance) => void;
}

/**
 * Tus plugin options
 */
interface TusOptions {
  /** Upload endpoint URL */
  endpoint: string;
  /** Chunk size in bytes */
  chunkSize?: number;
  /** Retry delays in milliseconds */
  retryDelays?: number[];
  /** Callback before request */
  onBeforeRequest?: (
    request: TusRequest,
    file: UppyFile
  ) => void | Promise<void>;
}

/**
 * Event names for type safety
 */
type UppyEvent =
  | "upload-success"
  | "upload-error"
  | "upload-progress"
  | "file-added"
  | "file-removed"
  | "upload-started"
  | "upload-complete";

/**
 * Main Uppy instance interface
 */
interface UppyInstance {
  /** Add plugin to Uppy */
  use<Options>(plugin: Plugin<Options>, opts?: Options): this;
  /** Close and clean up */
  close(): void;
  /** Event handlers */
  on<M extends UppyMeta = UppyMeta>(
    event: "upload-success",
    callback: (file: UppyFile<M> | undefined, response: UploadResponse) => void
  ): this;
  on<M extends UppyMeta = UppyMeta>(
    event: "upload-error",
    callback: (
      file: UppyFile<M> | undefined,
      error: UploadError,
      response?: Omit<UploadResponse, "uploadURL">
    ) => void
  ): this;
  on<M extends UppyMeta = UppyMeta>(
    event: "upload-progress",
    callback: (
      file: UppyFile<M>,
      progress: { bytesUploaded: number; bytesTotal: number }
    ) => void
  ): this;
  on<M extends UppyMeta = UppyMeta>(
    event: "file-added",
    callback: (file: UppyFile<M>) => void
  ): this;
  on<M extends UppyMeta = UppyMeta>(
    event: "file-removed",
    callback: (file: UppyFile<M>, reason?: string) => void
  ): this;
  on<M extends UppyMeta = UppyMeta>(
    event: "upload-started",
    callback: (files: UppyFile<M>[]) => void
  ): this;
  on<M extends UppyMeta = UppyMeta>(
    event: "upload-complete",
    callback: (result: {
      successful: UppyFile<M>[];
      failed: UppyFile<M>[];
    }) => void
  ): this;
}

/**
 * Uppy constructor function
 */
interface UppyConstructor {
  (opts?: UppyOptions): UppyInstance;
}

/** Tus resumable upload plugin */
declare const Tus: Plugin<TusOptions>;

declare module "@uppy/core" {
  const Uppy: UppyConstructor;
  export = Uppy;
  export {
    UppyFile,
    UppyMeta,
    UppyOptions,
    UploadResponse,
    UploadError,
    UppyEvent,
    UppyInstance,
    Plugin,
  };
}

declare module "@uppy/tus" {
  export = Tus;
  export { TusRequest, TusOptions };
}
