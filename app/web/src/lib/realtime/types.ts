export type RealtimeTopic =
  | "markets"
  | "market"
  | "activity"
  | "leaderboard"
  | "user-points"
  | "user-predictions"
  | "user-rewards"
  | "rewards-catalog"
  | "admin-users"
  | "predictions";

export type RealtimeSyncPayload = {
  topics: RealtimeTopic[];
  marketId?: string;
  userId?: string;
  timestamp: string;
};
