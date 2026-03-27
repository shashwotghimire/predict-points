import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RealtimeSyncPayload, RealtimeTopic } from './realtime.types';
import { getRequiredSecret } from '../../common/security/env';

const allowedOrigins = (
  process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://127.0.0.1:3000'
)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const publicTopics: ReadonlySet<RealtimeTopic> = new Set([
  'markets',
  'market',
  'activity',
  'leaderboard',
  'rewards-catalog',
  'predictions',
] as const);

const userScopedTopics: ReadonlySet<RealtimeTopic> = new Set([
  'user-points',
  'user-predictions',
  'user-rewards',
] as const);

const adminTopics: ReadonlySet<RealtimeTopic> = new Set([
  'admin-users',
] as const);
const adminRoom = 'role:admin';

type RealtimeSocketUser = {
  id: string;
  role: string;
};

type AccessTokenPayload = {
  sub: string;
  role: string;
  type?: string;
};

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly jwtService: JwtService) {}

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly shouldLogWs =
    process.env.WS_LOGS === 'true' || process.env.NODE_ENV !== 'production';

  @WebSocketServer()
  private server!: Server;

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticateClient(client);
      if (user) {
        client.data.user = user;
        client.join(this.userRoom(user.id));
        if (this.isAdminRole(user.role)) {
          client.join(adminRoom);
        }
      }
    } catch {
      client.disconnect(true);
      return;
    }

    const readyPayload = { timestamp: new Date().toISOString() };
    client.emit('sync:ready', readyPayload);
    if (this.shouldLogWs) {
      const user = client.data.user as RealtimeSocketUser | undefined;
      this.logger.log(
        `[ws] client connected id=${client.id} user=${user?.id ?? 'anonymous'} transport=${client.conn.transport.name} connected=${this.connectedClients()}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    if (this.shouldLogWs) {
      const user = client.data.user as RealtimeSocketUser | undefined;
      this.logger.log(
        `[ws] client disconnected id=${client.id} user=${user?.id ?? 'anonymous'} connected=${this.connectedClients()}`,
      );
    }
  }

  emitSync(payload: RealtimeSyncPayload) {
    if (this.shouldLogWs) {
      this.logger.log(
        `[ws] tx event=sync clients=${this.connectedClients()} topics=${payload.topics.join(',')}`,
      );
    }

    const sharedFields = {
      marketId: payload.marketId,
      timestamp: payload.timestamp,
    };

    const publicPayloadTopics = payload.topics.filter((topic) =>
      publicTopics.has(topic),
    );
    if (publicPayloadTopics.length > 0) {
      this.server.emit('sync', {
        ...sharedFields,
        topics: publicPayloadTopics,
      });
    }

    const userPayloadTopics = payload.topics.filter((topic) =>
      userScopedTopics.has(topic),
    );
    if (userPayloadTopics.length > 0 && payload.userId) {
      this.server.to(this.userRoom(payload.userId)).emit('sync', {
        ...sharedFields,
        topics: userPayloadTopics,
        userId: payload.userId,
      });
    }

    const adminPayloadTopics = payload.topics.filter((topic) =>
      adminTopics.has(topic),
    );
    if (adminPayloadTopics.length > 0) {
      this.server.to(adminRoom).emit('sync', {
        ...sharedFields,
        topics: adminPayloadTopics,
      });
    }
  }

  private connectedClients() {
    return this.server?.sockets?.sockets?.size ?? 0;
  }

  private async authenticateClient(client: Socket) {
    const token = this.extractAccessToken(client);
    if (!token) return null;

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: getRequiredSecret('JWT_SECRET'),
        },
      );

      if (payload.type && payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        id: payload.sub,
        role: payload.role,
      } satisfies RealtimeSocketUser;
    } catch {
      this.logger.warn(`[ws] rejected socket id=${client.id} invalid token`);
      throw new Error('Unauthorized websocket');
    }
  }

  private extractAccessToken(client: Socket) {
    const authHeader = client.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    const cookieHeader = client.handshake.headers.cookie;
    if (typeof cookieHeader !== 'string') return null;

    for (const chunk of cookieHeader.split(';')) {
      const [rawName, ...rawValueParts] = chunk.trim().split('=');
      if (rawName !== 'access_token') continue;
      return decodeURIComponent(rawValueParts.join('='));
    }

    return null;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private isAdminRole(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }
}
