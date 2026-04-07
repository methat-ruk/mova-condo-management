"use client";

import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
}
