export interface RaceSummary {
  id: string;
  round: number;
  name: string;
  circuit: string;
  country?: string;
  startDate: string; // ISO
  endDate?: string; // ISO
  timezone?: string;
  status?: 'upcoming' | 'live' | 'finished';
}

class RaceService {
  private static instance: RaceService;
  private constructor() {}

  static getInstance(): RaceService {
    if (!RaceService.instance) {
      RaceService.instance = new RaceService();
    }
    return RaceService.instance;
  }

  private get baseUrl(): string {
    // Defaults to dev backend
    return (import.meta as any).env?.VITE_API_URL || (process as any).env?.REACT_APP_API_URL || 'http://localhost:3001';
  }

  async getNextRace(season: number = new Date().getFullYear()): Promise<RaceSummary | null> {
    const res = await fetch(`${this.baseUrl}/api/races/next?season=${season}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const race = payload?.data;
    if (!race) return null;
    return {
      id: race.id,
      round: race.round,
      name: race.name,
      circuit: race.circuit,
      country: race.country,
      startDate: race.startDate,
      endDate: race.endDate,
      timezone: race.timezone,
      status: race.status,
    } as RaceSummary;
  }

  async getSeasonRaces(season: number): Promise<RaceSummary[]> {
    const res = await fetch(`${this.baseUrl}/api/races?season=${season}`);
    if (!res.ok) return [];
    const payload = await res.json();
    const races = payload?.data?.races || payload?.races || [];
    return races.map((r: any) => ({
      id: r.id,
      round: r.round,
      name: r.name,
      circuit: r.circuit,
      country: r.country,
      startDate: r.startDate || r.date_time,
      endDate: r.endDate,
      timezone: r.timezone,
      status: r.status,
    }));
  }
}

export default RaceService;


