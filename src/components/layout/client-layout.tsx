"use client";

import React from "react";
import { ThemeProvider } from "../theme-provider";
import { Header } from "./header";
import { Footer } from "./footer";
import { AuthProvider } from "@/src/lib/firebase/auth-context";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <div className="relative min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
