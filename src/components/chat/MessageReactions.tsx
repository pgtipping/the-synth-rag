"use client";

import * as React from "react";
import { Icons } from "../icons";

interface MessageReactionsProps {
  messageId: string;
  initialReactions: Record<string, number>;
  onReact?: (reaction: string) => void;
}

export function MessageReactions({
  messageId,
  initialReactions,
  onReact,
}: MessageReactionsProps) {
  const [reactions, setReactions] = React.useState(initialReactions);

  const handleReaction = (key: string) => {
    const newReactions = {
      ...reactions,
      [key]: (reactions[key] || 0) + 1,
    };
    setReactions(newReactions);
    onReact?.(key);
  };

  const reactionIcons = [
    { key: "thumbsUp", icon: Icons.thumbsUp, label: "Thumbs Up" },
    { key: "thumbsDown", icon: Icons.thumbsDown, label: "Thumbs Down" },
  ];

  return (
    <div className="flex gap-2 items-center mt-2" data-message-id={messageId}>
      {reactionIcons.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => handleReaction(key)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
          aria-label={label}
        >
          <Icon className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
          {reactions[key] > 0 && (
            <span className="ml-1 text-xs text-gray-500">{reactions[key]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
