"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EventOption, MarketEvent } from "@/lib/api/types";
import { useCreatePrediction, useMarket, usePostComment, useUserPredictions } from "@/hooks/use-api";

const calculatePotentialWinnings = (percentage: number, stake = 100) => {
  if (percentage <= 0) return stake;
  return Math.round((stake * 100) / percentage);
};

type ValueTrend = "up" | "down";
type OptionFlashTrend = { odds: ValueTrend; potential: ValueTrend };

const trendTextClass = (trend?: ValueTrend) => {
  if (trend === "up") return "text-emerald-600 dark:text-emerald-400";
  if (trend === "down") return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
};

function OddsLineGraph({ event }: { event: MarketEvent }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 800;
  const height = 220;
  const padding = 28;
  const points = event.oddsHistory;

  if (!points.length) return null;

  const buildPoint = (optionId: string, index: number) => {
    const x = padding + ((width - padding * 2) * index) / Math.max(1, points.length - 1);
    const raw = points[index].percentages[optionId] ?? 0;
    const y = padding + ((100 - raw) * (height - padding * 2)) / 100;
    return { x, y, value: raw };
  };

  const buildPath = (optionId: string) =>
    points
      .map((_, index) => {
        const point = buildPoint(optionId, index);
        return `${index === 0 ? "M" : "L"}${point.x},${point.y}`;
      })
      .join(" ");

  const palette = ["#f43f5e", "#3b82f6", "#16a34a", "#f59e0b"];

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 rounded-md border border-border bg-background">
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = padding + ((100 - pct) * (height - padding * 2)) / 100;
          return (
            <g key={pct}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeWidth="1" opacity="0.35" />
              <text x={4} y={y + 4} className="fill-muted-foreground text-[11px]">{pct}%</text>
            </g>
          );
        })}

        {event.options.map((option, index) => (
          <path key={option.id} d={buildPath(option.id)} stroke={palette[index % palette.length]} strokeWidth="2.5" fill="none" />
        ))}

        {hoveredIndex !== null && (
          <line
            x1={buildPoint(event.options[0].id, hoveredIndex).x}
            y1={padding}
            x2={buildPoint(event.options[0].id, hoveredIndex).x}
            y2={height - padding}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {hoveredIndex !== null &&
          event.options.map((option, index) => {
            const point = buildPoint(option.id, hoveredIndex);
            return (
              <circle
                key={`${option.id}-dot`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={palette[index % palette.length]}
                stroke="#0f172a"
                strokeWidth="1"
              />
            );
          })}

        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          fill="transparent"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const relative = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            const idx = Math.round(relative * Math.max(1, points.length - 1));
            setHoveredIndex(idx);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        />
      </svg>

      {hoveredIndex !== null && (
        <div className="rounded-md border border-border px-3 py-2 text-sm">
          <p className="font-medium">{new Date(points[hoveredIndex].timestamp).toLocaleString()}</p>
          <div className="mt-1 flex flex-wrap gap-3">
            {event.options.map((option) => (
              <span key={`${option.id}-value`} className="text-muted-foreground">
                {option.label}: {points[hoveredIndex].percentages[option.id] ?? 0}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const { user } = useAuth();
  const canSubmitPredictions = user?.role === "USER";
  const [comment, setComment] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [optionFlashTrends, setOptionFlashTrends] = useState<
    Record<string, OptionFlashTrend>
  >({});
  const previousOddsRef = useRef<Record<string, number>>({});
  const flashTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

  const eventQuery = useMarket(eventId);
  const postCommentMutation = usePostComment();
  const createPredictionMutation = useCreatePrediction();
  const userPredictionsQuery = useUserPredictions({
    userId: canSubmitPredictions ? user?.id : undefined,
    page: 1,
    pageSize: 1000,
  });

  const event = eventQuery.data;
  const existingPrediction = useMemo(
    () => userPredictionsQuery.data?.items.find((prediction) => prediction.eventId === eventId),
    [userPredictionsQuery.data?.items, eventId]
  );
  const hasSubmittedPrediction = Boolean(existingPrediction);
  const isOpen = event?.status === "OPEN";

  useEffect(() => {
    if (existingPrediction?.selectedOptionId) {
      setSelectedOptionId(existingPrediction.selectedOptionId);
    }
  }, [existingPrediction?.selectedOptionId]);

  const selectedOption = useMemo(
    () => event?.options.find((option) => option.id === selectedOptionId),
    [event, selectedOptionId]
  );

  useEffect(() => {
    if (!event) return;

    const nextOdds: Record<string, number> = {};

    for (const option of event.options) {
      const key = `${event.id}:${option.id}`;
      const currentOdds = option.percentage;
      nextOdds[key] = currentOdds;

      const previousOdds = previousOddsRef.current[key];
      if (typeof previousOdds !== "number" || previousOdds === currentOdds) {
        continue;
      }

      const oddsTrend: ValueTrend = currentOdds > previousOdds ? "up" : "down";
      const previousPotential = calculatePotentialWinnings(previousOdds);
      const currentPotential = calculatePotentialWinnings(currentOdds);
      const potentialTrend: ValueTrend =
        currentPotential > previousPotential
          ? "up"
          : currentPotential < previousPotential
            ? "down"
            : oddsTrend;

      setOptionFlashTrends((prev) => ({
        ...prev,
        [key]: { odds: oddsTrend, potential: potentialTrend },
      }));

      if (flashTimeoutsRef.current[key]) {
        clearTimeout(flashTimeoutsRef.current[key]);
      }

      flashTimeoutsRef.current[key] = setTimeout(() => {
        setOptionFlashTrends((prev) => {
          if (!prev[key]) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
        delete flashTimeoutsRef.current[key];
      }, 1000);
    }

    previousOddsRef.current = nextOdds;
  }, [event]);

  useEffect(() => {
    return () => {
      Object.values(flashTimeoutsRef.current).forEach((timeoutId) =>
        clearTimeout(timeoutId)
      );
    };
  }, []);

  if (eventQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader><CardTitle>Event not found</CardTitle></CardHeader>
          <CardContent><Button onClick={() => router.push("/dashboard")}>Back</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>← Back to Dashboard</Button>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">{event.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{event.id}</Badge>
              <Badge>{event.status}</Badge>
              <Badge variant="secondary">{event.category}</Badge>
            </div>
          </div>
          {event.iconUrl && <img src={event.iconUrl} alt={event.title} className="h-20 w-20 rounded-md object-cover border border-border" />}
        </div>

        <Card>
          <CardHeader><CardTitle>Odds Change Over Time</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <OddsLineGraph event={event} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Predict On This Event</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {event.options.map((option: EventOption) => {
                const potential = calculatePotentialWinnings(option.percentage);
                const flashTrend = optionFlashTrends[`${event.id}:${option.id}`];

                return (
                  <button
                    key={option.id}
                    disabled={!canSubmitPredictions || !isOpen || hasSubmittedPrediction}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`text-left rounded-md border p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${selectedOptionId === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm mt-1">
                      <span className={trendTextClass(flashTrend?.odds)}>
                        {option.percentage}% odds
                      </span>
                      <span className="text-muted-foreground"> • </span>
                      <span className={trendTextClass(flashTrend?.potential)}>
                        Potential {potential} points
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>

            {hasSubmittedPrediction && (
              <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
                Prediction submitted:{" "}
                <span className="font-semibold">{existingPrediction?.selectedOptionLabel}</span> • Potential winnings{" "}
                <span className="font-semibold text-primary">{existingPrediction?.potentialWinnings} points</span>
              </div>
            )}

            {!canSubmitPredictions && isOpen && (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                Admin accounts cannot submit predictions.
              </div>
            )}

            {selectedOption && (
              <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
                Selected: <span className="font-medium">{selectedOption.label}</span> • Potential winnings {" "}
                <span className="font-semibold text-primary">{calculatePotentialWinnings(selectedOption.percentage)} points</span>
              </div>
            )}

            <Button
              disabled={!user || !canSubmitPredictions || !isOpen || hasSubmittedPrediction || !selectedOptionId || createPredictionMutation.isPending}
              onClick={() => {
                if (!user || !canSubmitPredictions || !selectedOptionId) return;
                createPredictionMutation.mutate(
                  { marketId: eventId, optionId: selectedOptionId, pointsStaked: 100 },
                  {
                    onSuccess: (prediction) => {
                      router.push(`/dashboard/events/${eventId}/confirmation?predictionId=${prediction.id}`);
                    },
                  }
                );
              }}
            >
              {hasSubmittedPrediction
                ? "Prediction Submitted"
                : !canSubmitPredictions
                  ? "Not Available For Admin"
                : createPredictionMutation.isPending
                  ? "Submitting..."
                  : "Submit Prediction"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your view on this event" />
              <Button
                disabled={!user || !comment.trim() || postCommentMutation.isPending}
                onClick={() => {
                  if (!user || !comment.trim()) return;
                  postCommentMutation.mutate({
                    marketId: eventId,
                    message: comment.trim(),
                  });
                  setComment("");
                }}
              >
                {postCommentMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>

            <div className="space-y-3">
              {event.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                event.comments.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">{item.userName}</p>
                    <p className="text-sm mt-1">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
