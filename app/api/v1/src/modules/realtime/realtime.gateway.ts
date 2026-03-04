import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RealtimeSyncPayload } from './realtime.types';

const allowedOrigins = (
  process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://127.0.0.1:3000'
)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

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
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly shouldLogWs =
    process.env.WS_LOGS === 'true' || process.env.NODE_ENV !== 'production';

  @WebSocketServer()
  private server!: Server;

  handleConnection(client: Socket) {
    const readyPayload = { timestamp: new Date().toISOString() };
    client.emit('sync:ready', readyPayload);
    if (this.shouldLogWs) {
      this.logger.log(
        `[ws] client connected id=${client.id} transport=${client.conn.transport.name} connected=${this.connectedClients()}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    if (this.shouldLogWs) {
      this.logger.log(
        `[ws] client disconnected id=${client.id} connected=${this.connectedClients()}`,
      );
    }
  }

  emitSync(payload: RealtimeSyncPayload) {
    if (this.shouldLogWs) {
      this.logger.log(
        `[ws] tx event=sync clients=${this.connectedClients()} topics=${payload.topics.join(',')}`,
      );
    }
    this.server.emit('sync', payload);
  }

  private connectedClients() {
    return this.server?.sockets?.sockets?.size ?? 0;
  }
}
