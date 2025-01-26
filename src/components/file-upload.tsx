"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useFileStore } from "@/lib/store";
import { motion } from "framer-motion";

interface FileWithId extends File {
  id: string;
  preview: string;
}

interface FileWithPreview extends FileWithId {
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

interface FileUploadProps {
  useCase: string;
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
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

export function FileUpload({ useCase }: FileUploadProps) {
  const { files, addFile, removeFile } = useFileStore();
  const currentFiles = files[useCase] || [];

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
          preview: URL.createObjectURL(file),
        };
        const fileWithPreview: FileWithPreview = {
          ...fileWithId,
          status: "pending",
        };
        addFile(useCase, fileWithPreview);
      });
    },
    [addFile, useCase]
  );

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
      URL.revokeObjectURL(file.preview);
    },
    [removeFile, useCase]
  );

  return (
    <div className="space-y-4">
      <div {...getRootProps()}>
        <motion.div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragActive ? "border-primary" : "border-muted"
          }`}
          whileHover={{
            scale: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? 1
              : 1.02,
            boxShadow: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
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
        <div className="space-y-2">
          {currentFiles.map((file: FileWithId) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div className="flex items-center space-x-2">
                <Icons.file className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file)}
              >
                <Icons.x className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
