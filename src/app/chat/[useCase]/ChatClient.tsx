"use client";

import { useChatStore } from "@/lib/stores/chat";
import { useAppStore } from "@/lib/stores/app";
import { ChatStream } from "@/components/chat/ChatStream";
import { ChatInput } from "@/components/chat/ChatInput";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { sendChatMessage } from "@/lib/api/chat";
import { useEffect } from "react";

export default function ChatClient({ useCase }: { useCase: string }) {
  const { messages, isTyping } = useChatStore();
  const { isUploadOpen, toggleUpload, uploadedFiles, setCurrentUseCase } =
    useAppStore();

  useEffect(() => {
    setCurrentUseCase(useCase);
  }, [useCase, setCurrentUseCase]);

  const handleSend = async (message: string) => {
    await sendChatMessage(message);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            Back
          </Button>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleUpload}
              className="gap-2"
            >
              {isUploadOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              {isUploadOpen ? "Hide Upload" : "Show Upload"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Collapsible Upload Zone */}
          {isUploadOpen && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upload Files</h2>
              <FileUpload useCase={useCase} />
            </div>
          )}

          {/* Chat Interface */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Chat</h2>
              <ChatStream messages={messages} isTyping={isTyping} />
            </div>
          )}
        </div>
      </main>

      {/* Chat Input */}
      {uploadedFiles.length > 0 && (
        <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
          <div className="container max-w-6xl px-4 py-4">
            <ChatInput onSend={handleSend} isSending={isTyping} />
          </div>
        </footer>
      )}
    </div>
  );
}
