"use client";

import { FileUpload } from "@/components/file-upload";

export default function OnboardingUploadPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Onboarding Assistant</h1>
      <FileUpload useCase="onboarding" />
    </div>
  );
}
