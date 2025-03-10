import { PromptAnalytics } from "@/src/components/prompts/admin/prompt-analytics";

// Add dynamic rendering to prevent static generation
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics | Example Prompts | RAG Demo",
  description: "View analytics for example prompts usage",
};

export default function AnalyticsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Prompt Usage Analytics</h1>
        <p className="mt-2 text-gray-500">
          View usage statistics and performance metrics for example prompts.
        </p>
      </div>

      <PromptAnalytics />
    </div>
  );
}
