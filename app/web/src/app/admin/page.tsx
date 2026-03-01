"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActivity, useAdminUsers, useMarkets } from "@/hooks/use-api";
import AdminNavigation from "../components/admin-navigation";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [marketsPage, setMarketsPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/admin/login");
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
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredMarkets = useMemo(() => {
    if (!normalizedSearch) return markets;
    return markets.filter((entry) =>
      [entry.title, entry.id, entry.category, entry.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [markets, normalizedSearch]);

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) return users;
    return users.filter((entry) =>
      [entry.name ?? "", entry.email, entry.role]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [users, normalizedSearch]);

  useEffect(() => {
    setUsersPage(1);
    setMarketsPage(1);
  }, [normalizedSearch]);

  const usersPageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const marketsPageCount = Math.max(1, Math.ceil(filteredMarkets.length / PAGE_SIZE));

  const pagedUsers = filteredUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);
  const pagedMarkets = filteredMarkets.slice((marketsPage - 1) * PAGE_SIZE, marketsPage * PAGE_SIZE);

  const openMarkets = filteredMarkets.filter((entry) => entry.status === "OPEN").length;
  const resolvedMarkets = filteredMarkets.length - openMarkets;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNavigation searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage markets, users, and live activity in one place.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader><CardTitle>Total Markets</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{filteredMarkets.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{filteredUsers.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Open Markets</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{openMarkets}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resolved Markets</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{resolvedMarkets}</p></CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pagedUsers.map((entry) => (
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
              {!filteredUsers.length ? <p className="text-sm text-muted-foreground">No users match your search.</p> : null}
              {filteredUsers.length > 0 ? (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {usersPage} of {usersPageCount}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={usersPage >= usersPageCount}
                    onClick={() => setUsersPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Market Status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pagedMarkets.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-sm text-muted-foreground">{entry.id}</p>
                  </div>
                  <Badge variant={entry.status === "OPEN" ? "secondary" : "default"}>{entry.status}</Badge>
                </div>
              ))}
              {!filteredMarkets.length ? <p className="text-sm text-muted-foreground">No markets match your search.</p> : null}
              {filteredMarkets.length > 0 ? (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={marketsPage <= 1}
                    onClick={() => setMarketsPage((page) => page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {marketsPage} of {marketsPageCount}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={marketsPage >= marketsPageCount}
                    onClick={() => setMarketsPage((page) => page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activity.slice(0, 10).map((entry) => (
              <div key={entry.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{entry.userName} predicted {entry.optionLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">Potential winnings: {entry.potentialWinnings} points</p>
              </div>
            ))}
            {!activity.length ? <p className="text-sm text-muted-foreground">No recent activity yet.</p> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
