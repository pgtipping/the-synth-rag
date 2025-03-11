import { create } from "zustand";
import { ProgressService } from "../services/progress-service";
import type { SessionProgress, ProgressUpdate } from "@/types/progress";

interface ProgressState {
  currentSession: SessionProgress | null;
  isLoading: boolean;
  error: string | null;
  service: ProgressService;

  // Actions
  startSession: (useCase: string, userId?: string) => Promise<void>;
  updateStep: (
    stepId: number,
    update: Partial<ProgressUpdate>
  ) => Promise<void>;
  completeSession: (completionPercentage: number) => Promise<void>;
  recordMetric: (name: string, value: number) => Promise<void>;
  createStep: (update: ProgressUpdate) => Promise<void>;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  error: null,
  service: new ProgressService(),

  startSession: async (useCase: string, userId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const session = await get().service.createSession(useCase, userId);
      set({
        currentSession: {
          session,
          steps: [],
          metrics: [],
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to start session",
        isLoading: false,
      });
    }
  },

  updateStep: async (stepId: number, update: Partial<ProgressUpdate>) => {
    try {
      set({ isLoading: true, error: null });
      const updatedStep = await get().service.updateStep(stepId, update);

      set((state) => {
        if (!state.currentSession) return state;

        const steps = state.currentSession.steps.map((step) =>
          step.id === stepId ? updatedStep : step
        );

        return {
          currentSession: {
            ...state.currentSession,
            steps,
            currentStep:
              updatedStep.status === "active"
                ? updatedStep
                : state.currentSession.currentStep,
          },
          isLoading: false,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update step",
        isLoading: false,
      });
    }
  },

  createStep: async (update: ProgressUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const { currentSession } = get();

      if (!currentSession) {
        throw new Error("No active session");
      }

      const newStep = await get().service.createStep(
        currentSession.session.id,
        update
      );

      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              steps: [...state.currentSession.steps, newStep],
              currentStep:
                update.status === "active"
                  ? newStep
                  : state.currentSession.currentStep,
            }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create step",
        isLoading: false,
      });
    }
  },

  completeSession: async (completionPercentage: number) => {
    try {
      set({ isLoading: true, error: null });
      const { currentSession } = get();

      if (!currentSession) {
        throw new Error("No active session");
      }

      const updatedSession = await get().service.completeSession(
        currentSession.session.sessionId,
        completionPercentage
      );

      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              session: updatedSession,
            }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to complete session",
        isLoading: false,
      });
    }
  },

  recordMetric: async (name: string, value: number) => {
    try {
      set({ isLoading: true, error: null });
      const { currentSession } = get();

      if (!currentSession) {
        throw new Error("No active session");
      }

      const newMetric = await get().service.recordMetric(
        currentSession.session.id,
        name,
        value
      );

      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              metrics: [newMetric, ...state.currentSession.metrics],
            }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to record metric",
        isLoading: false,
      });
    }
  },

  reset: () => {
    set({
      currentSession: null,
      isLoading: false,
      error: null,
    });
  },
}));
