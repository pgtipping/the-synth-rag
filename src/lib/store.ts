import { create } from "zustand";

interface FileWithId extends File {
  id: string;
  preview: string;
}

interface FileState {
  files: Record<string, FileWithId[]>;
  addFile: (useCase: string, file: FileWithId) => void;
  removeFile: (useCase: string, fileId: string) => void;
  clearFiles: (useCase: string) => void;
}

export const useFileStore = create<FileState>((set) => ({
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
}));
