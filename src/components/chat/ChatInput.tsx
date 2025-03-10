"use client";

import { Dispatch, SetStateAction } from "react";
import { Button } from "@/src/components/ui/button";
import { Icons } from "../icons";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value?.trim()) {
        handleSubmit(e);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative p-4 bg-background border-t"
    >
      <div className="relative flex items-end max-w-4xl mx-auto">
        <Textarea
          className={cn(
            "resize-none pr-12 min-h-[50px] max-h-[200px]",
            "rounded-2xl",
            "focus-visible:ring-1 focus-visible:ring-offset-0",
            "placeholder:text-muted-foreground",
            "text-base"
          )}
          placeholder="Type your message..."
          value={value || ""}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          className={cn(
            "absolute right-2 bottom-2",
            "h-8 w-8",
            "bg-primary hover:bg-primary/90",
            "rounded-full"
          )}
          disabled={disabled || isSending || !value?.trim()}
        >
          {isSending ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
