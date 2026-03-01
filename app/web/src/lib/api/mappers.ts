import { MarketEvent, PredictionRecord } from './types';

const toCategory = (value: string) => value.toLowerCase() as MarketEvent['category'];

export const mapMarket = (raw: any): MarketEvent => {
  const grouped = new Map<string, Record<string, number>>();

  (raw.oddsSnapshots ?? []).forEach((snapshot: any) => {
    const key = new Date(snapshot.createdAt).toISOString();
    if (!grouped.has(key)) grouped.set(key, {});
    grouped.get(key)![snapshot.optionId] = snapshot.percentage;
  });

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    category: toCategory(raw.category),
    marketType: raw.type,
    status: raw.status,
    closesAt: raw.closesAt,
    iconUrl: raw.eventIconUrl ?? undefined,
    options: (raw.options ?? []).map((option: any) => ({
      id: option.id,
      label: option.label,
      percentage: option.percentage,
    })),
    comments: (raw.comments ?? []).map((comment: any) => ({
      id: comment.id,
      userId: comment.userId,
      userName: comment.user?.name ?? comment.user?.email ?? 'User',
      message: comment.content,
      createdAt: comment.createdAt,
    })),
    oddsHistory: Array.from(grouped.entries()).map(([timestamp, percentages]) => ({
      timestamp,
      percentages,
    })),
    declaredOptionId: raw.declaredOptionId,
  };
};

export const mapPrediction = (raw: any): PredictionRecord => ({
  id: raw.id,
  eventId: raw.marketId,
  eventTitle: raw.market?.title ?? '',
  selectedOptionId: raw.optionId,
  selectedOptionLabel: raw.option?.label ?? '',
  availableOptions: (raw.market?.options ?? []).map((option: any) => ({
    id: option.id,
    label: option.label,
    percentage: option.percentage,
  })),
  potentialWinnings: raw.potentialWinnings,
  status: raw.status,
  createdAt: raw.createdAt,
});
