"use client";

import { FileUpload } from "@/components/file-upload";

export default function KnowledgeUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Knowledge Hub Upload</h1>
      <FileUpload useCase="knowledge" />
    </div>
  );
}
