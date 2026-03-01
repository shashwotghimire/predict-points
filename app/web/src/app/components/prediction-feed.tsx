"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Clock,
  Eye,
  Pencil,
  PlusCircle,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/auth-context";
import { EventCategory, EventOption, MarketEvent, MarketType } from "@/lib/api/types";
import {
  useCreateMarket,
  useCreatePrediction,
  useDeclareMarket,
  useDeleteMarket,
  useMarkets,
  useSetOdds,
  useUpdateMarket,
  useUserPredictions,
} from "@/hooks/use-api";

interface PredictionsFeedProps {
  selectedCategory: "trending" | "politics" | "sports";
  searchTerm: string;
}

const BASE_STAKE_POINTS = 100;

const categoryColors: Record<EventCategory, string> = {
  trending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  politics: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  sports: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const marketTypeLabels: Record<MarketType, string> = {
  YES_NO: "Yes / No",
  MULTI_4: "Option 1-4",
  OVER_UNDER: "Over / Under",
};

type OptionDraft = { label: string; percentage: number };
type EditOptionDraft = { id: string; label: string; percentage: number };

const calculatePotentialWinnings = (percentage: number, stake = BASE_STAKE_POINTS) => {
  if (percentage <= 0) return stake;
  return Math.round((stake * 100) / percentage);
};

const createOptionDraftsByType = (marketType: MarketType, threshold: string): OptionDraft[] => {
  switch (marketType) {
    case "YES_NO":
      return [
        { label: "Yes", percentage: 55 },
        { label: "No", percentage: 45 },
      ];
    case "OVER_UNDER": {
      const line = threshold.trim() || "2.5";
      return [
        { label: `Over ${line}`, percentage: 52 },
        { label: `Under ${line}`, percentage: 48 },
      ];
    }
    case "MULTI_4":
      return [
        { label: "Option 1", percentage: 31 },
        { label: "Option 2", percentage: 27 },
        { label: "Option 3", percentage: 23 },
        { label: "Option 4", percentage: 19 },
      ];
  }
};

export default function PredictionsFeed({ selectedCategory, searchTerm }: PredictionsFeedProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const canSubmitPredictions = user?.role === "USER";

  const marketsQuery = useMarkets({
    category: selectedCategory.toUpperCase(),
    search: searchTerm || undefined,
    status: "OPEN",
  });

  const createMarketMutation = useCreateMarket();
  const updateMarketMutation = useUpdateMarket();
  const deleteMarketMutation = useDeleteMarket();
  const setOddsMutation = useSetOdds();
  const declareMutation = useDeclareMarket();
  const createPredictionMutation = useCreatePrediction();
  const userPredictionsQuery = useUserPredictions({
    userId: canSubmitPredictions ? user?.id : undefined,
    page: 1,
    pageSize: 1000,
  });

  const events = marketsQuery.data ?? [];
  const userPredictions = userPredictionsQuery.data?.items ?? [];
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<EventCategory>("trending");
  const [newMarketType, setNewMarketType] = useState<MarketType>("YES_NO");
  const [overUnderThreshold, setOverUnderThreshold] = useState("2.5");
  const [newOptions, setNewOptions] = useState<OptionDraft[]>(
    createOptionDraftsByType("YES_NO", "2.5")
  );
  const [newClosesAt, setNewClosesAt] = useState("");
  const [newIcon, setNewIcon] = useState<string | undefined>(undefined);
  const [createEventError, setCreateEventError] = useState<string | null>(null);

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editClosesAt, setEditClosesAt] = useState("");
  const [editOptions, setEditOptions] = useState<EditOptionDraft[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const filteredEvents = useMemo(() => events, [events]);
  const predictionByEventId = useMemo(
    () => new Map(userPredictions.map((prediction) => [prediction.eventId, prediction])),
    [userPredictions]
  );

  useEffect(() => {
    setNewOptions(createOptionDraftsByType(newMarketType, overUnderThreshold));
  }, [newMarketType]);

  useEffect(() => {
    if (newMarketType !== "OVER_UNDER") return;
    const line = overUnderThreshold.trim() || "2.5";
    setNewOptions((prev) => {
      if (prev.length !== 2) return createOptionDraftsByType("OVER_UNDER", line);
      return [
        { ...prev[0], label: `Over ${line}` },
        { ...prev[1], label: `Under ${line}` },
      ];
    });
  }, [newMarketType, overUnderThreshold]);

  const updateCreateOption = (index: number, field: "label" | "percentage", value: string) => {
    setNewOptions((prev) =>
      prev.map((option, optionIndex) => {
        if (optionIndex !== index) return option;
        if (field === "label") return { ...option, label: value };
        const parsed = Number(value);
        return { ...option, percentage: Number.isFinite(parsed) ? parsed : 0 };
      })
    );
  };

  const handleCreateEvent = () => {
    if (!user || !newTitle.trim()) return;
    setCreateEventError(null);
    const options = newOptions.map((option) => ({
      label: option.label.trim(),
      percentage: Number(option.percentage),
    }));

    if (options.some((option) => !option.label)) {
      setCreateEventError("All option labels are required.");
      return;
    }

    if (options.some((option) => !Number.isFinite(option.percentage) || option.percentage <= 0)) {
      setCreateEventError("Each option needs an initial odds value greater than 0.");
      return;
    }

    const totalOdds = Math.round(options.reduce((sum, option) => sum + option.percentage, 0) * 100) / 100;
    if (totalOdds !== 100) {
      setCreateEventError("Initial odds must sum to exactly 100.");
      return;
    }

    createMarketMutation.mutate({
      title: newTitle.trim(),
      description: newDescription.trim() || "No description",
      category: newCategory.toUpperCase(),
      type: newMarketType,
      closesAt: newClosesAt
        ? new Date(newClosesAt).toISOString()
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      options,
      eventIconUrl: newIcon,
      createdById: user.id,
    });

    setNewTitle("");
    setNewDescription("");
    setNewOptions(createOptionDraftsByType(newMarketType, overUnderThreshold));
    setNewIcon(undefined);
  };

  const handleStartEdit = (event: MarketEvent) => {
    setEditingEventId(event.id);
    setEditError(null);
    setEditTitle(event.title);
    setEditDescription(event.description);
    setEditClosesAt(event.closesAt.slice(0, 16));
    setEditOptions(
      event.options.map((option) => ({
        id: option.id,
        label: option.label,
        percentage: option.percentage,
      }))
    );
  };

  const handleUpdateEditOption = (
    optionId: string,
    field: "label" | "percentage",
    value: string
  ) => {
    setEditOptions((prev) =>
      prev.map((option) => {
        if (option.id !== optionId) return option;
        if (field === "label") return { ...option, label: value };
        const parsed = Number(value);
        return { ...option, percentage: Number.isFinite(parsed) ? parsed : 0 };
      })
    );
  };

  const handleSaveEdit = async (eventId: string) => {
    setEditError(null);

    const optionPayload = editOptions.map((option) => ({
      id: option.id,
      label: option.label.trim(),
      percentage: Number(option.percentage),
    }));

    if (optionPayload.some((option) => !option.label)) {
      setEditError("All option labels are required.");
      return;
    }
    if (optionPayload.some((option) => option.percentage <= 0 || !Number.isFinite(option.percentage))) {
      setEditError("Each option needs an odds value greater than 0.");
      return;
    }

    const total = Math.round(optionPayload.reduce((sum, option) => sum + option.percentage, 0) * 100) / 100;
    if (total !== 100) {
      setEditError("Option odds must sum to exactly 100.");
      return;
    }

    try {
      await updateMarketMutation.mutateAsync({
        id: eventId,
        title: editTitle,
        description: editDescription,
        closesAt: new Date(editClosesAt).toISOString(),
      });

      await setOddsMutation.mutateAsync({
        id: eventId,
        options: optionPayload,
      });

      setEditingEventId(null);
    } catch {
      setEditError("Could not save event changes. Please try again.");
    }
  };

  const handleSetEqualOdds = (event: MarketEvent) => {
    const base = Math.floor(100 / event.options.length);
    const rem = 100 - base * event.options.length;
    const options = event.options.map((option: EventOption, index: number) => ({
      ...option,
      percentage: index === 0 ? base + rem : base,
    }));
    setOddsMutation.mutate({ id: event.id, options });
  };

  const handleIconUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    callback: (value: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => callback((e.target?.result as string) || "");
    reader.readAsDataURL(file);
  };

  const handleSubmitPrediction = (eventId: string) => {
    if (!user || !canSubmitPredictions) return;
    const optionId = selectedOptions[eventId];
    if (!optionId) return;

    createPredictionMutation.mutate(
      {
        marketId: eventId,
        optionId,
        pointsStaked: BASE_STAKE_POINTS,
      },
      {
        onSuccess: (prediction) => {
          router.push(`/dashboard/events/${eventId}/confirmation?predictionId=${prediction.id}`);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Prediction Events</h1>
        </div>

        {isAdmin && (
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5" /> Admin Event Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-title">Event title</Label>
                  <Input id="event-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-desc">Description</Label>
                  <Input id="event-desc" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-category">Category</Label>
                  <select
                    id="event-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="trending">Trending</option>
                    <option value="politics">Politics</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-type">Market type</Label>
                  <select
                    id="event-type"
                    value={newMarketType}
                    onChange={(e) => setNewMarketType(e.target.value as MarketType)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="YES_NO">Yes / No</option>
                    <option value="MULTI_4">Option 1 / Option 2 / Option 3 / Option 4</option>
                    <option value="OVER_UNDER">Over x / Under x</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-closes">Closes at</Label>
                  <Input id="event-closes" type="datetime-local" value={newClosesAt} onChange={(e) => setNewClosesAt(e.target.value)} />
                </div>
                {newMarketType === "OVER_UNDER" && (
                  <div className="space-y-2">
                    <Label htmlFor="event-threshold">Threshold x</Label>
                    <Input id="event-threshold" value={overUnderThreshold} onChange={(e) => setOverUnderThreshold(e.target.value)} />
                  </div>
                )}
                <div className="space-y-3 md:col-span-2">
                  <Label>Options and Initial Odds (%)</Label>
                  <div className="space-y-2">
                    {newOptions.map((option, index) => (
                      <div key={`new-option-${index}`} className="grid gap-2 sm:grid-cols-[1fr_140px]">
                        <Input
                          value={option.label}
                          onChange={(e) => updateCreateOption(index, "label", e.target.value)}
                          placeholder={`Option ${index + 1} label`}
                        />
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={option.percentage}
                          onChange={(e) => updateCreateOption(index, "percentage", e.target.value)}
                          placeholder="Odds %"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total initial odds: {newOptions.reduce((sum, option) => sum + Number(option.percentage || 0), 0)}%
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Upload className="h-4 w-4" /> Upload event icon
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleIconUpload(e, setNewIcon)} />
                </label>
                {newIcon && <Badge>Icon attached</Badge>}
                <Button onClick={handleCreateEvent} className="ml-auto gap-2">
                  <PlusCircle className="h-4 w-4" /> Create Event
                </Button>
              </div>
              {createEventError ? (
                <p className="text-sm text-destructive">{createEventError}</p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {filteredEvents.map((event: MarketEvent) => {
            const existingPrediction = predictionByEventId.get(event.id);
            const submittedOptionId = existingPrediction?.selectedOptionId;
            const effectiveSelectedOptionId = submittedOptionId ?? selectedOptions[event.id];
            const hasSubmittedPrediction = Boolean(existingPrediction);
            const isOpen = event.status === "OPEN";
            const predictionLocked = !canSubmitPredictions || hasSubmittedPrediction || !isOpen;

            return (
            <Card key={event.id} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      {event.iconUrl ? (
                        <img src={event.iconUrl} alt={event.title} className="h-10 w-10 rounded object-cover border border-border" />
                      ) : null}
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{event.id}</Badge>
                      <Badge className={categoryColors[event.category]}>{event.category}</Badge>
                      <Badge variant="outline">{marketTypeLabels[event.marketType]}</Badge>
                      <Badge variant={event.status === "OPEN" ? "secondary" : "default"}>{event.status}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(event.closesAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                    <Eye className="h-4 w-4" /> Open Event
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isAdmin && editingEventId === event.id && (
                  <div className="grid gap-3 rounded-md border border-border p-3">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${event.id}`}>Title</Label>
                      <Input id={`title-${event.id}`} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`description-${event.id}`}>Description</Label>
                      <Input id={`description-${event.id}`} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`closes-${event.id}`}>Closes at</Label>
                      <Input id={`closes-${event.id}`} type="datetime-local" value={editClosesAt} onChange={(e) => setEditClosesAt(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                      <Label>Edit options and odds</Label>
                      {editOptions.map((option) => (
                        <div key={`edit-option-${option.id}`} className="grid gap-2 sm:grid-cols-[1fr_140px]">
                          <Input
                            value={option.label}
                            onChange={(e) => handleUpdateEditOption(option.id, "label", e.target.value)}
                            placeholder="Option label"
                          />
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={option.percentage}
                            onChange={(e) => handleUpdateEditOption(option.id, "percentage", e.target.value)}
                            placeholder="Odds %"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        Total odds: {editOptions.reduce((sum, option) => sum + Number(option.percentage || 0), 0)}%
                      </p>
                    </div>
                    {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(event.id)}
                        className="gap-2"
                        disabled={updateMarketMutation.isPending || setOddsMutation.isPending}
                      >
                        <Check className="h-4 w-4" /> Save
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditingEventId(null)}><X className="h-4 w-4" /> Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.options.map((option: EventOption) => {
                    const selected = effectiveSelectedOptionId === option.id;
                    const potential = calculatePotentialWinnings(option.percentage);

                    return (
                      <button
                        key={option.id}
                        disabled={predictionLocked}
                        onClick={() =>
                          isOpen &&
                          canSubmitPredictions &&
                          !hasSubmittedPrediction &&
                          setSelectedOptions((prev) => ({ ...prev, [event.id]: option.id }))
                        }
                        className={`text-left p-3 rounded-lg border-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground mt-2 flex items-center justify-between">
                          <span>{option.percentage}%</span>
                          <span>Potential {potential} pts</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasSubmittedPrediction && (
                  <div className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
                    Prediction submitted:{" "}
                    <span className="font-semibold">{existingPrediction?.selectedOptionLabel}</span>{" "}
                    • Potential winnings{" "}
                    <span className="font-semibold text-primary">{existingPrediction?.potentialWinnings} points</span>
                  </div>
                )}

                {!canSubmitPredictions && isOpen && (
                  <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                    Admin accounts cannot submit predictions.
                  </div>
                )}

                {isOpen && canSubmitPredictions && !hasSubmittedPrediction && effectiveSelectedOptionId && (
                  <Button onClick={() => handleSubmitPrediction(event.id)} className="w-full gap-2">
                    <Zap className="h-4 w-4" /> Submit Prediction
                  </Button>
                )}

                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => handleStartEdit(event)}>
                      <Pencil className="h-4 w-4" /> Update Event
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleSetEqualOdds(event)}>
                      Set Percentage Odds
                    </Button>
                    {event.options.map((option: EventOption) => (
                      <Button key={`${event.id}-${option.id}`} size="sm" variant="outline" disabled={event.status === "RESOLVED"} onClick={() => declareMutation.mutate({ id: event.id, optionId: option.id })}>
                        Declare {option.label}
                      </Button>
                    ))}
                    <Button size="sm" variant="destructive" className="ml-auto gap-2" onClick={() => deleteMarketMutation.mutate(event.id)}>
                      <Trash2 className="h-4 w-4" /> Delete Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )})}

          {filteredEvents.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No events found.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
