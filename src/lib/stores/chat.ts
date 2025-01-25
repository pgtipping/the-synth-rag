import { create } from "zustand";
import { trackChatEvents } from "@/lib/analytics";

interface ReactionCounts {
  [reaction: string]: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  reactions: ReactionCounts;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (
    id: string,
    content: string | ((prev: string) => string)
  ) => void;
  addReaction: (messageId: string, reaction: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, reactions: {} }],
    })),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id
          ? {
              ...message,
              content:
                typeof content === "function"
                  ? content(message.content)
                  : content,
            }
          : message
      ),
    })),
  addReaction: (messageId, reaction) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactions: {
                ...message.reactions,
                [reaction]: (message.reactions[reaction] || 0) + 1,
              },
            }
          : message
      ),
    })),
  setIsTyping: (isTyping) => set({ isTyping }),
  clearMessages: () => set({ messages: [] }),
}));
