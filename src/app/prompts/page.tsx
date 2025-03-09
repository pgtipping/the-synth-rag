import { Suspense } from "react";
import { PromptList } from "@/src/components/prompts/prompt-list";
import { fetchPromptCategories } from "@/src/lib/api/prompts";

export const metadata = {
  title: "Example Prompts | RAG Demo",
  description: "Browse and use example prompts for different use cases",
};

export default async function PromptsPage() {
  const categories = await fetchPromptCategories();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Example Prompts</h1>
        <p className="mt-2 text-gray-500">
          Browse through our collection of example prompts or filter by category
          to find the perfect starting point for your use case.
        </p>
      </div>

      <Suspense fallback={<div>Loading prompts...</div>}>
        <PromptList categories={categories} showStats />
      </Suspense>
    </div>
  );
}
