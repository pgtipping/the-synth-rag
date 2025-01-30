"use client";

import React from "react";
import { useChatStore } from "@/src/lib/stores/chat";
import { Icons } from "../icons";

// Create React elements for each icon
const reactions: React.ReactElement<React.SVGProps<SVGSVGElement>>[] = [
  React.createElement(Icons.thumbsUp, { key: "thumbsUp" }),
  React.createElement(Icons.thumbsDown, { key: "thumbsDown" }),
  React.createElement(Icons.heart, { key: "heart" }),
];

interface MessageReactionsProps {
  messageId: string;
  initialReactions: Record<string, number>;
}

export function MessageReactions({
  messageId,
  initialReactions,
}: MessageReactionsProps) {
  const { addReaction } = useChatStore();

  const handleReaction = (reaction: React.ReactElement) => {
    // Use the key as the reaction type
    const reactionType = reaction.key;
    addReaction(messageId, reactionType as string);
  };

  return (
    <div className="flex gap-2 mt-2">
      {reactions.map((reaction, index) => (
        <button
          key={index}
          onClick={() => handleReaction(reaction)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          {reaction}
          {initialReactions[reaction.key as string] > 0 && (
            <span className="text-xs ml-1">
              {initialReactions[reaction.key as string]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
