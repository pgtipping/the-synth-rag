import { PromptCategory } from "../types/prompts";

export async function fetchPromptCategories(): Promise<PromptCategory[]> {
  // Get the base URL from environment or default to localhost in development
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/prompts/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch prompt categories");
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch prompt categories");
  }

  return data.data;
}
