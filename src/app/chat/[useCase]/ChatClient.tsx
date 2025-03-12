"use client";

import { useChatStore } from "@/src/lib/stores/chat";
import { useAppStore } from "@/src/lib/stores/app";
import { ChatStream } from "@/src/components/chat/ChatStream";
import { ChatInput } from "@/src/components/chat/ChatInput";
import { Button } from "@/src/components/ui/button";
import { sendChatMessage } from "@/src/lib/api/chat";
import { useEffect, useState } from "react";
import { Sidebar } from "@/src/components/sidebar";
import { useFileStore } from "@/src/lib/store";
import { ChatPromptSuggestions } from "@/src/components/prompts/chat-prompt-suggestions";
import { DocumentSelector } from "../../../components/documents/document-selector";

interface Document {
  id: number;
  originalName: string;
  contentType: string;
  sizeBytes: number | string;
  status: string;
  createdAt: string | Date;
  useCase: string;
  errorMessage: string | null;
}

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
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);

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
    await sendChatMessage(
      message,
      selectedDocuments.map((doc) => doc.id)
    );
  };

  const handleUsePrompt = (
    promptText: string,
    needsCustomization: boolean = false
  ) => {
    // If the prompt needs customization, just set it in the input field
    setInputValue(promptText);

    // If it doesn't need customization, automatically send it
    if (!needsCustomization) {
      // Use requestAnimationFrame instead of setTimeout to avoid potential issues
      requestAnimationFrame(() => {
        sendChatMessage(
          promptText,
          selectedDocuments.map((doc) => doc.id)
        );
      });
    }
  };

  const handleDone = () => {
    if (hasCompletedFiles) {
      setIsChatReady(true);
      toggleUpload();
    }
  };

  const handleDocumentsSelected = (documents: Document[]) => {
    setSelectedDocuments(documents);
    if (documents.length > 0) {
      setIsChatReady(true);
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

              {/* Chat Prompt Suggestions Component */}
              {isChatReady && (
                <div className="px-4 py-2 border-t">
                  <ChatPromptSuggestions
                    useCase={useCase}
                    onSelectPrompt={handleUsePrompt}
                  />
                </div>
              )}

              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <DocumentSelector
                    useCase={useCase}
                    onDocumentsSelected={handleDocumentsSelected}
                    selectedDocumentIds={selectedDocuments.map((doc) => doc.id)}
                  />

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

                {selectedDocuments.length > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm font-medium">Selected Documents:</p>
                    <ul className="mt-1 space-y-1">
                      {selectedDocuments.map((doc) => (
                        <li
                          key={doc.id}
                          className="text-sm text-muted-foreground"
                        >
                          {doc.originalName}
                        </li>
                      ))}
                    </ul>
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
