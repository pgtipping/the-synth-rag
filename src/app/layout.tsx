import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

const geist = Geist({
  subsets: ["latin"],
});

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
      <body className={`${geist.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-white dark:bg-zinc-950">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
