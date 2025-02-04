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
import { useToast } from "@/src/hooks/use-toast";
import { FileMetadata } from "@/src/lib/utils/file-utils";
import { FilePreview } from "./FilePreview";

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
  const { toast } = useToast();
  const [cdnUrl, setCdnUrl] = useState("");
  const [cdnError, setCdnError] = useState("");

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast({
            title: "Error",
            description: validation.error,
            variant: "destructive",
          });
          continue;
        }

        const fileId = crypto.randomUUID();
        const fileMetadata: FileMetadata = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: URL.createObjectURL(file),
          status: "uploading",
          uploadedAt: new Date(),
          processingStage: "uploading",
        };

        addFile(useCase, fileMetadata);

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("useCase", useCase);
          formData.append("fileId", fileId);
          formData.append("fileName", file.name);

          // Get the base URL, defaulting to relative path if not available
          const baseUrl =
            typeof window !== "undefined"
              ? window.location.origin
              : process.env.NEXT_PUBLIC_APP_URL || "";

          const uploadUrl = `${baseUrl}/api/upload`;
          console.log("Attempting upload to:", uploadUrl, {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          });

          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              Accept: "application/json",
            },
            body: formData,
          });

          console.log("Upload response status:", response.status);
          console.log(
            "Response headers:",
            Object.fromEntries(response.headers.entries())
          );

          const result = await response.text();
          console.log("Raw response:", result);

          let jsonResult;
          try {
            jsonResult = JSON.parse(result);
          } catch {
            console.error("Failed to parse response:", result);
            // If we can't parse the response, check if it's an HTML error page
            if (result.includes("<!DOCTYPE html>")) {
              console.error("Received HTML instead of JSON - server error");
              throw new Error("Server error - please try again");
            }
            throw new Error("Invalid response format from server");
          }

          if (!response.ok) {
            const errorMessage =
              jsonResult.error || jsonResult.details || response.statusText;
            console.error("Upload failed:", errorMessage);
            throw new Error(`Upload failed: ${errorMessage}`);
          }

          updateFileStatus(
            useCase,
            fileId,
            "indexing",
            undefined,
            "processing"
          );

          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            if (progress <= 100) {
              updateFileStatus(
                useCase,
                fileId,
                "indexing",
                undefined,
                "indexing"
              );
            }
            if (progress >= 100) {
              clearInterval(interval);
              updateFileStatus(
                useCase,
                fileId,
                "completed",
                undefined,
                "completed"
              );
            }
          }, 500);
        } catch (error) {
          console.error("Upload error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Upload failed - please try again";
          updateFileStatus(useCase, fileId, "error", errorMessage);
          toast({
            title: "Upload Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    },
    [addFile, useCase, updateFileStatus, toast]
  );

  const handleCdnUpload = useCallback(() => {
    if (!isValidUrl(cdnUrl)) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      setCdnError("Please enter a valid URL");
      return;
    }

    const fileMetadata: FileMetadata = {
      id: crypto.randomUUID(),
      name: cdnUrl.split("/").pop() || "cdn-file",
      size: 0,
      type: "application/octet-stream",
      preview: cdnUrl,
      status: "uploading",
      uploadedAt: new Date(),
      processingStage: "uploading",
    };

    addFile(useCase, fileMetadata);
    setCdnUrl("");
    setCdnError("");
  }, [cdnUrl, useCase, addFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
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

  // Convert FileMetadata to FileWithId while preserving required properties
  const currentFiles = (files[useCase] || []).map((file) => {
    const fileWithId: FileWithId = {
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.preview || "",
      lastModified: new Date(file.uploadedAt).getTime(),
      webkitRelativePath: "",
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      bytes: () => Promise.resolve(new Uint8Array()),
      slice: () => new Blob(),
      stream: () => new ReadableStream(),
      text: () => Promise.resolve(""),
      status: file.status,
      error: file.error,
      processingStage:
        file.processingStage && file.processingStage !== "completed"
          ? {
              stage: file.processingStage,
              progress: 0,
              message: `Processing stage: ${file.processingStage}`,
            }
          : undefined,
    };
    return fileWithId;
  });

  return (
    <div className="w-full space-y-4">
      <div {...getRootProps()}>
        <motion.div
          className={`
            relative border-2 border-dashed rounded-[18px] p-8 text-center
            transition-colors duration-300
            ${
              isDragActive
                ? "border-light-accent dark:border-dark-accent bg-light-accent/5 dark:bg-dark-accent/10"
                : "border-light-text-secondary/20 dark:border-dark-text-secondary/20 bg-light-secondary dark:bg-dark-secondary"
            }
            hover:border-light-accent hover:dark:border-dark-accent
            hover:bg-light-accent/5 hover:dark:bg-dark-accent/10
          `}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <Icons.upload
                className={`w-10 h-10 ${
                  isDragActive
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-text-secondary dark:text-dark-text-secondary"
                }`}
              />
              <p className="text-light-text-primary dark:text-dark-text-primary font-medium">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">
                or click to browse
              </p>
            </motion.div>

            {uploadHints && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-light-text-secondary dark:text-dark-text-secondary"
              >
                <p className="font-medium">{uploadHints.title}</p>
                <p>{uploadHints.description}</p>
                <p className="mt-2">
                  Example files:{" "}
                  {uploadHints.exampleFiles.map((file, i) => (
                    <span key={file}>
                      {i > 0 && ", "}
                      <code className="text-light-accent dark:text-dark-accent">
                        {file}
                      </code>
                    </span>
                  ))}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

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
          {currentFiles.map((file: FileWithId) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={handleRemoveFile}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
