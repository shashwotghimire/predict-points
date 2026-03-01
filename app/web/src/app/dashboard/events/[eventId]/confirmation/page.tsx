"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket, usePrediction } from "@/hooks/use-api";

export default function PredictionConfirmationPage() {
  const params = useParams<{ eventId: string }>();
  const query = useSearchParams();
  const router = useRouter();
  const predictionId = query.get("predictionId") || "";

  const eventQuery = useMarket(params.eventId);
  const predictionQuery = usePrediction(predictionId);

  if (eventQuery.isLoading || predictionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  const event = eventQuery.data;
  const prediction = predictionQuery.data;

  if (!event || !prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Confirmation not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-2xl">Prediction Submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Your prediction has been recorded for event {event.id}.</p>
            <div className="rounded-md border border-border p-4 space-y-2">
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{event.id}</Badge>
                <Badge variant="secondary">{event.category}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Options</p>
              <div className="grid gap-2">
                {prediction.availableOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      option.id === prediction.selectedOptionId ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.id === prediction.selectedOptionId ? <Badge>Selected</Badge> : <span className="text-muted-foreground">{option.percentage}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border p-4">
              <p className="text-sm text-muted-foreground">Potential winnings</p>
              <p className="text-2xl font-bold text-primary">{prediction.potentialWinnings.toLocaleString()} points</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push(`/dashboard/events/${event.id}`)}>View Event Details</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
