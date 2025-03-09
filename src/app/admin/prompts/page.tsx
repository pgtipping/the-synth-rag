import { Suspense } from "react";
import { PromptManager } from "@/src/components/prompts/admin/prompt-manager";
import { fetchPromptCategories } from "@/src/lib/api/prompts";

export const metadata = {
  title: "Admin | Example Prompts | RAG Demo",
  description: "Manage example prompts for different use cases",
};

export default async function AdminPromptsPage() {
  const categories = await fetchPromptCategories();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Example Prompts</h1>
        <p className="mt-2 text-gray-500">
          Create, edit, and manage example prompts for different use cases.
        </p>
      </div>

      <Suspense fallback={<div>Loading prompt manager...</div>}>
        <PromptManager categories={categories} />
      </Suspense>
    </div>
  );
}
