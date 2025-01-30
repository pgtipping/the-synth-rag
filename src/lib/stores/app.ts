"use client";

import { create } from "zustand";
import { FileWithId } from "../../types/file";

interface AppState {
  currentUseCase: string;
  uploadedFiles: FileWithId[];
  isUploadOpen: boolean;
  toggleUpload: () => void;
  setCurrentUseCase: (useCase: string) => void;
  addUploadedFile: (file: FileWithId) => void;
  removeUploadedFile: (fileId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUseCase: "",
  uploadedFiles: [],
  isUploadOpen: true,
  toggleUpload: () => set((state) => ({ isUploadOpen: !state.isUploadOpen })),
  setCurrentUseCase: (useCase) => set({ currentUseCase: useCase }),
  addUploadedFile: (file) =>
    set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
  removeUploadedFile: (fileId) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
    })),
}));
