import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "../components/layout/client-layout";

export const metadata: Metadata = {
  title: "RAG Chatbot",
  description: "Build smarter chatbots with AI + your data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
