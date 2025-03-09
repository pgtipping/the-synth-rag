"use client";

import { useEffect, useState } from "react";
import { ExamplePrompt } from "@/src/lib/types/prompts";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";

interface PromptRotationProps {
  useCase: string;
  onUsePrompt: (prompt: string) => void;
}

export function PromptRotation({ useCase, onUsePrompt }: PromptRotationProps) {
  const [currentPrompt, setCurrentPrompt] = useState<ExamplePrompt | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomPrompt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/prompts/random?use_case=${useCase}&is_active=true`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch random prompt");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch random prompt");
      }
      setCurrentPrompt(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPrompt();
  }, [useCase]);

  const handleUsePrompt = () => {
    if (currentPrompt) {
      // Track usage
      fetch("/api/prompts/usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_id: currentPrompt.id,
        }),
      }).catch((err) => console.error("Failed to track prompt usage:", err));

      // Pass the prompt content to the parent component
      onUsePrompt(currentPrompt.content);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-muted/50">
        <CardHeader className="p-4">
          <CardTitle className="text-sm">Loading example prompt...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-muted/50">
        <CardHeader className="p-4">
          <CardTitle className="text-sm text-red-500">
            Error loading prompt
          </CardTitle>
          <CardDescription className="text-xs">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!currentPrompt) {
    return (
      <Card className="w-full bg-muted/50">
        <CardHeader className="p-4">
          <CardTitle className="text-sm">
            No example prompts available
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-muted/50 hover:bg-muted/70 transition-colors">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm">{currentPrompt.title}</CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {currentPrompt.content}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchRandomPrompt}
              title="Get another example"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8"
              onClick={handleUsePrompt}
            >
              Use
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
