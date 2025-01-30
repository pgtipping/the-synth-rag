import { useCallback, useEffect } from "react";
import Uppy from "@uppy/core";
import type { UppyFile, UppyMeta, UppyInstance } from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";
import type { TusOptions, TusRequest } from "@uppy/tus";
import crypto from "crypto";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

/**
 * Props for the ChunkedUpload component
 * @interface ChunkedUploadProps
 * @property {(fileId: string) => void} [onUploadComplete] - Callback function called when a file upload completes successfully
 * @property {(error: Error) => void} [onUploadError] - Callback function called when a file upload fails
 */
interface ChunkedUploadProps {
  onUploadComplete?: (fileId: string) => void;
  onUploadError?: (error: Error) => void;
}

/**
 * Configuration object for supported file types
 * Maps file extensions to their corresponding MIME types
 */
const SUPPORTED_FILE_TYPES = {
  // Documents
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  DOC: "application/msword",

  // Presentations
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  PPT: "application/vnd.ms-powerpoint",

  // Spreadsheets
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  XLS: "application/vnd.ms-excel",
  CSV: "text/csv",

  // Plain text
  TXT: "text/plain",
} as const;

/**
 * Type representing the supported MIME types
 * Generated from the keys of SUPPORTED_FILE_TYPES
 */
type SupportedMimeType =
  (typeof SUPPORTED_FILE_TYPES)[keyof typeof SUPPORTED_FILE_TYPES];

/**
 * Extended metadata type for Uppy files
 * Adds type safety for the file type property
 */
interface FileMetadata extends UppyMeta {
  type: SupportedMimeType;
}

/**
 * ChunkedUpload Component
 *
 * A React component that provides a file upload interface using Uppy.
 * Supports chunked uploads via Tus protocol with the following features:
 * - File type restrictions
 * - Maximum file size limit (10GB)
 * - Upload progress tracking
 * - Chunk hashing for integrity verification
 * - Error handling
 *
 * @component
 * @example
 * ```tsx
 * <ChunkedUpload
 *   onUploadComplete={(fileId) => console.log(`File ${fileId} uploaded successfully`)}
 *   onUploadError={(error) => console.error('Upload failed:', error)}
 * />
 * ```
 */
export default function ChunkedUpload({
  onUploadComplete,
  onUploadError,
}: ChunkedUploadProps) {
  /**
   * Initializes the Uppy instance with all necessary configuration and event handlers
   * @returns {UppyInstance} Configured Uppy instance
   */
  const initializeUppy = useCallback((): UppyInstance => {
    const uppy = Uppy({
      id: "uppy-chunked",
      autoProceed: true,
      restrictions: {
        maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
        allowedFileTypes: Object.values(SUPPORTED_FILE_TYPES),
      },
    });

    /**
     * Configuration for the Tus plugin
     * Handles chunked upload functionality
     */
    const tusOptions: TusOptions = {
      endpoint: "/api/upload/chunk",
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      retryDelays: [0, 1000, 3000, 5000],
      onBeforeRequest: async (req: TusRequest, file: UppyFile<UppyMeta>) => {
        const offset = req.getOffset();
        const chunkSize = req.getChunkSize();
        const chunk = await file.data
          .slice(offset, offset + chunkSize)
          .arrayBuffer();

        // Calculate chunk hash for integrity verification
        const chunkHash = crypto
          .createHash("sha256")
          .update(Buffer.from(chunk))
          .digest("hex");

        // Add custom headers for chunk identification and verification
        req.setHeader("upload-id", file.id);
        req.setHeader("content-type", file.meta.type);
        req.setHeader("chunk-index", Math.floor(offset / chunkSize).toString());
        req.setHeader("chunk-hash", chunkHash);
      },
    };

    uppy.use(Tus, tusOptions);

    // Event Handlers

    // Handle successful uploads
    uppy.on("upload-success", (file: UppyFile<FileMetadata>) => {
      if (file?.id) {
        onUploadComplete?.(file.id);
      }
    });

    // Handle upload errors
    uppy.on("upload-error", (event: { error: { message: string } }) => {
      if (event.error?.message) {
        onUploadError?.(new Error(event.error.message));
      }
    });

    // Log upload progress
    uppy.on(
      "upload-progress",
      (event: {
        file: UppyFile<FileMetadata>;
        progress: { bytesUploaded: number; bytesTotal: number };
      }) => {
        if (event.file?.meta?.name && event.progress) {
          console.log(
            `Upload progress for ${event.file.meta.name}: ${event.progress.bytesUploaded}/${event.progress.bytesTotal} bytes (${event.file.progress?.percentage}%)`
          );
        }
      }
    );

    // Log when upload starts
    uppy.on("upload-started", (files: UppyFile<FileMetadata>[]) => {
      console.log(`Starting upload of ${files.length} files`);
    });

    // Log upload completion
    uppy.on(
      "upload-complete",
      (result: {
        successful: UppyFile<FileMetadata>[];
        failed: UppyFile<FileMetadata>[];
      }) => {
        console.log(
          `Upload complete. Successful: ${result.successful.length}, Failed: ${result.failed.length}`
        );
      }
    );

    return uppy;
  }, [onUploadComplete, onUploadError]);

  // Cleanup Uppy instance on component unmount
  useEffect(() => {
    const uppy = initializeUppy();
    return () => {
      void uppy.close();
    };
  }, [initializeUppy]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Supported file types:</h3>
        <ul className="list-disc pl-5">
          <li>Documents: PDF, Word (DOCX, DOC)</li>
          <li>Presentations: PowerPoint (PPTX, PPT)</li>
          <li>Spreadsheets: Excel (XLSX, XLS), CSV</li>
          <li>Plain Text: TXT</li>
        </ul>
      </div>
      <Dashboard
        uppy={initializeUppy()}
        proudlyDisplayPoweredByUppy={false}
        showProgressDetails
        height={400}
        width="100%"
      />
    </div>
  );
}
