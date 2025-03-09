"use client";

import { ExamplePrompt } from "@/src/lib/types/prompts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useState } from "react";

interface PromptCardProps {
  prompt: ExamplePrompt;
  onUse?: (prompt: ExamplePrompt) => void;
  showStats?: boolean;
  usageStats?: {
    total_uses: number;
    avg_rating: number | null;
  };
}

export function PromptCard({
  prompt,
  onUse,
  showStats,
  usageStats,
}: PromptCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUse = async () => {
    if (!onUse) return;
    setIsLoading(true);
    try {
      await onUse(prompt);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{prompt.title}</CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-500">
              {prompt.description}
            </CardDescription>
          </div>
          <Badge variant={prompt.is_active ? "default" : "secondary"}>
            {prompt.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <div className="p-[30px] pt-0">
        <div className="space-y-4">
          <div className="text-sm">{prompt.content}</div>

          {showStats && usageStats && (
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div>Uses: {usageStats.total_uses}</div>
              {usageStats.avg_rating && (
                <div>Rating: {usageStats.avg_rating.toFixed(1)} / 5</div>
              )}
            </div>
          )}

          {onUse && (
            <div className="flex justify-end">
              <Button
                onClick={handleUse}
                disabled={isLoading || !prompt.is_active}
                className="w-24"
              >
                {isLoading ? "Using..." : "Use"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
