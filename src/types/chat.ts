export interface ReactionCounts {
  [reaction: string]: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  reactions: ReactionCounts;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean;
}
