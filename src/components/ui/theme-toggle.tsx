"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className="rounded-lg p-2 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 ring-1 ring-black/10 dark:ring-white/20"
      aria-label={
        resolvedTheme === "light"
          ? "Switch to dark theme"
          : "Switch to light theme"
      }
    >
      {resolvedTheme === "light" ? (
        <Moon className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
      ) : (
        <Sun className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
      )}
    </button>
  );
}
