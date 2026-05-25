function areBackgroundServicesEnabled() {
  return process.env.ENABLE_BACKGROUND_SERVICES === 'true';
}

function isAlertEnabled() {
  return process.env.WAHA_ALERT_ENABLED === 'true';
}

let shutdownRegistered = false;

export async function startBackgroundServices() {
  if (!areBackgroundServicesEnabled()) {
    console.log('[BackgroundServices] Disabled. Set ENABLE_BACKGROUND_SERVICES=true to enable sync scheduler and WebSocket.');
    return;
  }

  const [{ SyncScheduler }, { WebSocketServer }] = await Promise.all([
    import('./sync-scheduler'),
    import('./websocket'),
  ]);

  SyncScheduler.start();
  WebSocketServer.init(3001);

  if (isAlertEnabled()) {
    const { AlertScheduler } = await import('./alert-scheduler');
    AlertScheduler.start();
  } else {
    console.log('[BackgroundServices] WhatsApp alert disabled. Set WAHA_ALERT_ENABLED=true to enable.');
  }

  if (!shutdownRegistered) {
    shutdownRegistered = true;
    
    const handleShutdown = async (signal: string) => {
      console.log(`[BackgroundServices] Received ${signal}. Shutting down services gracefully...`);
      
      try {
        SyncScheduler.stop();
        console.log('[BackgroundServices] Stopped sync scheduler.');
        
        if (isAlertEnabled()) {
          const { AlertScheduler } = await import('./alert-scheduler');
          AlertScheduler.stop();
          console.log('[BackgroundServices] Stopped alert scheduler.');
        }
        
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log('[BackgroundServices] Graceful shutdown completed successfully.');
        process.exit(0);
      } catch (err) {
        console.error('[BackgroundServices] Error during graceful shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  }
}
