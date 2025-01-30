"use client";

import { CaseCard } from "@/src/components/case-card";
import { Button } from "@/src/components/ui/button";
import { Icons } from "@/src/components/icons";
import ThemeToggle from "@/src/components/ui/theme-toggle";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const handleScrollToUseCases = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const useCasesSection = document.getElementById("use-cases");
    if (useCasesSection) {
      useCasesSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      {/* Header */}
      <header className="fixed top-0 w-full h-header bg-light-background/80 dark:bg-dark-background/80 backdrop-blur-[20px] border-b border-black/10 dark:border-white/10 z-50">
        <div className="h-full max-w-[980px] mx-auto px-5 flex items-center justify-between">
          <p className="text-body-small text-light-text-primary dark:text-dark-text-primary">
            RAG Chatbot
          </p>
          <ThemeToggle />
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-44px)] pt-header bg-gradient-light dark:bg-gradient-dark">
          <div className="max-w-[980px] h-full mx-auto px-5 py-24 flex flex-col items-center justify-center text-center">
            <div className="space-y-6">
              <motion.div
                key="title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <h1 className="text-heading-large font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Build Smarter Chatbots with AI + Your Data
                </h1>
              </motion.div>
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.1,
                }}
              >
                <p className="text-body-large text-light-text-secondary dark:text-dark-text-secondary">
                  Transform your documents into intelligent assistants with our
                  RAG-powered chatbot solutions
                </p>
              </motion.div>
              <motion.div
                key="cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.2,
                }}
              >
                <Button
                  size="lg"
                  asChild
                  className="h-header px-6 rounded-button bg-light-accent hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                >
                  <Link
                    href="#use-cases"
                    onClick={handleScrollToUseCases}
                    className="gap-2"
                  >
                    <Icons.play className="h-5 w-5" />
                    Try Now
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section
          id="use-cases"
          className="py-24 bg-light-secondary dark:bg-dark-secondary"
        >
          <div className="max-w-[980px] mx-auto px-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <CaseCard
                title="Onboarding Assistant"
                description="Streamline employee onboarding with AI-powered guidance"
                icon="users"
                href="/chat/onboarding"
              />
              <CaseCard
                title="Sales Assistant"
                description="Generate sales strategies from your product docs"
                icon="trendingUp"
                href="/chat/sales"
              />
              <CaseCard
                title="Knowledge Hub"
                description="Create a searchable knowledge base from your documents"
                icon="book"
                href="/chat/knowledge"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-light-secondary dark:bg-dark-secondary border-t border-black/10 dark:border-white/10">
        <div className="max-w-[980px] mx-auto px-5 py-10">
          <p className="text-body-small text-light-text-secondary dark:text-dark-text-secondary text-center">
            © 2025 RAG Chatbot Demo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
