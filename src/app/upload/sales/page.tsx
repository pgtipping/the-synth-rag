"use client";

import { FileUpload } from "@/src/components/file-upload";

export default function SalesUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Sales Assistant Upload</h1>
      <FileUpload useCase="sales" />
    </div>
  );
}
