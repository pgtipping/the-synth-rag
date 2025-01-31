"use client";

import * as React from "react";
import { Icons } from "../icons";

interface MessageReactionsProps {
  onReact: (reaction: string) => void;
}

export function MessageReactions({ onReact }: MessageReactionsProps) {
  const reactionIcons = [
    { key: "thumbsUp", icon: Icons.thumbsUp, label: "Thumbs Up" },
    { key: "thumbsDown", icon: Icons.thumbsDown, label: "Thumbs Down" },
  ];

  return (
    <div className="flex gap-2 items-center">
      {reactionIcons.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onReact(key)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label={label}
        >
          <Icon className="h-4 w-4 text-gray-500" />
        </button>
      ))}
    </div>
  );
}
