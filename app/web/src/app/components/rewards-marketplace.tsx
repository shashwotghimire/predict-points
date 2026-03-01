"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Smartphone, Coffee, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useRedeemReward, useRewardsCatalog } from "@/hooks/use-api";

interface RewardsMarketplaceProps {
  userPoints: number;
}

const iconByKey: Record<string, typeof Gift> = {
  smartphone: Smartphone,
  gift: Gift,
  coffee: Coffee,
};

export default function RewardsMarketplace({
  userPoints,
}: RewardsMarketplaceProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const rewardsQuery = useRewardsCatalog({
    page: 1,
    pageSize: 100,
  });
  const redeemMutation = useRedeemReward();
  const rewards = rewardsQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rewards Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Redeem your points for exclusive rewards
          </p>
        </div>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Your Points Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {userPoints.toLocaleString()} points
            </p>
            {message && <p className="text-sm mt-2 text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>

        {rewardsQuery.isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading rewards...
            </CardContent>
          </Card>
        ) : rewardsQuery.isError ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">
              Could not load rewards.
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const Icon = iconByKey[(reward.iconKey || "").toLowerCase()] || Gift;
            const canRedeem = userPoints >= reward.pointsRequired && reward.isActive;

            return (
              <Card
                key={reward.id}
                className={`flex flex-col ${
                  !reward.isActive ? "opacity-60" : ""
                } border-border`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{reward.name}</CardTitle>
                      </div>
                    </div>
                    {!reward.isActive && (
                      <Badge variant="secondary" className="shrink-0">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    {reward.description}
                  </p>

                  <div className="flex-1" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Points Required</span>
                      <span className="text-lg font-bold text-primary">
                        {reward.pointsRequired}
                      </span>
                    </div>

                    {reward.isActive ? (
                      <Button
                        disabled={!canRedeem}
                        className={`w-full ${
                          canRedeem
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                            : ""
                        }`}
                        onClick={() => {
                          if (!user) return;
                          redeemMutation.mutate({
                            rewardId: reward.id,
                          });
                          setMessage(`Redeemed ${reward.name}.`);
                        }}
                      >
                        {canRedeem ? "Redeem Now" : "Not Enough Points"}
                      </Button>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full bg-transparent"
                      >
                        Inactive
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {rewards.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                No rewards available yet.
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
