"use client";

import { useEffect, useState } from "react";
import {
  ExamplePrompt,
  PromptCategory,
  PromptQueryParams,
} from "@/src/lib/types/prompts";
import { PromptCard } from "./prompt-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

interface PromptListProps {
  useCase?: string;
  categories: PromptCategory[];
  onUsePrompt?: (prompt: ExamplePrompt) => void;
  showStats?: boolean;
}

export function PromptList({
  useCase,
  categories,
  onUsePrompt,
  showStats,
}: PromptListProps) {
  const [prompts, setPrompts] = useState<ExamplePrompt[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async (params: PromptQueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params.use_case) queryParams.set("use_case", params.use_case);
      if (params.category_id)
        queryParams.set("category_id", params.category_id.toString());
      if (params.page) queryParams.set("page", params.page.toString());
      if (params.pageSize)
        queryParams.set("pageSize", params.pageSize.toString());
      queryParams.set("is_active", "true");

      const response = await fetch(`/api/prompts?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch prompts");
      }

      setPrompts(data.data.items);
      setTotalPages(data.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts({
      use_case: useCase,
      category_id:
        selectedCategory && selectedCategory !== "all"
          ? parseInt(selectedCategory, 10)
          : undefined,
      page: currentPage,
      pageSize: 10,
      is_active: true,
    });
  }, [useCase, selectedCategory, currentPage]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return <div className="text-center text-red-500 py-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading prompts...</div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No prompts found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onUse={onUsePrompt}
              showStats={showStats}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="py-2 px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
