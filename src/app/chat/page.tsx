"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Home, ChevronRight } from "lucide-react";

const USE_CASES = [
  { value: "general", label: "General" },
  { value: "onboarding", label: "Onboarding Assistant" },
  { value: "sales", label: "Sales Assistant" },
  { value: "knowledge", label: "Knowledge Hub" },
];

export default function ChatPage() {
  const [selectedUseCase, setSelectedUseCase] = useState<string>("general");
  const router = useRouter();

  const handleStartChat = () => {
    router.push(`/chat/${selectedUseCase}`);
  };

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex mb-4 sm:mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <Home className="h-4 w-4" />
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <Link
              href="/chat"
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              Chat
            </Link>
          </li>
        </ol>
      </nav>

      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Chat Assistant
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Select a use case to start chatting with our AI assistant
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">
              Select Use Case
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Choose a specific use case or select &quot;General&quot; for a
              versatile assistant
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Use Case</label>
              <Select
                value={selectedUseCase}
                onValueChange={setSelectedUseCase}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a use case" />
                </SelectTrigger>
                <SelectContent>
                  {USE_CASES.map((useCase) => (
                    <SelectItem key={useCase.value} value={useCase.value}>
                      {useCase.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleStartChat}>
              Start Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
