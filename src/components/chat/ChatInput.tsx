"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Icons } from "../icons";

interface ChatInputProps {
  onSend: (message: string) => void;
  isSending: boolean;
}

export function ChatInput({ onSend, isSending }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isSending}
      />
      <Button type="submit" disabled={isSending || !message.trim()}>
        {isSending ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
