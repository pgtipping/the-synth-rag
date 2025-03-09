"use client";

import { DocumentManager } from "../../components/documents/document-manager";

export default function DocumentsPage() {
  return (
    <main className="container py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Document Management
          </h1>
          <p className="text-lg text-gray-500 mt-2">
            View and manage your uploaded documents across different use cases
          </p>
        </div>
        <DocumentManager />
      </div>
    </main>
  );
}
