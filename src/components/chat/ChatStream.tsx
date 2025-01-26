"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { UserMessage } from "./UserMessage";
import { BotMessage } from "./BotMessage";
import { TypingIndicator } from "./TypingIndicator";
import { LoadingState } from "./LoadingState";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatStreamProps {
  messages: Message[];
  isTyping: boolean;
}

export function ChatStream({ messages, isTyping }: ChatStreamProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4">
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
            {message.role === "user" ? (
              <UserMessage text={message.content} messageId={message.id} />
            ) : (
              <BotMessage text={message.content} messageId={message.id} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isTyping && (
        <>
          <TypingIndicator />
          <LoadingState />
        </>
      )}
      <div ref={chatEndRef} />
    </div>
  );
}
