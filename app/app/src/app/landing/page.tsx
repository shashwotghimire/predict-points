"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info, TrendingUp, Award, Gift } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary/30">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded bg-primary text-primary-foreground font-bold text-lg">
              PP
            </div>
            <span className="font-semibold text-lg">PredictPoints</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.push("/login")}>
              Sign In
            </Button>
            <Button
              onClick={() => router.push("/register")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Forecast Events.
            <br />
            <span className="text-primary">Earn Points.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Make predictions on real-world events, compete with thousands of
            predictors, and redeem your points for exclusive rewards.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base h-12"
            >
              Start Predicting
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="gap-2 text-base h-12"
            >
              Learn More
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 mt-12 p-4 rounded-lg bg-secondary/50 border border-border max-w-lg mx-auto">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground text-left">
              No money involved. Points-only rewards. For entertainment and
              engagement purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Make Predictions */}
          <div className="p-8 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Make Predictions</h3>
            <p className="text-muted-foreground mb-4">
              Forecast the outcome of real-world events. Choose from multiple
              categories like sports, politics, economics, and entertainment.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Real-time events
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Diversified categories
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Multiple outcomes
              </li>
            </ul>
          </div>

          {/* Earn Points */}
          <div className="p-8 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Earn Points</h3>
            <p className="text-muted-foreground mb-4">
              Get rewarded for accurate predictions. Your accuracy score
              determines how many points you earn per prediction.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Reward accuracy
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Climb leaderboards
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Weekly rankings
              </li>
            </ul>
          </div>

          {/* Redeem Rewards */}
          <div className="p-8 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Redeem Rewards</h3>
            <p className="text-muted-foreground mb-4">
              Exchange your points for exclusive rewards. Choose from a variety
              of vouchers, discounts, and special offers.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Exclusive deals
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Gift cards
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Premium perks
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-secondary/30 border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Active Predictors</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Live Events</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$50K+</div>
              <p className="text-muted-foreground">Points Distributed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of predictors and start earning points today. It only
          takes a minute to sign up.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push("/register")}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base h-12"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/login")}
            className="text-base h-12"
          >
            Already a Member? Sign In
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2026 PredictPoints. For entertainment purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
