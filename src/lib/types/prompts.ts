// Types for Example Prompts System

export interface PromptCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

// Define a more specific type for prompt metadata
export interface PromptMetadata {
  category?: string;
  [key: string]: unknown;
}

export interface ExamplePrompt {
  id: number;
  category_id: number;
  use_case: string;
  title: string;
  content: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  metadata: PromptMetadata;
}

export interface PromptUsage {
  id: number;
  prompt_id: number;
  session_id: number | null;
  used_at: Date;
  success_rating: number | null;
  metadata: Record<string, unknown>;
}

// Request/Response types for API endpoints
export interface CreatePromptCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdatePromptCategoryRequest
  extends Partial<CreatePromptCategoryRequest> {
  id: number;
}

export interface CreateExamplePromptRequest {
  category_id: number;
  use_case: string;
  title: string;
  content: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateExamplePromptRequest
  extends Partial<CreateExamplePromptRequest> {
  id: number;
}

export interface CreatePromptUsageRequest {
  prompt_id: number;
  session_id?: number;
  success_rating?: number;
  metadata?: Record<string, unknown>;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query parameters
export interface PromptQueryParams {
  use_case?: string;
  category_id?: number;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}
