export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex items-center justify-center h-16">
        <p className="text-sm text-center text-muted-foreground">
          © {new Date().getFullYear()} SynthBots. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
