"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { useFileStore } from "@/src/lib/store";
import { motion } from "framer-motion";
import { Input } from "../ui/input";
import { isValidUrl } from "@/src/lib/utils";
import { FileWithId } from "@/src/types/file";
import { FileIcon } from "../file-icon";

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

interface FileUploadProps {
  useCase: string;
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  uploadHints?: {
    title: string;
    description: string;
    exampleFiles: string[];
  };
}

const validateFile = (file: File): FileValidationResult => {
  const maxSize = 10 * 1024 * 1024; // 10MB
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

export default function FileUpload({ useCase, uploadHints }: FileUploadProps) {
  const { files, addFile, removeFile, updateFileStatus } = useFileStore();
  const currentFiles = (files[useCase] || []) as FileWithId[];

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          alert(validation.error);
          continue;
        }

        const fileId = crypto.randomUUID();
        const fileWithId: FileWithId = {
          ...file,
          id: fileId,
          name: file.name,
          preview: URL.createObjectURL(file) || "",
          source: "local",
          status: "uploading",
          progress: 0,
          processingStage: {
            stage: "uploading",
            progress: 0,
            message: "Starting upload...",
          },
          thumbnail: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          error: undefined,
        };

        addFile(useCase, fileWithId);

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("useCase", useCase);
          formData.append("fileId", fileId);
          formData.append("fileName", file.name);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.error || `Upload failed: ${response.statusText}`
            );
          }

          updateFileStatus(useCase, fileId, "indexing", undefined, {
            stage: "indexing",
            progress: 0,
            message: "Processing document...",
          });

          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            if (progress <= 100) {
              updateFileStatus(useCase, fileId, "indexing", undefined, {
                stage: "indexing",
                progress,
                message:
                  progress < 100 ? "Processing document..." : "Finalizing...",
              });
            }
            if (progress >= 100) {
              clearInterval(interval);
              updateFileStatus(useCase, fileId, "completed");
            }
          }, 500);
        } catch (error) {
          console.error("Upload error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Upload failed - please try again";
          updateFileStatus(useCase, fileId, "error", errorMessage);
        }
      }
    },
    [addFile, useCase, updateFileStatus]
  );

  const [cdnUrl, setCdnUrl] = useState("");
  const [cdnError, setCdnError] = useState("");

  const handleCdnUpload = useCallback(() => {
    if (!isValidUrl(cdnUrl)) {
      setCdnError("Please enter a valid URL");
      return;
    }

    const fileWithId: FileWithId = {
      id: crypto.randomUUID(),
      name: cdnUrl.split("/").pop() || "cdn-file",
      preview: cdnUrl || "",
      source: "cdn",
      cdnUrl,
      lastModified: Date.now(),
      size: 0,
      type: "application/octet-stream",
      webkitRelativePath: "",
      bytes: () => Promise.resolve(new Uint8Array()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      slice: () => new Blob(),
      stream: () => new ReadableStream(),
      text: () => Promise.resolve(""),
      status: "uploading",
      progress: 0,
      thumbnail: undefined,
      error: undefined,
    };
    addFile(useCase, fileWithId);
    setCdnUrl("");
    setCdnError("");
  }, [cdnUrl, useCase, addFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    onDropRejected: (rejectedFiles) => {
      alert(`Invalid file type: ${rejectedFiles[0].file.name}`);
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemoveFile = useCallback(
    (file: FileWithId) => {
      removeFile(useCase, file.id);
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    },
    [removeFile, useCase]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            value={cdnUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCdnUrl(e.target.value)
            }
            placeholder="Enter CDN URL"
            className="flex-1"
          />
          <Button onClick={handleCdnUpload}>Upload from URL</Button>
        </div>
        {cdnError && <p className="text-sm text-destructive">{cdnError}</p>}
      </div>

      {uploadHints && (
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">{uploadHints.description}</p>
          <div className="flex gap-2">
            <span>Recommended files:</span>
            {uploadHints.exampleFiles.map((file, index) => (
              <span key={file} className="text-primary">
                {file}
                {index < uploadHints.exampleFiles.length - 1 && ", "}
              </span>
            ))}
          </div>
        </div>
      )}

      <div {...getRootProps()}>
        <motion.div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted"
          }`}
          whileHover={{
            scale:
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 1
                : 1.02,
            boxShadow:
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "none"
                : "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}
          transition={{ type: "tween", duration: 0.2 }}
        >
          <input {...getInputProps()} />
          <Icons.upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive
              ? "Drop the files here..."
              : "Drag & drop files here, or click to select files"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: PDF, CSV, TXT, DOCX (Max 10MB)
          </p>
        </motion.div>
      </div>

      {currentFiles.length > 0 && (
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
                when: "beforeChildren",
              },
            },
          }}
        >
          {currentFiles.map((file: FileWithId, index) => (
            <motion.div
              key={file.id}
              className="flex items-center justify-between p-2 border rounded-lg bg-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1,
                  },
                },
              }}
              whileHover={{
                scale: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? 1
                  : 1.02,
                boxShadow: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "none"
                  : "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              }}
            >
              <div className="flex items-center space-x-2 flex-1">
                <FileIcon
                  fileName={file.name}
                  className="h-4 w-4 text-muted-foreground"
                />
                <span className="text-sm truncate">{file.name}</span>
                {file.processingStage &&
                  (file.status === "uploading" ||
                    file.status === "indexing") && (
                    <div className="flex items-center space-x-2 flex-1">
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{file.processingStage.message}</span>
                          <span>
                            {Math.round(file.processingStage.progress)}%
                          </span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${file.processingStage.progress}%`,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                {file.status === "completed" && (
                  <Icons.check className="h-4 w-4 text-success" />
                )}
                {file.status === "error" && (
                  <div className="flex items-center space-x-2 text-destructive">
                    <Icons.alertTriangle className="h-4 w-4" />
                    <span className="text-xs">{file.error}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file)}
                className="hover:text-destructive ml-2"
              >
                <Icons.trash className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
