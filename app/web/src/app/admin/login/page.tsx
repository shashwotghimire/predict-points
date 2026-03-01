"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/app/components/login-form";
import { useAuth } from "@/app/contexts/auth-context";

export default function AdminLoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }
    router.push("/dashboard");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground">PP</div>
            <div>
              <p className="text-base font-semibold">PredictPoints</p>
              <p className="text-[11px] text-muted-foreground">Admin Login</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <LoginForm mode="admin" redirectOnSuccess="/admin" />
      </main>
    </div>
  );
}
