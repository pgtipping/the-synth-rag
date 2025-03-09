export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-sm text-muted-foreground">
          Built with Next.js, Tailwind CSS, and Shadcn/ui
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} RAG Demo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
