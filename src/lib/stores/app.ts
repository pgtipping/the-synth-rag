"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FileWithId } from "../../types/file";

interface AppState {
  currentUseCase: string;
  uploadedFiles: FileWithId[];
  isUploadOpen: boolean;
  isChatReady: boolean;
  toggleUpload: () => void;
  setCurrentUseCase: (useCase: string) => void;
  addUploadedFile: (file: FileWithId) => void;
  removeUploadedFile: (fileId: string) => void;
  setIsChatReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUseCase: "",
      uploadedFiles: [],
      isUploadOpen: true,
      isChatReady: false,
      toggleUpload: () =>
        set((state) => ({ isUploadOpen: !state.isUploadOpen })),
      setCurrentUseCase: (useCase) => set({ currentUseCase: useCase }),
      addUploadedFile: (file) =>
        set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
      removeUploadedFile: (fileId) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
        })),
      setIsChatReady: (ready) => set({ isChatReady: ready }),
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        currentUseCase: state.currentUseCase,
        uploadedFiles: state.uploadedFiles,
      }),
    }
  )
);
