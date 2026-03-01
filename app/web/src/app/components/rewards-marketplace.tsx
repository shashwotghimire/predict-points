"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gift, Smartphone, Coffee, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useRedeemReward, useRewardsCatalog } from "@/hooks/use-api";
import { RewardType } from "@/lib/api/types";

interface RewardsMarketplaceProps {
  userPoints: number;
}

type RedeemInput = {
  phoneNumber: string;
  email: string;
  fullName: string;
  note: string;
};

const iconByKey: Record<string, typeof Gift> = {
  smartphone: Smartphone,
  gift: Gift,
  coffee: Coffee,
};

const defaultRedeemInput: RedeemInput = {
  phoneNumber: "",
  email: "",
  fullName: "",
  note: "",
};

const typeLabel: Record<RewardType, string> = {
  TOPUP: "Topup",
  DISCOUNT_COUPON: "Discount Coupon",
  FOOD_VOUCHER: "Food Voucher",
  FREE_PINTS: "Free Pints",
  GIFT_CARD: "Gift Card",
  OTHER: "Other",
};

const typeHelpText: Partial<Record<RewardType, string>> = {
  TOPUP: "Enter phone number for topup redemption.",
  DISCOUNT_COUPON: "Enter email to receive coupon code.",
  FOOD_VOUCHER: "Enter full name for voucher issue.",
  FREE_PINTS: "Enter full name for venue voucher.",
  GIFT_CARD: "Enter email to receive gift card code.",
};

export default function RewardsMarketplace({ userPoints }: RewardsMarketplaceProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [redeemInputs, setRedeemInputs] = useState<Record<string, RedeemInput>>({});

  const rewardsQuery = useRewardsCatalog({
    page: 1,
    pageSize: 100,
  });
  const redeemMutation = useRedeemReward();
  const rewards = rewardsQuery.data?.items ?? [];

  const getRedeemInput = (rewardId: string) => {
    return redeemInputs[rewardId] ?? defaultRedeemInput;
  };

  const setRedeemInput = (rewardId: string, patch: Partial<RedeemInput>) => {
    setRedeemInputs((prev) => ({
      ...prev,
      [rewardId]: {
        ...(prev[rewardId] ?? defaultRedeemInput),
        ...patch,
      },
    }));
  };

  const validateRedeemInput = (type: RewardType, input: RedeemInput) => {
    if (type === "TOPUP") return Boolean(input.phoneNumber.trim());
    if (type === "DISCOUNT_COUPON" || type === "GIFT_CARD") return Boolean(input.email.trim());
    if (type === "FOOD_VOUCHER" || type === "FREE_PINTS") return Boolean(input.fullName.trim());
    return true;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rewards Marketplace</h1>
          <p className="text-muted-foreground mt-2">Redeem your points for exclusive rewards</p>
        </div>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Your Points Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{userPoints.toLocaleString()} points</p>
            {message && <p className="text-sm mt-2 text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>

        {rewardsQuery.isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading rewards...</CardContent>
          </Card>
        ) : rewardsQuery.isError ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">Could not load rewards.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const Icon = iconByKey[(reward.iconKey || "").toLowerCase()] || Gift;
              const input = getRedeemInput(reward.id);
              const hasRequiredInput = validateRedeemInput(reward.type, input);
              const canRedeem = userPoints >= reward.pointsRequired && reward.isActive && hasRequiredInput;

              return (
                <Card
                  key={reward.id}
                  className={`flex flex-col ${!reward.isActive ? "opacity-60" : ""} border-border`}
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
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{typeLabel[reward.type]}</Badge>
                        {!reward.isActive ? <Badge variant="secondary">Inactive</Badge> : null}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">{reward.description || "No description"}</p>

                    {reward.isActive ? (
                      <div className="space-y-2">
                        {typeHelpText[reward.type] ? (
                          <p className="text-xs text-muted-foreground">{typeHelpText[reward.type]}</p>
                        ) : null}

                        {reward.type === "TOPUP" ? (
                          <Input
                            value={input.phoneNumber}
                            onChange={(event) =>
                              setRedeemInput(reward.id, { phoneNumber: event.target.value })
                            }
                            placeholder="Phone number"
                          />
                        ) : null}

                        {reward.type === "DISCOUNT_COUPON" || reward.type === "GIFT_CARD" ? (
                          <Input
                            type="email"
                            value={input.email}
                            onChange={(event) =>
                              setRedeemInput(reward.id, { email: event.target.value })
                            }
                            placeholder="Email"
                          />
                        ) : null}

                        {reward.type === "FOOD_VOUCHER" || reward.type === "FREE_PINTS" ? (
                          <Input
                            value={input.fullName}
                            onChange={(event) =>
                              setRedeemInput(reward.id, { fullName: event.target.value })
                            }
                            placeholder="Full name"
                          />
                        ) : null}

                        <Input
                          value={input.note}
                          onChange={(event) =>
                            setRedeemInput(reward.id, { note: event.target.value })
                          }
                          placeholder="Optional note"
                        />
                      </div>
                    ) : null}

                    <div className="flex-1" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Points Required</span>
                        <span className="text-lg font-bold text-primary">{reward.pointsRequired}</span>
                      </div>

                      {reward.isActive ? (
                        <Button
                          disabled={!canRedeem || redeemMutation.isPending}
                          className={`w-full ${canRedeem ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
                          onClick={() => {
                            if (!user) return;
                            const payload = {
                              rewardId: reward.id,
                              phoneNumber: input.phoneNumber.trim() || undefined,
                              email: input.email.trim() || undefined,
                              fullName: input.fullName.trim() || undefined,
                              note: input.note.trim() || undefined,
                            };
                            redeemMutation.mutate(payload, {
                              onSuccess: () => {
                                setMessage(`Redeemed ${reward.name}.`);
                                setRedeemInputs((prev) => ({
                                  ...prev,
                                  [reward.id]: defaultRedeemInput,
                                }));
                              },
                              onError: (error: any) => {
                                const backendMessage = error?.response?.data?.message;
                                setMessage(
                                  Array.isArray(backendMessage)
                                    ? backendMessage.join(", ")
                                    : backendMessage || `Could not redeem ${reward.name}.`,
                                );
                              },
                            });
                          }}
                        >
                          {redeemMutation.isPending
                            ? "Redeeming..."
                            : canRedeem
                              ? "Redeem Now"
                              : !hasRequiredInput
                                ? "Fill Required Info"
                                : "Not Enough Points"}
                        </Button>
                      ) : (
                        <Button disabled variant="outline" className="w-full bg-transparent">
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
                <CardContent className="py-10 text-center text-muted-foreground">No rewards available yet.</CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
