
interface AnalyticsEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];

  private constructor() {}

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  public track(eventType: string, data: Record<string, unknown> = {}) {
    const event = {
      type: eventType,
      data,
      timestamp: Date.now(),
    };
    this.events.push(event);
    this.sendToServer(event);
  }

  private sendToServer(event: AnalyticsEvent) {
    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }).catch((error) => {
      console.error("Error sending analytics:", error);
    });
  }

  public getEvents() {
    return this.events;
  }
}

export const analytics = Analytics.getInstance();

// Track chat events
export function trackChatEvents(store: {
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    reactions: Record<string, number>;
  }[];
  isTyping: boolean;
  addMessage: (message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    reactions: Record<string, number>;
  }) => void;
  addReaction: (messageId: string, reaction: string) => void;
}) {
  // Track message sent
  store.addMessage = (message) => {
    analytics.track("message_sent", {
      role: message.role,
      length: message.content.length,
    });
    return store.addMessage(message);
  };

  // Track reaction added
  store.addReaction = (messageId, reaction) => {
    analytics.track("reaction_added", {
      messageId,
      reaction,
    });
    return store.addReaction(messageId, reaction);
  };
}
