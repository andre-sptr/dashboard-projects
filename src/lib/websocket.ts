import { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';

type WebSocketGlobalState = {
  httpServer: HttpServer | null;
  io: SocketIOServer | null;
  port: number | null;
};

const webSocketState = ((globalThis as typeof globalThis & {
  __dashboardWebSocket?: WebSocketGlobalState;
}).__dashboardWebSocket ??= {
  httpServer: null,
  io: null,
  port: null,
});

export class WebSocketServer {
  static init(port: number = 3001) {
    if (webSocketState.io) {
      if (webSocketState.port !== port) {
        console.warn(`[WebSocket] Server already listening on port ${webSocketState.port}, requested ${port}`);
      }
      return;
    }

        const httpServer = createServer();
    
    let origin: string | string[] = '*';
    if (process.env.NODE_ENV === 'production') {
      if (process.env.NEXT_PUBLIC_APP_URL) {
        origin = process.env.NEXT_PUBLIC_APP_URL;
      } else {
        console.warn('[WebSocket] Running in production but NEXT_PUBLIC_APP_URL is not defined! WebSocket CORS is open ("*").');
      }
    }

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin,
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      socket.on('join', (room: string) => {
        socket.join(room);
      });
    });

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.warn(`[WebSocket] Port ${port} is already in use. Reusing existing external server if available.`);
        webSocketState.io = null;
        webSocketState.httpServer = null;
        webSocketState.port = null;
        io.close();
        return;
      }

      throw error;
    });

    webSocketState.io = io;
    webSocketState.httpServer = httpServer;
    webSocketState.port = port;

    httpServer.listen(port, () => {
      console.log(`[WebSocket] Server listening on port ${port}`);
    });
  }

  static getInstance(): SocketIOServer {
    if (!webSocketState.io) {
      this.init();
    }
    return webSocketState.io!;
  }

  static emit(event: string, data: unknown, room?: string) {
    const io = webSocketState.io;
    if (!io) return;
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
  }
}
