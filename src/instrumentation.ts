export async function register() {
  console.log('[Instrumentation] register() called');
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Running on Node.js runtime');
    const { SyncScheduler } = await import('./lib/sync-scheduler');
    const { WebSocketServer } = await import('./lib/websocket');
    
    SyncScheduler.start();
    WebSocketServer.init(3001);
  }
}
