import { Suspense } from "react";
import { PromptList } from "@/src/components/prompts/prompt-list";
import { fetchPromptCategories } from "@/src/lib/api/prompts";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

// Add dynamic rendering to prevent static generation
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Example Prompts | RAG Demo",
  description: "Browse and use example prompts for different use cases",
};

export default async function PromptsPage() {
  const categories = await fetchPromptCategories();

  return (
    <div className="container py-4 sm:py-8 px-4">
      {/* Breadcrumb */}
      <nav className="flex mb-4 sm:mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <Home className="h-4 w-4" />
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <Link
              href="/prompts"
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              Prompts
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Example Prompts</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500">
          Browse through our collection of example prompts or filter by category
          to find the perfect starting point for your use case.
        </p>
      </div>

      <Suspense
        fallback={<div className="py-8 text-center">Loading prompts...</div>}
      >
        <PromptList categories={categories} showStats />
      </Suspense>
    </div>
  );
}
