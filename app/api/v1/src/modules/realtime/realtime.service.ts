import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeSyncPayload, RealtimeTopic } from './realtime.types';

type RealtimeSyncOptions = {
  marketId?: string;
  userId?: string;
};

@Injectable()
export class RealtimeService {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  broadcast(topics: RealtimeTopic[], options: RealtimeSyncOptions = {}) {
    const payload: RealtimeSyncPayload = {
      topics: [...new Set(topics)],
      marketId: options.marketId,
      userId: options.userId,
      timestamp: new Date().toISOString(),
    };
    this.realtimeGateway.emitSync(payload);
  }
}
