"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  useEffect(() => {
    let isActive = true;

    const completeLogin = async () => {
      if (status !== "success") {
        if (isActive) {
          router.replace("/login?oauth=error");
        }
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (!isActive) return;

        const role =
          typeof data === "object" &&
          data !== null &&
          "role" in data &&
          typeof data.role === "string"
            ? data.role
            : null;

        const destination =
          role === "ADMIN" || role === "SUPER_ADMIN"
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
  }, [router, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Completing sign in...</p>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
