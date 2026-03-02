"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActivity,
  useAdminUsers,
  useCreateReward,
  useDeleteReward,
  useMarkets,
  useRewardsCatalog,
  useUpdateReward,
} from "@/hooks/use-api";
import AdminNavigation from "../components/admin-navigation";
import { RewardType } from "@/lib/api/types";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isAdmin = Boolean(user && ["ADMIN", "SUPER_ADMIN"].includes(user.role));
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [marketsPage, setMarketsPage] = useState(1);
  const [rewardsPage, setRewardsPage] = useState(1);
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardType, setNewRewardType] = useState<RewardType>("OTHER");
  const [newRewardPoints, setNewRewardPoints] = useState(100);
  const [newRewardIconKey, setNewRewardIconKey] = useState("gift");
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editRewardName, setEditRewardName] = useState("");
  const [editRewardDescription, setEditRewardDescription] = useState("");
  const [editRewardType, setEditRewardType] = useState<RewardType>("OTHER");
  const [editRewardPoints, setEditRewardPoints] = useState(100);
  const [editRewardIconKey, setEditRewardIconKey] = useState("gift");
  const [editRewardActive, setEditRewardActive] = useState(true);
  const [rewardError, setRewardError] = useState<string | null>(null);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const marketsQuery = useMarkets({}, { enabled: isAdmin });
  const activityQuery = useActivity({ limit: 10, enabled: isAdmin });
  const usersQuery = useAdminUsers(isAdmin);
  const rewardsQuery = useRewardsCatalog({
    search: debouncedSearchTerm.trim() || undefined,
    includeInactive: true,
    page: rewardsPage,
    pageSize: PAGE_SIZE,
    enabled: isAdmin,
  });
  const createRewardMutation = useCreateReward();
  const updateRewardMutation = useUpdateReward();
  const deleteRewardMutation = useDeleteReward();

  const markets = useMemo(() => marketsQuery.data ?? [], [marketsQuery.data]);
  const activity = activityQuery.data ?? [];
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const rewards = rewardsQuery.data?.items ?? [];
  const rewardsPageCount = rewardsQuery.data?.pageCount ?? 1;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setUsersPage(1);
    setMarketsPage(1);
    setRewardsPage(1);
  }, []);

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

  const usersPageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE)),
    [filteredUsers.length]
  );
  const marketsPageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredMarkets.length / PAGE_SIZE)),
    [filteredMarkets.length]
  );

  const pagedUsers = useMemo(
    () => filteredUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE),
    [filteredUsers, usersPage]
  );
  const pagedMarkets = useMemo(
    () => filteredMarkets.slice((marketsPage - 1) * PAGE_SIZE, marketsPage * PAGE_SIZE),
    [filteredMarkets, marketsPage]
  );

  const { openMarkets, resolvedMarkets } = useMemo(() => {
    const openCount = filteredMarkets.filter((entry) => entry.status === "OPEN").length;
    return {
      openMarkets: openCount,
      resolvedMarkets: filteredMarkets.length - openCount,
    };
  }, [filteredMarkets]);

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

  const handleCreateReward = async () => {
    setRewardError(null);
    if (!newRewardName.trim()) {
      setRewardError("Reward name is required.");
      return;
    }
    if (!Number.isFinite(newRewardPoints) || newRewardPoints < 1) {
      setRewardError("Points required must be at least 1.");
      return;
    }

    try {
      await createRewardMutation.mutateAsync({
        name: newRewardName.trim(),
        description: newRewardDescription.trim() || undefined,
        type: newRewardType,
        pointsRequired: Math.floor(newRewardPoints),
        iconKey: newRewardIconKey.trim() || undefined,
        isActive: true,
      });
      setNewRewardName("");
      setNewRewardDescription("");
      setNewRewardType("OTHER");
      setNewRewardPoints(100);
      setNewRewardIconKey("gift");
    } catch {
      setRewardError("Failed to create reward.");
    }
  };

  const handleStartRewardEdit = (reward: {
    id: string;
    name: string;
    description?: string | null;
    type: RewardType;
    pointsRequired: number;
    iconKey?: string | null;
    isActive: boolean;
  }) => {
    setEditingRewardId(reward.id);
    setEditRewardName(reward.name);
    setEditRewardDescription(reward.description ?? "");
    setEditRewardType(reward.type);
    setEditRewardPoints(reward.pointsRequired);
    setEditRewardIconKey(reward.iconKey ?? "gift");
    setEditRewardActive(reward.isActive);
    setRewardError(null);
  };

  const handleSaveRewardEdit = async (rewardId: string) => {
    setRewardError(null);
    if (!editRewardName.trim()) {
      setRewardError("Reward name is required.");
      return;
    }
    if (!Number.isFinite(editRewardPoints) || editRewardPoints < 1) {
      setRewardError("Points required must be at least 1.");
      return;
    }

    try {
      await updateRewardMutation.mutateAsync({
        id: rewardId,
        name: editRewardName.trim(),
        description: editRewardDescription.trim() || undefined,
        type: editRewardType,
        pointsRequired: Math.floor(editRewardPoints),
        iconKey: editRewardIconKey.trim() || undefined,
        isActive: editRewardActive,
      });
      setEditingRewardId(null);
    } catch {
      setRewardError("Failed to update reward.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNavigation searchTerm={searchTerm} setSearchTerm={handleSearchChange} />

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage markets, users, and live activity in one place.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
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
          <Card>
            <CardHeader><CardTitle>Rewards</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{rewardsQuery.data?.total ?? rewards.length}</p></CardContent>
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
          <CardHeader><CardTitle>Rewards Manager</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="reward-name">Name</Label>
                <Input
                  id="reward-name"
                  value={newRewardName}
                  onChange={(event) => setNewRewardName(event.target.value)}
                  placeholder="Mobile Top-up"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-description">Description</Label>
                <Input
                  id="reward-description"
                  value={newRewardDescription}
                  onChange={(event) => setNewRewardDescription(event.target.value)}
                  placeholder="NPR 500 mobile credit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-type">Type</Label>
                <select
                  id="reward-type"
                  value={newRewardType}
                  onChange={(event) => setNewRewardType(event.target.value as RewardType)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="TOPUP">Topup</option>
                  <option value="DISCOUNT_COUPON">Discount Coupon</option>
                  <option value="FOOD_VOUCHER">Food Voucher</option>
                  <option value="FREE_PINTS">Free Pints</option>
                  <option value="GIFT_CARD">Gift Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-points">Points</Label>
                <Input
                  id="reward-points"
                  type="number"
                  min={1}
                  value={newRewardPoints}
                  onChange={(event) => setNewRewardPoints(Number(event.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-icon">Icon Key</Label>
                <Input
                  id="reward-icon"
                  value={newRewardIconKey}
                  onChange={(event) => setNewRewardIconKey(event.target.value)}
                  placeholder="gift | smartphone | coffee"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateReward} disabled={createRewardMutation.isPending}>
                {createRewardMutation.isPending ? "Creating..." : "Create Reward"}
              </Button>
            </div>

            {rewardError ? <p className="text-sm text-destructive">{rewardError}</p> : null}

            <div className="space-y-2">
              {rewardsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading rewards...</p>
              ) : rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rewards found.</p>
              ) : (
                rewards.map((reward) => (
                  <div key={reward.id} className="rounded-md border border-border p-3 space-y-3">
                    {editingRewardId === reward.id ? (
                      <div className="grid gap-2 md:grid-cols-6">
                        <Input value={editRewardName} onChange={(event) => setEditRewardName(event.target.value)} />
                        <Input value={editRewardDescription} onChange={(event) => setEditRewardDescription(event.target.value)} />
                        <select
                          value={editRewardType}
                          onChange={(event) => setEditRewardType(event.target.value as RewardType)}
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                          <option value="TOPUP">Topup</option>
                          <option value="DISCOUNT_COUPON">Discount Coupon</option>
                          <option value="FOOD_VOUCHER">Food Voucher</option>
                          <option value="FREE_PINTS">Free Pints</option>
                          <option value="GIFT_CARD">Gift Card</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <Input
                          type="number"
                          min={1}
                          value={editRewardPoints}
                          onChange={(event) => setEditRewardPoints(Number(event.target.value) || 0)}
                        />
                        <Input value={editRewardIconKey} onChange={(event) => setEditRewardIconKey(event.target.value)} />
                        <select
                          value={editRewardActive ? "active" : "inactive"}
                          onChange={(event) => setEditRewardActive(event.target.value === "active")}
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-medium">{reward.name}</p>
                          <p className="text-sm text-muted-foreground">{reward.description || "No description"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{reward.pointsRequired} pts</Badge>
                          <Badge variant={reward.isActive ? "secondary" : "default"}>
                            {reward.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{reward.type}</Badge>
                          <Badge variant="outline">{reward.iconKey || "gift"}</Badge>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      {editingRewardId === reward.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSaveRewardEdit(reward.id)}
                            disabled={updateRewardMutation.isPending}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingRewardId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleStartRewardEdit(reward)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteRewardMutation.mutate(reward.id)}
                            disabled={deleteRewardMutation.isPending}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {rewards.length > 0 ? (
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rewardsPage <= 1}
                  onClick={() => setRewardsPage((page) => page - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {rewardsPage} of {rewardsPageCount}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rewardsPage >= rewardsPageCount}
                  onClick={() => setRewardsPage((page) => page + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

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
