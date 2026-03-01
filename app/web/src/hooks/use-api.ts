import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { mapMarket, mapPrediction } from '@/lib/api/mappers';
import {
  EventOption,
  LeaderboardEntry,
  MarketEvent,
  Paginated,
  PredictionRecord,
  RewardCatalogItem,
  RewardType,
} from '@/lib/api/types';

export function useUserPoints(userId?: string) {
  return useQuery({
    queryKey: ['user-points', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}/points`);
      return data.points as number;
    },
  });
}

export function useMarkets(filters: {
  category?: string;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['markets', filters],
    refetchInterval: 4000,
    queryFn: async () => {
      const { data } = await api.get('/markets', { params: filters });
      return (data as any[]).map(mapMarket) as MarketEvent[];
    },
  });
}

export function useMarket(eventId?: string) {
  return useQuery({
    queryKey: ['market', eventId],
    enabled: Boolean(eventId),
    refetchInterval: 4000,
    queryFn: async () => {
      const { data } = await api.get(`/markets/${eventId}`);
      return mapMarket(data);
    },
  });
}

export function useCreateMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/markets', payload);
      return mapMarket(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['markets'] }),
  });
}

export function useUpdateMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.patch(`/markets/${id}`, payload);
      return mapMarket(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['markets'] });
      qc.invalidateQueries({ queryKey: ['market', vars.id] });
    },
  });
}

export function useDeleteMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/markets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['markets'] }),
  });
}

export function useSetOdds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      options,
    }: {
      id: string;
      options: Array<EventOption & { label?: string }>;
    }) => {
      const { data } = await api.patch(`/markets/${id}/odds`, {
        options: options.map((option) => ({
          optionId: option.id,
          percentage: option.percentage,
          label: option.label,
        })),
      });
      return mapMarket(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['markets'] });
      qc.invalidateQueries({ queryKey: ['market', vars.id] });
    },
  });
}

export function useDeclareMarket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, optionId }: { id: string; optionId: string }) => {
      const { data } = await api.post(`/markets/${id}/declare`, { optionId });
      return mapMarket(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['markets'] });
      qc.invalidateQueries({ queryKey: ['market', vars.id] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useCreatePrediction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      marketId: string;
      optionId: string;
      pointsStaked?: number;
    }) => {
      const { data } = await api.post('/predictions', payload);
      return mapPrediction(data);
    },
    onSuccess: (prediction) => {
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['predictions', prediction.eventId] });
      qc.invalidateQueries({ queryKey: ['user-predictions'] });
      qc.invalidateQueries({ queryKey: ['market', prediction.eventId] });
      qc.invalidateQueries({ queryKey: ['markets'] });
    },
  });
}

export function usePrediction(predictionId?: string) {
  return useQuery({
    queryKey: ['prediction', predictionId],
    enabled: Boolean(predictionId),
    queryFn: async () => {
      const { data } = await api.get(`/predictions/${predictionId}`);
      return mapPrediction(data);
    },
  });
}

export function usePostComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ marketId, userId, message }: { marketId: string; userId: string; message: string }) => {
      const { data } = await api.post(`/markets/${marketId}/comments`, { userId, message });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['market', vars.marketId] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    refetchInterval: 4000,
    queryFn: async () => {
      const { data } = await api.get('/activity');
      return data as any[];
    },
  });
}

export function useUserPredictions(params: {
  userId?: string;
  status?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['user-predictions', params],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      const { data } = await api.get(`/predictions/user/${params.userId}`, {
        params,
      });

      return {
        ...(data as Paginated<any>),
        items: (data.items ?? []).map(mapPrediction),
      } as Paginated<PredictionRecord>;
    },
  });
}

export function useUserRewards(params: {
  userId?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['user-rewards', params],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      const { data } = await api.get(`/rewards/user/${params.userId}`, {
        params,
      });
      return data as Paginated<any>;
    },
  });
}

export function useRewardsCatalog(params?: {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['rewards-catalog', params],
    queryFn: async () => {
      const { data } = await api.get('/rewards/catalog', {
        params,
      });
      return data as Paginated<RewardCatalogItem>;
    },
    refetchInterval: 4000,
  });
}

export function useCreateReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      type: RewardType;
      pointsRequired: number;
      iconKey?: string;
      isActive?: boolean;
    }) => {
      const { data } = await api.post('/rewards', payload);
      return data as RewardCatalogItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards-catalog'] });
    },
  });
}

export function useUpdateReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      description?: string;
      type?: RewardType;
      pointsRequired?: number;
      iconKey?: string;
      isActive?: boolean;
    }) => {
      const { data } = await api.patch(`/rewards/${id}`, payload);
      return data as RewardCatalogItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards-catalog'] });
    },
  });
}

export function useDeleteReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/rewards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards-catalog'] });
    },
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      rewardId: string;
      phoneNumber?: string;
      email?: string;
      fullName?: string;
      note?: string;
    }) => {
      const { data } = await api.post('/rewards/redeem', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-points'] });
      qc.invalidateQueries({ queryKey: ['user-rewards'] });
      qc.invalidateQueries({ queryKey: ['rewards-catalog'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: ['admin-users'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data as Array<{
        id: string;
        email: string;
        name: string | null;
        role: string;
        points: number;
        createdAt: string;
      }>;
    },
  });
}

export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    refetchInterval: 4000,
    queryFn: async () => {
      const { data } = await api.get('/users/leaderboard', {
        params: { limit },
      });
      return data as LeaderboardEntry[];
    },
  });
}
