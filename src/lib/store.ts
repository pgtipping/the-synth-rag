import { create } from "zustand";
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

export const useFileStore = create<FileState>((set) => ({
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
  migrate: (persistedState: unknown) => {
    const state = persistedState as FileState;
    return {
      ...state,
      files: Object.fromEntries(
        Object.entries(state.files).map(([useCase, files]) => [
          useCase,
          files.map((file) => ({
            ...file,
            name:
              file.name ||
              file.preview?.split("/").pop()?.split("_").pop() ||
              `file-${file.id.slice(0, 6)}`,
          })),
        ])
      ),
    };
  },
}));
