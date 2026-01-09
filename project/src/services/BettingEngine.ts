import BettingService from './BettingService';
import { F1_2025_CALENDAR } from '../data/f1-2025-calendar';
import { MarketCategory, BettingMarket } from '../types/betting';

export class BettingEngine {
  private svc = BettingService.getInstance();
  private idx = 0;

  bootstrap(): void {
    // Clear all existing sample markets and rebuild from calendar
    this.svc.clearMarkets();

    // Pick the next upcoming race as starting point
    const calendar: any[] = F1_2025_CALENDAR as any;
    const now = new Date();
    const nextIdx = Math.max(
      0,
      calendar.findIndex((r) => new Date(r.date) >= now)
    );
    this.idx = nextIdx === -1 ? 0 : nextIdx;

    const race = calendar[this.idx];
    if (race) {
      void this.generateMarketsForRace(race);
    }
  }

  async generateMarketsForRace(race: any): Promise<void> {
    // Basic single market example. Replace with richer market generation later.
    await this.svc.createMarket({
      title: `Race Winner - ${race.name}`,
      description: `Who will win the ${race.name}?`,
      category: MarketCategory.RACE_WINNER,
      raceId: race.id,
      raceName: race.name,
      raceDate: new Date(race.date),
      options: [
        { id: 'fav', title: 'Favourite', price: 35 },
        { id: 'contender', title: 'Contender', price: 25 },
        { id: 'field', title: 'Field', price: 10 }
      ],
      expiresAt: new Date(new Date(race.date).getTime() - 24 * 60 * 60 * 1000)
    });
  }

  async settleAndAdvance(results: { winningOptionId: string }): Promise<void> {
    const race = (F1_2025_CALENDAR as any)[this.idx];
    if (race) {
      // Find the active race-winner market for this race and settle it
      const markets: BettingMarket[] = await this.svc.getMarkets();
      const target = markets.find(
        (m) => m.raceId === race.id && m.category === MarketCategory.RACE_WINNER && m.isActive
      );
      if (target) {
        await this.svc.settleMarket(target.id, results.winningOptionId);
      }
    }

    this.idx++;
    const next = (F1_2025_CALENDAR as any)[this.idx];
    if (next) {
      await this.generateMarketsForRace(next);
    }
  }
}


