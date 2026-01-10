"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap } from "lucide-react";

interface PredictionsFeedProps {
  setUserPoints: (points: number) => void;
  userPoints: number;
}

const mockPredictions = [
  {
    id: 1,
    question: "Will Tesla stock close above $250 by end of Q1 2026?",
    category: "Tech",
    options: ["Yes", "No"],
    endsIn: "5 days",
    rewardRange: [5, 15],
    volumes: ["62%", "38%"],
  },
  {
    id: 2,
    question: "Will the Lakers beat the Celtics this season?",
    category: "Sports",
    options: ["Yes", "No"],
    endsIn: "3 days",
    rewardRange: [10, 25],
    volumes: ["45%", "55%"],
  },
  {
    id: 3,
    question: "Will AI regulation pass before Q2 2026?",
    category: "Politics",
    options: ["Yes", "No"],
    endsIn: "8 days",
    rewardRange: [8, 20],
    volumes: ["58%", "42%"],
  },
  {
    id: 4,
    question: "Will a major Hollywood actor join a superhero franchise?",
    category: "Entertainment",
    options: ["Yes", "No"],
    endsIn: "10 days",
    rewardRange: [3, 12],
    volumes: ["71%", "29%"],
  },
  {
    id: 5,
    question: "Will Bitcoin surpass $100k in the next 30 days?",
    category: "Tech",
    options: ["Yes", "No", "Maybe"],
    endsIn: "6 days",
    rewardRange: [12, 30],
    volumes: ["48%", "35%", "17%"],
  },
  {
    id: 6,
    question: "Will it rain in New York next weekend?",
    category: "Weather",
    options: ["Yes", "No"],
    endsIn: "2 days",
    rewardRange: [2, 8],
    volumes: ["65%", "35%"],
  },
];

const categoryColors: Record<string, string> = {
  Tech: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Sports:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Politics: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Entertainment:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Weather: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

export default function PredictionsFeed({
  setUserPoints,
  userPoints,
}: PredictionsFeedProps) {
  const [predictions, setPredictions] = useState(mockPredictions);
  const [selectedPredictions, setSelectedPredictions] = useState<
    Record<number, string>
  >({});

  const handleSelectOption = (predictionId: number, option: string) => {
    setSelectedPredictions((prev) => ({
      ...prev,
      [predictionId]: prev[predictionId] === option ? "" : option,
    }));
  };

  const handleSubmitPrediction = (predictionId: number) => {
    if (!selectedPredictions[predictionId]) return;

    // Simulate points earned (5-30 based on prediction)
    const pointsEarned = Math.floor(Math.random() * 10) + 5;
    setUserPoints(userPoints + pointsEarned);

    // Remove from feed or show confirmation
    setPredictions(predictions.filter((p) => p.id !== predictionId));
    delete selectedPredictions[predictionId];
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Active Predictions</h1>
          <p className="text-muted-foreground mt-2">
            Make your predictions and earn points for accuracy
          </p>
        </div>

        <div className="grid gap-4">
          {predictions.map((prediction) => (
            <Card
              key={prediction.id}
              className="border-border hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <CardTitle className="text-lg">
                      {prediction.question}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={categoryColors[prediction.category]}>
                        {prediction.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Ends in {prediction.endsIn}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Reward Range
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      {prediction.rewardRange[0]}–{prediction.rewardRange[1]}{" "}
                      pts
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Options Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {prediction.options.map((option, idx) => (
                    <button
                      key={option}
                      onClick={() => handleSelectOption(prediction.id, option)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedPredictions[prediction.id] === option
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border hover:border-primary/50 text-foreground"
                      }`}
                    >
                      <div>{option}</div>
                      <div className="text-xs mt-1 opacity-70">
                        {prediction.volumes[idx]}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Submit Button */}
                {selectedPredictions[prediction.id] && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleSubmitPrediction(prediction.id)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Submit Prediction
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
