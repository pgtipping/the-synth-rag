"use client";

import { ExamplePrompt } from "@/src/lib/types/prompts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleUse = async () => {
    if (!onUse) return;
    setIsLoading(true);
    try {
      await onUse(prompt);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryInChat = () => {
    // Navigate to the chat page with the specific use case
    router.push(`/chat/${prompt.use_case}`);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">
              {prompt.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
              {prompt.description}
            </CardDescription>
          </div>
          <Badge
            variant={prompt.is_active ? "default" : "secondary"}
            className="shrink-0"
          >
            {prompt.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <div className="p-4 sm:p-[30px] pt-0 flex-1 flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="text-xs sm:text-sm flex-1 overflow-hidden">
            <p className="line-clamp-4">{prompt.content}</p>
          </div>

          {showStats && usageStats && (
            <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
              <div>Uses: {usageStats.total_uses}</div>
              {usageStats.avg_rating && (
                <div>Rating: {usageStats.avg_rating.toFixed(1)} / 5</div>
              )}
            </div>
          )}

          {onUse && (
            <div className="flex flex-wrap justify-end gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTryInChat}
                disabled={!prompt.is_active}
                className="text-xs sm:text-sm"
              >
                Try in Chat
              </Button>
              <Button
                onClick={handleUse}
                disabled={isLoading || !prompt.is_active}
                size="sm"
                className="text-xs sm:text-sm w-16 sm:w-24"
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
