"use client";

import { Dispatch, SetStateAction } from "react";
import { Button } from "../ui/button";
import { Icons } from "../icons";

interface ChatInputProps {
  onSend: (message: string) => void;
  isSending: boolean;
  value?: string;
  onChange?: Dispatch<SetStateAction<string>>;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isSending,
  value,
  onChange,
  disabled = false,
}: ChatInputProps) {
  const controlled = value !== undefined && onChange !== undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!controlled) return;

    if (value.trim()) {
      onSend(value);
      onChange("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-16 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Type your message..."
        rows={1}
        value={value || ""}
        onChange={handleChange}
        disabled={disabled || isSending}
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-2 top-2"
        disabled={disabled || isSending || !value?.trim()}
      >
        {isSending ? (
          <Icons.spinner className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
