import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Management - RAG Demo",
  description: "Manage your uploaded documents and their use cases",
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
