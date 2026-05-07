import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

export class WebSocketServer {
  private static io: SocketIOServer | null = null;

  static init(port: number = 3001) {
    if (this.io) return;

    const httpServer = createServer();
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log('[WebSocket] Client connected:', socket.id);

      socket.on('join', (room: string) => {
        socket.join(room);
        console.log(`[WebSocket] Client ${socket.id} joined room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log('[WebSocket] Client disconnected:', socket.id);
      });
    });

    httpServer.listen(port, () => {
      console.log(`[WebSocket] Server listening on port ${port}`);
    });
  }

  static getInstance(): SocketIOServer {
    if (!this.io) {
      this.init();
    }
    return this.io!;
  }

  static emit(event: string, data: any, room?: string) {
    if (!this.io) return;
    if (room) {
      this.io.to(room).emit(event, data);
    } else {
      this.io.emit(event, data);
    }
  }
}
