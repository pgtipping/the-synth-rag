export type ProgressStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "paused";

export type StepType =
  | "file_upload"
  | "document_processing"
  | "chat_interaction"
  | "analysis";

export interface ProgressSession {
  id: number;
  userId?: string;
  sessionId: string;
  useCase: string;
  startTime: Date;
  endTime?: Date;
  status: ProgressStatus;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressStep {
  id: number;
  sessionId: number;
  stepType: StepType;
  stepName: string;
  status: ProgressStatus;
  startTime?: Date;
  endTime?: Date;
  completionPercentage: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressMetric {
  id: number;
  sessionId: number;
  metricName: string;
  metricValue: number;
  recordedAt: Date;
}

export interface ProgressUpdate {
  stepType: StepType;
  stepName: string;
  status: ProgressStatus;
  completionPercentage: number;
  metadata?: Record<string, unknown>;
}

export interface SessionProgress {
  session: ProgressSession;
  currentStep?: ProgressStep;
  steps: ProgressStep[];
  metrics: ProgressMetric[];
}
