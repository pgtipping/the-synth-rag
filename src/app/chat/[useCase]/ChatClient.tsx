"use client";

import { useChatStore } from "@/src/lib/stores/chat";
import { useAppStore } from "@/src/lib/stores/app";
import { ChatStream } from "@/src/components/chat/ChatStream";
import { ChatInput } from "@/src/components/chat/ChatInput";
import { FileUpload } from "@/src/components/file-upload";
import { Button } from "@/src/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { sendChatMessage } from "@/src/lib/api/chat";
import { useEffect } from "react";
import { Sidebar } from "@/src/components/sidebar";
import { useFileStore } from "@/src/lib/store";

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

  const handleDone = () => {
    if (hasCompletedFiles) {
      setIsChatReady(true);
      toggleUpload();
    }
  };

  const useCaseConfig = {
    onboarding: {
      title: "Onboarding Assistant",
      uploadHints: {
        title: "Upload Onboarding Materials",
        description:
          "Add employee handbooks, policies, and training documents to get started.",
        exampleFiles: [
          "employee_handbook.pdf",
          "it_policies.docx",
          "training_guide.pdf",
        ],
      },
    },
    sales: {
      title: "Sales Assistant",
      uploadHints: {
        title: "Upload Sales Materials",
        description:
          "Add product specs, pricing sheets, and competitor analysis to get insights.",
        exampleFiles: [
          "product_catalog.pdf",
          "pricing_2024.xlsx",
          "market_analysis.docx",
        ],
      },
    },
    knowledge: {
      title: "Knowledge Hub",
      uploadHints: {
        title: "Upload Knowledge Base",
        description:
          "Add documentation, FAQs, and guides to build your knowledge base.",
        exampleFiles: ["technical_docs.pdf", "faq.docx", "best_practices.pdf"],
      },
    },
  };

  const currentConfig = useCaseConfig[useCase as keyof typeof useCaseConfig];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar useCase={useCase} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Fixed Header */}
        <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
          <div className="container flex items-center justify-between h-16 px-4">
            <h1 className="text-xl font-semibold">{currentConfig.title}</h1>
            <div className="flex items-center gap-4">
              {isChatReady && (
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
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 container px-4 py-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Collapsible Upload Zone */}
            {(isUploadOpen || !isChatReady) && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {currentConfig.uploadHints.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentConfig.uploadHints.description}
                  </p>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>Example files:</span>
                    {currentConfig.uploadHints.exampleFiles.map(
                      (file, index) => (
                        <span key={file} className="text-primary">
                          {file}
                          {index <
                            currentConfig.uploadHints.exampleFiles.length - 1 &&
                            ", "}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <FileUpload
                  useCase={useCase}
                  uploadHints={currentConfig.uploadHints}
                />
                {hasCompletedFiles && !isChatReady && (
                  <div className="flex flex-col items-center gap-4 mt-8 p-6 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                      Click the &ldquo;Done&rdquo; button when you have finished
                      uploading all the documents you want to use as context for
                      the assistant.
                    </p>
                    <Button
                      onClick={handleDone}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Chat Interface */}
            {isChatReady && (
              <div className="space-y-4">
                <ChatStream
                  messages={messages}
                  isTyping={isTyping}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </main>

        {/* Chat Input */}
        {isChatReady && (
          <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container max-w-4xl px-4 py-4">
              <ChatInput onSend={handleSend} isSending={isTyping} />
            </div>
          </footer>
        )}

        <Button
          variant="outline"
          onClick={() => {
            const files = useFileStore.getState().files[useCase] || [];
            console.log("[Debug] Current files:", files);
          }}
        >
          Debug Files
        </Button>
      </div>
    </div>
  );
}
