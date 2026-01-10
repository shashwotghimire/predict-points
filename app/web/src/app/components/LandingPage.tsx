"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";

interface LandingPageProps {
  setCurrentPage: (
    page: "landing" | "predictions" | "leaderboard" | "rewards"
  ) => void;
}

export default function LandingPage({ setCurrentPage }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        {/* Hero Section */}
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10">
              <div className="flex items-center justify-center w-12 h-12 rounded bg-primary text-primary-foreground font-bold text-xl">
                PP
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-balance">
              PredictPoints
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto text-balance">
              Forecast events. Earn points. Redeem rewards.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => setCurrentPage("predictions")}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Start Predicting
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentPage("predictions")}
              className="gap-2"
            >
              How it works
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 mt-12 p-4 rounded-lg bg-secondary/50 border border-border max-w-lg mx-auto">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground text-left">
              No money involved. Points-only rewards. For entertainment and
              engagement.
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="max-w-5xl mx-auto w-full mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-lg mb-2">Make Predictions</h3>
            <p className="text-sm text-muted-foreground">
              Forecast real-world events and compete with other predictors
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-lg mb-2">Earn Points</h3>
            <p className="text-sm text-muted-foreground">
              Get rewarded for accurate predictions with points
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-lg mb-2">Redeem Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Exchange points for vouchers, discounts, and freebies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
