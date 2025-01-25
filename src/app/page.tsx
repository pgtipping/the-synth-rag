import { CaseCard } from "@/components/case-card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr_auto] min-h-screen p-8 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Build Smarter Chatbots with AI + Your Data
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your documents into intelligent assistants with our
            RAG-powered chatbot solutions
          </p>
          <Button className="gap-2" asChild>
            <Link href="/chat/sales-assistant">
              <Icons.play className="h-4 w-4" />
              Try Now
            </Link>
          </Button>
        </div>

        {/* Use Case Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          <CaseCard
            title="Onboarding Assistant"
            description="Streamline employee onboarding with AI-powered guidance"
            icon="users"
            href="/upload/onboarding"
          />
          <CaseCard
            title="Sales Assistant"
            description="Generate sales strategies from your product docs"
            icon="trendingUp"
            href="/upload/sales"
          />
          <CaseCard
            title="Knowledge Hub"
            description="Create a searchable knowledge base from your documents"
            icon="book"
            href="/upload/knowledge"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 py-6 border-t text-sm text-muted-foreground text-center">
        <p>© 2025 RAG Chatbot Demo. All rights reserved.</p>
      </footer>
    </div>
  );
}
