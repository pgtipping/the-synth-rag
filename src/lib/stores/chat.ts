import { create } from "zustand";

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

// Updated ChatState interface to include isLoading
export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean; // Add isLoading property
  addMessage: (message: Message) => void;
  updateMessage: (
    id: string,
    content: string | ((prev: string) => string)
  ) => void;
  addReaction: (messageId: string, reaction: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsLoading: (isLoading: boolean) => void; // Add setIsLoading function
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  isLoading: false, // Initialize isLoading to false
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
  setIsLoading: (isLoading) => set({ isLoading }), // Add setIsLoading function
  clearMessages: () => set({ messages: [] }),
}));
