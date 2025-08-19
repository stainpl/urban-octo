"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/app/components/ui/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
