import { useCallback } from "react";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // In a real implementation, this would show a toast notification
    // For tests, we just need the mock implementation
    console.log("Toast:", options);
  }, []);

  return { toast };
}
