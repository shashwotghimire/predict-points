"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Smartphone, Coffee, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useRedeemReward } from "@/hooks/use-api";

interface RewardsMarketplaceProps {
  userPoints: number;
}

const mockRewards = [
  {
    id: 1,
    name: "Mobile Top-up",
    description: "$10 credit for your phone carrier",
    pointsRequired: 250,
    icon: Smartphone,
    status: "available",
  },
  {
    id: 2,
    name: "Food Discount",
    description: "20% off at local restaurants",
    pointsRequired: 180,
    icon: Gift,
    status: "available",
  },
  {
    id: 3,
    name: "Coffee Voucher",
    description: "$5 credit at premium coffee shops",
    pointsRequired: 120,
    icon: Coffee,
    status: "available",
  },
  {
    id: 4,
    name: "Movie Tickets",
    description: "2 cinema tickets of your choice",
    pointsRequired: 350,
    icon: Gift,
    status: "coming-soon",
  },
];

export default function RewardsMarketplace({
  userPoints,
}: RewardsMarketplaceProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const redeemMutation = useRedeemReward();

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockRewards.map((reward) => {
            const Icon = reward.icon;
            const canRedeem =
              userPoints >= reward.pointsRequired &&
              reward.status === "available";

            return (
              <Card
                key={reward.id}
                className={`flex flex-col ${
                  reward.status === "coming-soon" ? "opacity-60" : ""
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
                    {reward.status === "coming-soon" && (
                      <Badge variant="secondary" className="shrink-0">
                        Coming Soon
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

                    {reward.status === "available" ? (
                      <Button
                        disabled={!canRedeem}
                        className={`w-full ${
                          canRedeem
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                            : ""
                        }`}
                        onClick={() => {
                          if (!user) return;
                          if (!user) return;
                          redeemMutation.mutate({
                            userId: user.id,
                            rewardName: reward.name,
                            pointsSpent: reward.pointsRequired,
                          });
                          setMessage(`Redeemed ${reward.name}. Refresh dashboard to see updated points.`);
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
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
