"use client";

import { useState, useEffect } from "react";
import { ExamplePrompt, PromptMetadata } from "@/src/lib/types/prompts";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Edit, MessageSquare } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ChatPromptSuggestionsProps {
  useCase: string;
  onSelectPrompt: (promptText: string, needsCustomization: boolean) => void;
}

// Helper function to safely get category
const getCategory = (metadata: PromptMetadata | undefined): string => {
  return metadata?.category || "General";
};

export function ChatPromptSuggestions({
  useCase,
  onSelectPrompt,
}: ChatPromptSuggestionsProps) {
  const [prompts, setPrompts] = useState<ExamplePrompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("use_case", useCase);
        queryParams.set("is_active", "true");
        queryParams.set("pageSize", "20"); // Get more prompts for suggestions

        const response = await fetch(`/api/prompts?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch prompts");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch prompts");
        }

        setPrompts(data.data.items);

        // Extract unique categories from prompts
        const uniqueCategories = Array.from(
          new Set(
            data.data.items.map((prompt: ExamplePrompt) =>
              getCategory(prompt.metadata)
            )
          )
        );
        setCategories(["all", ...uniqueCategories]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching prompts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [useCase]);

  // Check if a prompt needs customization (contains placeholders like [text] or {variable})
  const needsCustomization = (promptText: string): boolean => {
    return /\[.*?\]|\{.*?\}/.test(promptText);
  };

  // Filter prompts by selected category
  const filteredPrompts =
    selectedCategory === "all"
      ? prompts
      : prompts.filter(
          (prompt) => getCategory(prompt.metadata) === selectedCategory
        );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <div className="animate-pulse">Loading suggestions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm py-2">
        Error loading suggestions: {error}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-2">
        No prompt suggestions available for this use case.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Suggested prompts</h3>
        {categories.length > 1 && (
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="h-8"
          >
            <TabsList className="h-8">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs h-7"
                >
                  {category === "all" ? "All" : category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filteredPrompts.map((prompt) => {
          const requiresCustomization = needsCustomization(prompt.content);

          return (
            <Button
              key={prompt.id}
              variant="outline"
              size="sm"
              className={cn(
                "text-xs py-1 px-3 h-auto flex items-center gap-1.5 max-w-full",
                requiresCustomization
                  ? "border-amber-300"
                  : "border-muted-foreground/20"
              )}
              onClick={() =>
                onSelectPrompt(prompt.content, requiresCustomization)
              }
            >
              {requiresCustomization ? (
                <Edit className="h-3 w-3 text-amber-500" />
              ) : (
                <MessageSquare className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="truncate">{prompt.title}</span>
              {requiresCustomization && (
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 h-4 bg-amber-50 text-amber-700 border-amber-200"
                >
                  Customize
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
