"use client";

import { useChatStore } from "@/lib/stores/chat";
import { Icons } from "../icons";

const reactions = ["👍", "👎", "❤️", "🔥", "🎉", "😄", "😕"];

interface MessageReactionsProps {
  messageId: string;
  initialReactions: Record<string, number>;
}

export function MessageReactions({
  messageId,
  initialReactions,
}: MessageReactionsProps) {
  const { addReaction } = useChatStore();

  const handleReaction = (reaction: string) => {
    addReaction(messageId, reaction);
  };

  return (
    <div className="flex gap-2 mt-2">
      {reactions.map((reaction) => (
        <button
          key={reaction}
          onClick={() => handleReaction(reaction)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="text-lg">{reaction}</span>
          {initialReactions[reaction] > 0 && (
            <span className="text-xs ml-1">{initialReactions[reaction]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
