"use client";

import { CaseCard } from "@/src/components/case-card";
import { Button } from "@/src/components/ui/button";
import { Icons } from "@/src/components/icons";
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
      {/* Main Content */}
      <main className="pt-header">
        <div className="max-w-[980px] mx-auto px-4 sm:px-5">
          {/* Hero Section */}
          <section className="py-10 sm:py-16 md:py-24 bg-gradient-light dark:bg-gradient-dark">
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="space-y-4 sm:space-y-6">
                <motion.div
                  key="title"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <h1 className="text-2xl sm:text-3xl md:text-heading-large font-semibold text-light-text-primary dark:text-dark-text-primary">
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
                  <p className="text-base sm:text-lg md:text-body-large text-light-text-secondary dark:text-dark-text-secondary">
                    Transform your documents into intelligent assistants with
                    our RAG-powered chatbot solutions
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
                    className="h-10 sm:h-header px-4 sm:px-6 rounded-button bg-light-accent hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                  >
                    <Link
                      href="#use-cases"
                      onClick={handleScrollToUseCases}
                      className="gap-2"
                    >
                      <Icons.play className="h-4 sm:h-5 w-4 sm:w-5" />
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
            className="py-12 sm:py-16 md:py-24 bg-light-secondary dark:bg-dark-secondary"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-light-secondary dark:bg-dark-secondary border-t border-black/10 dark:border-white/10">
        <div className="max-w-[980px] mx-auto px-4 sm:px-5 py-6 sm:py-10">
          <p className="text-xs sm:text-body-small text-light-text-secondary dark:text-dark-text-secondary text-center">
            2025 RAG Chatbot Demo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
