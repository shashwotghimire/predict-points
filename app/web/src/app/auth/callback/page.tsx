"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import type { User } from "@/app/contexts/auth-context";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let isActive = true;

    const completeLogin = async () => {
      const status = searchParams.get("status");
      if (status === "error") {
        if (isActive) {
          router.replace("/login?oauth=error");
        }
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        const user = data as User;
        if (!isActive) return;

        const destination =
          user.role === "ADMIN" || user.role === "SUPER_ADMIN"
            ? "/admin"
            : "/dashboard";
        router.replace(destination);
      } catch {
        if (isActive) {
          router.replace("/login?oauth=error");
        }
      }
    };

    void completeLogin();

    return () => {
      isActive = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
