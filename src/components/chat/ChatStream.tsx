"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { UserMessage } from "./UserMessage";
import { BotMessage } from "./BotMessage";
import { TypingIndicator } from "./TypingIndicator";
import { LoadingState } from "./LoadingState";

// Define the type for chat messages
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Define the type for props passed to the ChatStream component
interface ChatStreamProps {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean; // Add isLoading prop
}

// ChatStream component
export function ChatStream({ messages, isTyping, isLoading }: ChatStreamProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom of the chat after every message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-4">
      {/* Conditionally render LoadingState if isLoading is true */}
      {isLoading && <LoadingState />}
      {/* AnimatePresence for smooth transitions */}
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
            {/* Conditionally render UserMessage or BotMessage based on message role */}
            {message.role === "user" ? (
              <UserMessage text={message.content} messageId={message.id} />
            ) : (
              <BotMessage text={message.content} messageId={message.id} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {/* Conditionally render TypingIndicator if isTyping is true */}
      {isTyping && <TypingIndicator />}
      <div ref={chatEndRef} /> {/* Ref for auto-scrolling */}
    </div>
  );
}
