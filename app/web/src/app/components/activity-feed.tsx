"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActivity } from "@/hooks/use-api";

export default function ActivityFeed({
  onOpenLeaderboard,
}: {
  onOpenLeaderboard: () => void;
}) {
  const activityQuery = useActivity();
  const activity = activityQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Activity</h1>
            <p className="text-muted-foreground mt-2">
              Real-time updates from predictions, declarations, and comments.
            </p>
          </div>
          <Button variant="outline" onClick={onOpenLeaderboard}>
            Open Leaderboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Live Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-border px-3 py-2"
                  >
                    <p className="text-sm">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
