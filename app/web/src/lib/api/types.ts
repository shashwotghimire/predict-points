export type EventCategory = 'trending' | 'politics' | 'sports';
export type MarketType = 'YES_NO' | 'MULTI_4' | 'OVER_UNDER';

export interface EventOption {
  id: string;
  label: string;
  percentage: number;
}

export interface EventComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export interface OddsSnapshot {
  timestamp: string;
  percentages: Record<string, number>;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  marketType: MarketType;
  status: string;
  closesAt: string;
  iconUrl?: string;
  options: EventOption[];
  comments: EventComment[];
  oddsHistory: OddsSnapshot[];
  declaredOptionId?: string | null;
}

export interface PredictionRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  availableOptions: EventOption[];
  eventResultLabel?: string | null;
  potentialWinnings: number;
  status: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}
