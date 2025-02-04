import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type FileMetadata,
  type FileStatus,
  type ProcessingStage,
  validateFileUrl,
  cleanupExpiredFiles,
} from "./utils/file-utils";

interface FileState {
  files: Record<string, FileMetadata[]>;
  addFile: (useCase: string, file: FileMetadata) => void;
  removeFile: (useCase: string, fileId: string) => void;
  clearFiles: (useCase: string) => void;
  updateFileStatus: (
    useCase: string,
    fileId: string,
    status: FileStatus,
    error?: string,
    processingStage?: ProcessingStage
  ) => void;
}

export const useFileStore = create<FileState>()(
  persist(
    (set) => ({
      files: {},
      addFile: (useCase, file) =>
        set((state) => ({
          files: {
            ...state.files,
            [useCase]: [...(state.files[useCase] || []), file],
          },
        })),
      removeFile: (useCase, fileId) =>
        set((state) => ({
          files: {
            ...state.files,
            [useCase]: (state.files[useCase] || []).filter(
              (file) => file.id !== fileId
            ),
          },
        })),
      clearFiles: (useCase) =>
        set((state) => ({
          files: {
            ...state.files,
            [useCase]: [],
          },
        })),
      updateFileStatus: (useCase, fileId, status, error, processingStage) =>
        set((state) => ({
          files: {
            ...state.files,
            [useCase]: (state.files[useCase] || []).map((file) =>
              file.id === fileId
                ? {
                    ...file,
                    status,
                    error,
                    processingStage,
                  }
                : file
            ),
          },
        })),
    }),
    {
      name: "file-storage",
      partialize: (state) => ({ files: state.files }),
      onRehydrateStorage: () => async (state) => {
        if (state) {
          // Validate and cleanup files on rehydration
          for (const [useCase, files] of Object.entries(state.files)) {
            for (const file of files) {
              if (file.url) {
                const validation = await validateFileUrl(file.url);
                if (!validation.exists || validation.isExpired) {
                  state.removeFile(useCase, file.id);
                }
              }
            }
          }

          // Cleanup expired files
          for (const [useCase, files] of Object.entries(state.files)) {
            const deletedFiles = await cleanupExpiredFiles(files);
            deletedFiles.forEach((fileId) => state.removeFile(useCase, fileId));
          }
        }
      },
    }
  )
);
