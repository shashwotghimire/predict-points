"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActivity, useAdminUsers, useMarkets } from "@/hooks/use-api";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (!isLoading && user && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  const marketsQuery = useMarkets({});
  const activityQuery = useActivity();
  const usersQuery = useAdminUsers(Boolean(user && ["ADMIN", "SUPER_ADMIN"].includes(user.role)));

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return null;
  }

  const markets = marketsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const users = usersQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage markets, users, and live activity.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Total Markets</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{markets.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{users.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{activity.length}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {users.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{entry.name ?? "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{entry.email}</p>
                </div>
                <div className="text-right">
                  <Badge>{entry.role}</Badge>
                  <p className="text-sm mt-1 text-primary font-semibold">{entry.points} pts</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Market Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {markets.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-sm text-muted-foreground">{entry.id}</p>
                </div>
                <Badge variant={entry.status === "OPEN" ? "secondary" : "default"}>{entry.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
