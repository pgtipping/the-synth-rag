"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { TypingIndicator } from "./TypingIndicator";
import { LoadingState } from "./LoadingState";
import { Message } from "@/src/types/chat";
import { MessageReactions } from "./MessageReactions";
import { cn } from "@/src/lib/utils";

interface ChatStreamProps {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean;
}

export function ChatStream({ messages, isTyping, isLoading }: ChatStreamProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4">
      {isLoading && <LoadingState />}
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "tween"
                : "spring",
              stiffness: 300,
              damping: 20,
              delay: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? 0
                : 0.1 * index,
            }}
          >
            <div
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" && (
                  <div className="mt-2">
                    <MessageReactions
                      messageId={message.id}
                      initialReactions={message.reactions}
                      onReact={(reaction) => console.log(reaction)}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {isTyping && <TypingIndicator />}
      <div ref={chatEndRef} />
    </div>
  );
}
