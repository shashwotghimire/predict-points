"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";
import Navigation from "../components/navigation";
import PredictionsFeed from "../components/prediction-feed";
import Leaderboard from "../components/Leaderboard";
import RewardsMarketplace from "../components/rewards-marketplace";
import { useState } from "react";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<
    "predictions" | "leaderboard" | "rewards"
  >("predictions");
  const [userPoints, setUserPoints] = useState(245);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userPoints={userPoints}
      />

      {currentPage === "predictions" && (
        <PredictionsFeed
          setUserPoints={setUserPoints}
          userPoints={userPoints}
        />
      )}

      {currentPage === "leaderboard" && <Leaderboard />}

      {currentPage === "rewards" && (
        <RewardsMarketplace userPoints={userPoints} />
      )}
    </div>
  );
}
