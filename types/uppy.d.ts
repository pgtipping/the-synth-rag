/**
 * Type definitions for Uppy file upload library
 * Extends and augments the base types from @uppy/core and @uppy/tus
 */

import { UppyFile, UppyMeta, UppyInstance } from "@uppy/core";

/**
 * Type declarations for the Tus resumable upload protocol
 */
declare module "@uppy/tus" {
  /**
   * Configuration options for the Tus plugin
   */
  export interface TusOptions {
    /** The endpoint URL for the Tus server */
    endpoint: string;
    /** Size of each chunk in bytes */
    chunkSize?: number;
    /** Array of delays (in ms) between retries */
    retryDelays?: number[];
    /** Callback function called before each chunk request */
    onBeforeRequest?: (
      request: TusRequest,
      file: import("@uppy/core").UppyFile<import("@uppy/core").UppyMeta>
    ) => void | Promise<void>;
  }

  /**
   * Interface for Tus request object
   * Provides methods for handling chunk uploads
   */
  export interface TusRequest {
    /** Get the current chunk offset */
    getOffset: () => number;
    /** Get the configured chunk size */
    getChunkSize: () => number;
    /** Set a custom header for the request */
    setHeader: (name: string, value: string) => void;
  }

  /**
   * Plugin interface for Tus
   * Function that takes options and returns an Uppy plugin
   */
  export interface TusPlugin {
    (opts: TusOptions): (uppy: import("@uppy/core").UppyInstance) => void;
  }

  const Tus: TusPlugin;
  export default Tus;
}

/**
 * Extended type declarations for @uppy/core
 * Adds additional type safety and custom event handling
 */
declare module "@uppy/core" {
  import { Uppy as BaseUppy, UppyFile as BaseUppyFile, Meta } from "@uppy/core";

  /**
   * Extended metadata interface with required fields
   */
  export interface ExtendedMeta extends Meta {
    /** MIME type of the file */
    type: string;
    /** File size in bytes */
    size: number;
    /** Last modified timestamp */
    lastModified?: number;
    /** URL where the file was uploaded */
    uploadURL?: string;
  }

  /**
   * Response type for successful uploads
   */
  export interface UploadResponse {
    /** Response body from the server */
    body?: Record<string, unknown>;
    /** HTTP status code */
    status: number;
    /** Number of bytes uploaded */
    bytesUploaded?: number;
    /** URL where the file was uploaded */
    uploadURL?: string;
  }

  /**
   * Error type for failed uploads
   */
  export interface UploadError {
    /** Error name/type */
    name: string;
    /** Error message */
    message: string;
    /** Additional error details */
    details?: string;
  }

  /**
   * Extended UppyFile interface with proper typing
   */
  export interface UppyFile<M extends Meta = Meta>
    extends Omit<BaseUppyFile<M, Blob>, "meta"> {
    meta: M;
    data: Blob;
    size: number;
    type?: string;
    progress?: {
      bytesUploaded: number;
      bytesTotal: number;
      percentage: number;
      uploadComplete: boolean;
      uploadStarted: number | null;
    };
    response?: UploadResponse;
    error?: UploadError;
  }

  /**
   * Extended Uppy interface with proper event handling
   */
  export interface Uppy<M extends Meta = Meta>
    extends Omit<BaseUppy<M, Blob>, "on" | "close"> {
    close(): void;
    on(
      event: "upload-success",
      callback: (
        file: UppyFile<M> | undefined,
        response: UploadResponse
      ) => void
    ): this;
    on(
      event: "upload-error",
      callback: (
        file: UppyFile<M> | undefined,
        error: UploadError,
        response?: Omit<UploadResponse, "uploadURL">
      ) => void
    ): this;
    on(
      event: "upload-progress",
      callback: (
        file: UppyFile<M>,
        progress: { bytesUploaded: number; bytesTotal: number }
      ) => void
    ): this;
  }

  /**
   * Map of event names to their corresponding data types
   */
  export interface UppyEventMap<M extends UppyMeta = UppyMeta> {
    "upload-success": UppyFile<M>;
    "upload-error": { error: { message: string } };
    "upload-progress": {
      file: UppyFile<M>;
      progress: { bytesUploaded: number; bytesTotal: number };
    };
    "upload-started": UppyFile<M>[];
    "upload-complete": {
      successful: UppyFile<M>[];
      failed: UppyFile<M>[];
    };
  }

  /**
   * Interface for the Uppy instance
   * Provides methods for event handling and plugin management
   */
  export interface UppyInstance {
    on<M extends UppyMeta>(
      event: keyof UppyEventMap<M>,
      callback: (arg: UppyEventMap<M>[typeof event]) => void
    ): void;
    close(): Promise<void>;
    use: (plugin: TusPlugin, opts: TusOptions) => UppyInstance;
  }

  /**
   * Interface for Uppy file objects
   * Represents a file being uploaded
   */
  export interface UppyFile<M extends UppyMeta = UppyMeta> {
    /** Unique identifier for the file */
    id: string;
    /** File name */
    name: string;
    /** MIME type */
    type: string;
    /** File data */
    data: Blob;
    /** File size in bytes */
    size: number;
    /** File metadata */
    meta: M;
    /** Upload progress information */
    progress?: {
      bytesUploaded: number;
      bytesTotal: number;
      percentage: number;
      uploadComplete: boolean;
      uploadStarted: number | null;
    };
  }

  /**
   * Base metadata interface for Uppy files
   */
  export interface UppyMeta {
    /** File name */
    name: string;
    /** MIME type */
    type: string;
    /** Additional metadata fields */
    [key: string]: unknown;
  }
}
