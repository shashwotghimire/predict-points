"use client";

import type React from "react";

import { useRef, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Upload } from "lucide-react";
import { useUserPoints, useUserPredictions, useUserRewards } from "@/hooks/use-api";

type ProfileTab = "predictions" | "rewards";
type PredictionFilter = "all" | "active" | "previous" | "won" | "lost";

const PAGE_SIZE = 5;

export default function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<ProfileTab>("predictions");
  const [predictionFilter, setPredictionFilter] = useState<PredictionFilter>("all");
  const [predictionSearch, setPredictionSearch] = useState("");
  const [predictionSort, setPredictionSort] = useState<"newest" | "points_desc" | "points_asc">("newest");
  const [predictionPage, setPredictionPage] = useState(1);

  const [rewardSearch, setRewardSearch] = useState("");
  const [rewardSort, setRewardSort] = useState<"newest" | "points_desc" | "points_asc">("newest");
  const [rewardPage, setRewardPage] = useState(1);

  const statusParam =
    predictionFilter === "all"
      ? undefined
      : predictionFilter === "previous"
        ? undefined
        : predictionFilter.toUpperCase();

  const userPointsQuery = useUserPoints(user?.id);
  const predictionsQuery = useUserPredictions({
    userId: user?.id,
    status: statusParam,
    search: predictionSearch || undefined,
    sort: predictionSort,
    page: predictionPage,
    pageSize: PAGE_SIZE,
  });
  const rewardsQuery = useUserRewards({
    userId: user?.id,
    search: rewardSearch || undefined,
    sort: rewardSort,
    page: rewardPage,
    pageSize: PAGE_SIZE,
  });

  if (!user) return null;

  const totalPoints = userPointsQuery.data ?? 0;

  const predictionRows = (predictionsQuery.data?.items ?? []).filter((item) => {
    if (predictionFilter === "previous") return item.status !== "ACTIVE";
    return true;
  });

  const rewardRows = rewardsQuery.data?.items ?? [];

  const handleSaveName = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    setTimeout(() => {
      updateProfile(name, user?.profilePicture);
      setSaveSuccess(true);
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 350);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateProfile(name, base64);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Profile</CardTitle>
          <CardDescription>Manage your user info and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture || "/placeholder.svg"}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover bg-secondary border-2 border-primary"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
                {user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> Upload Photo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF</p>
            </div>

            <div className="ml-auto rounded-md border border-primary/40 bg-primary/5 px-4 py-3 min-w-40">
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          {saveSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-900">
              <Check className="h-4 w-4" />
              <AlertDescription>Profile updated successfully.</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSaveName} disabled={isSaving || !name.trim()}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Navigation</CardTitle>
          <CardDescription>Predictions and rewards history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant={tab === "predictions" ? "default" : "ghost"} onClick={() => setTab("predictions")}>
              Predictions
            </Button>
            <Button size="sm" variant={tab === "rewards" ? "default" : "ghost"} onClick={() => setTab("rewards")}>
              Rewards
            </Button>
          </div>

          {tab === "predictions" && (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-3">
                <select
                  value={predictionFilter}
                  onChange={(e) => {
                    setPredictionFilter(e.target.value as PredictionFilter);
                    setPredictionPage(1);
                  }}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="previous">Previous</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <Input value={predictionSearch} onChange={(e) => { setPredictionSearch(e.target.value); setPredictionPage(1); }} placeholder="Search by event or option" />
                <select value={predictionSort} onChange={(e) => setPredictionSort(e.target.value as "newest" | "points_desc" | "points_asc")} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="newest">Newest</option>
                  <option value="points_desc">Points won (high to low)</option>
                  <option value="points_asc">Points won (low to high)</option>
                </select>
              </div>

              <div className="space-y-3">
                {predictionRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No predictions found.</p>
                ) : (
                  predictionRows.map((prediction: any) => (
                    <div key={prediction.id} className="rounded-md border border-border p-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{prediction.eventTitle}</p>
                        <span className="text-xs text-muted-foreground">{new Date(prediction.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Options: {prediction.availableOptions.map((o: any) => o.label).join(", ")}</p>
                      <p className="text-sm">Chosen: {prediction.selectedOptionLabel}</p>
                      <p className="text-sm">
                        Status:{" "}
                        <span
                          className={`font-medium ${
                            prediction.status === "WON"
                              ? "text-green-600"
                              : prediction.status === "LOST"
                                ? "text-red-600"
                                : ""
                          }`}
                        >
                          {prediction.status}
                        </span>
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" disabled={predictionPage <= 1} onClick={() => setPredictionPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {predictionPage} of {predictionsQuery.data?.pageCount ?? 1}</span>
                <Button size="sm" variant="outline" disabled={predictionPage >= (predictionsQuery.data?.pageCount ?? 1)} onClick={() => setPredictionPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}

          {tab === "rewards" && (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={rewardSearch} onChange={(e) => { setRewardSearch(e.target.value); setRewardPage(1); }} placeholder="Search rewards" />
                <select value={rewardSort} onChange={(e) => setRewardSort(e.target.value as "newest" | "points_desc" | "points_asc")} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="newest">Newest</option>
                  <option value="points_desc">Points spent (high to low)</option>
                  <option value="points_asc">Points spent (low to high)</option>
                </select>
              </div>

              <div className="space-y-3">
                {rewardRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rewards redeemed yet.</p>
                ) : (
                  rewardRows.map((reward: any) => (
                    <div key={reward.id} className="rounded-md border border-border p-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{reward.rewardName}</p>
                        <p className="text-sm font-semibold text-primary">-{reward.pointsSpent} pts</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Redeemed {new Date(reward.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" disabled={rewardPage <= 1} onClick={() => setRewardPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {rewardPage} of {rewardsQuery.data?.pageCount ?? 1}</span>
                <Button size="sm" variant="outline" disabled={rewardPage >= (rewardsQuery.data?.pageCount ?? 1)} onClick={() => setRewardPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
