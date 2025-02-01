import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FileWithId } from "@/src/types/file";

interface FileState {
  files: Record<string, FileWithId[]>;
  addFile: (useCase: string, file: FileWithId) => void;
  removeFile: (useCase: string, fileId: string) => void;
  clearFiles: (useCase: string) => void;
  updateFileStatus: (
    useCase: string,
    fileId: string,
    status: FileWithId["status"],
    error?: string,
    processingStage?: FileWithId["processingStage"]
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
            [useCase]: [
              ...(state.files[useCase] || []),
              {
                ...file,
                name:
                  file.name ||
                  file.preview?.split("/").pop() ||
                  `file-${file.id.slice(0, 6)}`,
              },
            ],
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
                    name:
                      file.name ||
                      file.preview?.split("/").pop() ||
                      `file-${file.id.slice(0, 6)}`,
                  }
                : file
            ),
          },
        })),
    }),
    {
      name: "file-storage",
      partialize: (state) => ({ files: state.files }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Revalidate file URLs and cleanup any expired files
          Object.entries(state.files).forEach(([useCase, files]) => {
            files.forEach((file) => {
              if (file.preview) {
                // Check if the file still exists in Vercel Blob
                fetch(file.preview, { method: "HEAD" })
                  .then((response) => {
                    if (!response.ok) {
                      state.removeFile(useCase, file.id);
                    }
                  })
                  .catch(() => {
                    state.removeFile(useCase, file.id);
                  });
              }
            });
          });
        }
      },
    }
  )
);
