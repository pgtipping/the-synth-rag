"use client";

import { useChatStore } from "@/lib/stores/chat";
import { ChatStream } from "@/components/chat/ChatStream";
import { ChatInput } from "@/components/chat/ChatInput";
import { sendChatMessage } from "@/lib/api/chat";

export default function ChatClient({ useCase }: { useCase: string }) {
  const { messages, isTyping } = useChatStore();

  const handleSend = async (message: string) => {
    await sendChatMessage(message);
  };

  return (
    <div className="grid grid-rows-[1fr_auto] min-h-screen p-8 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{useCase}</h1>
          <ChatStream messages={messages} isTyping={isTyping} />
        </div>
      </main>

      <footer className="mt-24 py-6 border-t text-sm text-muted-foreground text-center">
        <ChatInput onSend={handleSend} isSending={isTyping} />
      </footer>
    </div>
  );
}
