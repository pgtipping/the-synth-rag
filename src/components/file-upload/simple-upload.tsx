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

export default function FileUpload({ useCase }: FileUploadProps) {
  const { files, addFile, removeFile } = useFileStore();
  const currentFiles = (files[useCase] || []) as FileWithId[];

  const generateUniqueId = () => {
    return crypto.randomUUID();
  };

  const handleFiles = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const validation = validateFile(file);
        if (!validation.isValid) {
          alert(validation.error);
          return;
        }

        const fileWithId: FileWithId = {
          ...file,
          id: generateUniqueId(),
          preview: URL.createObjectURL(file) || "",
          source: "local",
          status: "pending",
          progress: 0,
          thumbnail: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          error: undefined,
        };
        addFile(useCase, fileWithId);
      });
    },
    [addFile, useCase]
  );

  const [cdnUrl, setCdnUrl] = useState("");
  const [cdnError, setCdnError] = useState("");

  const handleCdnUpload = useCallback(() => {
    if (!isValidUrl(cdnUrl)) {
      setCdnError("Please enter a valid URL");
      return;
    }

    const fileWithId: FileWithId = {
      id: generateUniqueId(),
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
      status: "pending",
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
            variant="url"
          />
          <Button onClick={handleCdnUpload}>Upload from URL</Button>
        </div>
        {cdnError && <p className="text-sm text-destructive">{cdnError}</p>}
      </div>
      <div {...getRootProps()}>
        <motion.div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragActive ? "border-primary" : "border-muted"
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
              className="flex items-center justify-between p-2 border rounded"
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
              exit={{
                opacity: 0,
                x: -20,
                transition: {
                  duration: window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                  ).matches
                    ? 0.1
                    : 0.2,
                },
              }}
            >
              <div className="flex items-center space-x-2">
                <Icons.file className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file)}
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
