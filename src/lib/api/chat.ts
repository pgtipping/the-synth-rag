import { useChatStore } from "../../lib/stores/chat";
import { analytics } from "../../lib/analytics";

export async function sendChatMessage(message: string, documentIds?: number[]) {
  const store = useChatStore.getState();

  // Validate message
  if (!message || message.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  // Add user message
  const userMessage = {
    id: crypto.randomUUID(),
    role: "user" as const,
    content: message.trim(),
    timestamp: Date.now(),
    reactions: {},
  };
  store.addMessage(userMessage);

  // Add assistant message placeholder
  const assistantMessageId = crypto.randomUUID();
  const assistantMessage = {
    id: assistantMessageId,
    role: "assistant" as const,
    content: "",
    timestamp: Date.now(),
    reactions: {},
  };
  store.addMessage(assistantMessage);

  try {
    store.setIsTyping(true);

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [userMessage].map(({ role, content }) => ({
          role,
          content,
        })),
        documentIds: documentIds || [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to send message");
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to read response stream");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      store.updateMessage(assistantMessageId, (prev) => prev + text);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Format the error message for display
    let displayMessage = "⚠️ ";
    if (errorMessage.includes("OpenAI API error")) {
      displayMessage +=
        "The AI service is currently unavailable. Please try again later.";
    } else if (errorMessage.includes("Vector database error")) {
      displayMessage +=
        "Unable to access the knowledge base. Please ensure documents are properly uploaded.";
    } else if (errorMessage.includes("No relevant context found")) {
      displayMessage +=
        "No relevant information found. Please try rephrasing your question or upload relevant documents.";
    } else if (errorMessage.includes("Too many requests")) {
      displayMessage +=
        "You're sending messages too quickly. Please wait a moment and try again.";
    } else {
      displayMessage += "Something went wrong. Please try again later.";
    }

    store.updateMessage(
      assistantMessageId,
      (prev) => prev + `\n\n${displayMessage}`
    );

    analytics.track("chat_error", {
      error: errorMessage,
    });
  } finally {
    store.setIsTyping(false);
  }
}
