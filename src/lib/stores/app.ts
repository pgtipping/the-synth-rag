"use client";

import { create } from "zustand";

interface AppState {
  currentUseCase: string;
  uploadedFiles: File[];
  isUploadOpen: boolean;
  toggleUpload: () => void;
  setCurrentUseCase: (useCase: string) => void;
  addUploadedFile: (file: File) => void;
  removeUploadedFile: (file: File) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUseCase: "",
  uploadedFiles: [],
  isUploadOpen: true,
  toggleUpload: () => set((state) => ({ isUploadOpen: !state.isUploadOpen })),
  setCurrentUseCase: (useCase) => set({ currentUseCase: useCase }),
  addUploadedFile: (file) =>
    set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
  removeUploadedFile: (file) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f !== file),
    })),
}));
