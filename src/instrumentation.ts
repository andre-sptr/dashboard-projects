export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startBackgroundServices } = await import('./lib/background-services');
    const { seedOltOdcIfEmpty } = await import('./lib/seed-olt-odc');

    seedOltOdcIfEmpty();
    await startBackgroundServices();
  }
}
