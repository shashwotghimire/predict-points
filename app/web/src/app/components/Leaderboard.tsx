"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useLeaderboard } from "@/hooks/use-api";

export default function Leaderboard() {
  const { user } = useAuth();
  const leaderboardQuery = useLeaderboard(25);
  const leaderboard = leaderboardQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-2">
            Top predictors based on total points and resolved accuracy
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Top Predictors
            </CardTitle>
          </CardHeader>

          <CardContent>
            {leaderboardQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
            ) : leaderboardQuery.isError ? (
              <p className="text-sm text-destructive">Could not load leaderboard right now.</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
            ) : (
              <div className="space-y-0">
                {leaderboard.map((entry) => {
                  const isCurrentUser = entry.userId === user?.id;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between border-b border-border p-4 last:border-b-0 ${
                        isCurrentUser ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex flex-1 items-center gap-4">
                        <div className="w-8 text-right text-2xl font-bold text-muted-foreground">
                          <span>{entry.rank}</span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {entry.username}
                            {isCurrentUser ? (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            ) : null}
                          </p>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {entry.accuracy}% accuracy ({entry.wonPredictions}/{entry.resolvedPredictions} resolved won)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {entry.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
