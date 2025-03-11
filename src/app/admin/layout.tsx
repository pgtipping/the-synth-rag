import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold">
              RAG Demo
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/admin/prompts"
                className="text-sm font-medium hover:underline"
              >
                Prompts
              </Link>
              <Link
                href="/admin/analytics"
                className="text-sm font-medium hover:underline"
              >
                Analytics
              </Link>
              <Link
                href="/admin/token-usage"
                className="text-sm font-medium hover:underline"
              >
                Token Usage
              </Link>
              <Link
                href="/admin/progress"
                className="text-sm font-medium hover:underline"
              >
                Progress
              </Link>
            </nav>
          </div>
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:underline"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
