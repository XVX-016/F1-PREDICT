import { BettingEngine } from './BettingEngine';

export class BettingScheduler {
  private engine = new BettingEngine();

  start(): void {
    // Always rebuild markets fresh on start
    this.engine.bootstrap();
    // Placeholder schedule: settle current and create next every 24 hours
    setInterval(() => {
      void this.engine.settleAndAdvance({ winningOptionId: 'fav' });
    }, 24 * 60 * 60 * 1000);
  }
}

// Boot on import for demo; adjust to your app's entrypoint if needed
new BettingScheduler().start();


