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

  @WebSocketServer()
  private server!: Server;

  handleConnection(client: Socket) {
    const readyPayload = { timestamp: new Date().toISOString() };
    client.emit('sync:ready', readyPayload);
    this.logger.log(
      `[ws] client connected id=${client.id} transport=${client.conn.transport.name} connected=${this.connectedClients()}`,
    );
    this.logger.log(
      `[ws] tx event=sync:ready clientId=${client.id} payload=${JSON.stringify(readyPayload)}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `[ws] client disconnected id=${client.id} connected=${this.connectedClients()}`,
    );
  }

  emitSync(payload: RealtimeSyncPayload) {
    this.logger.log(
      `[ws] tx event=sync clients=${this.connectedClients()} payload=${JSON.stringify(payload)}`,
    );
    this.server.emit('sync', payload);
  }

  private connectedClients() {
    return this.server?.sockets?.sockets?.size ?? 0;
  }
}
