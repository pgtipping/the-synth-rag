"use client";

import { useChatStore } from "@/src/lib/stores/chat";
import { useAppStore } from "@/src/lib/stores/app";
import { ChatStream } from "@/src/components/chat/ChatStream";
import { ChatInput } from "@/src/components/chat/ChatInput";
import { FileUpload } from "@/src/components/file-upload";
import { Button } from "@/src/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { sendChatMessage } from "@/src/lib/api/chat";
import { useEffect, useState } from "react";
import { Sidebar } from "@/src/components/sidebar";
import { useFileStore } from "@/src/lib/store";
import { PromptRotation } from "@/src/components/prompts/prompt-rotation";

export default function ChatClient({ useCase }: { useCase: string }) {
  const { messages, isTyping, isLoading } = useChatStore();
  const {
    isUploadOpen,
    toggleUpload,
    setCurrentUseCase,
    isChatReady,
    setIsChatReady,
  } = useAppStore();
  const { files } = useFileStore();
  const currentFiles = files[useCase] || [];
  const hasCompletedFiles = currentFiles.some(
    (file) => file.status === "completed"
  );
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setCurrentUseCase(useCase);
    // Reset chat ready state when use case changes
    setIsChatReady(false);
  }, [useCase, setCurrentUseCase, setIsChatReady]);

  // Remove auto-collapse effect since we now use the Done button
  // useEffect(() => {
  //   if (hasCompletedFiles && isUploadOpen) {
  //     toggleUpload();
  //   }
  // }, [hasCompletedFiles, isUploadOpen, toggleUpload]);

  const handleSend = async (message: string) => {
    await sendChatMessage(message);
  };

  const handleUsePrompt = (promptText: string) => {
    setInputValue(promptText);
  };

  const handleDone = () => {
    if (hasCompletedFiles) {
      setIsChatReady(true);
      toggleUpload();
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar useCase={useCase} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="relative flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-auto p-4">
                <ChatStream
                  messages={messages}
                  isTyping={isTyping}
                  isLoading={isLoading}
                />
              </div>

              {/* Prompt Rotation Component */}
              {isChatReady && (
                <div className="px-4 py-2 border-t">
                  <PromptRotation
                    useCase={useCase}
                    onUsePrompt={handleUsePrompt}
                  />
                </div>
              )}

              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={toggleUpload}
                  >
                    {isUploadOpen ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Hide Files
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show Files
                      </>
                    )}
                  </Button>
                  {isUploadOpen && hasCompletedFiles && !isChatReady && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleDone}
                      className="ml-auto"
                    >
                      Done
                    </Button>
                  )}
                </div>
                {isUploadOpen && (
                  <div className="mt-4">
                    <FileUpload useCase={useCase} />
                  </div>
                )}
                <div className="mt-4">
                  <ChatInput
                    onSend={handleSend}
                    isSending={isLoading}
                    value={inputValue}
                    onChange={setInputValue}
                    disabled={!isChatReady}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
