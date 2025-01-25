import { useChatStore } from "@/lib/stores/chat";
import { analytics } from "@/lib/analytics";

export async function sendChatMessage(message: string) {
  const store = useChatStore.getState();

  // Add user message
  store.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    content: message,
    timestamp: Date.now(),
    reactions: {},
  });

  // Add assistant message placeholder
  const assistantMessageId = crypto.randomUUID();
  store.addMessage({
    id: assistantMessageId,
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    reactions: {},
  });

  try {
    store.setIsTyping(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: store.messages
          .filter((m) => m.content)
          .map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to read response");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      store.updateMessage(assistantMessageId, (prev) => prev + text);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    store.updateMessage(
      assistantMessageId,
      (prev) => prev + "\n\n⚠️ Sorry, something went wrong. Please try again."
    );
    analytics.track("chat_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    store.setIsTyping(false);
  }
}
