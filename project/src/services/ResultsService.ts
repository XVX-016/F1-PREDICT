// Lightweight wrapper around Ergast API to fetch recent F1 results
// Docs: http://ergast.com/mrd/

export interface RaceResult {
  round: number;
  season: string;
  raceName: string;
  date: string;
  poleDriverId: string | null;
  podiumDriverIds: string[]; // [P1,P2,P3] using normalized ids
}

function normalizeDriverId(apiId: string): string {
  return apiId.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default class ResultsService {
  static async getLastRaceResult(): Promise<RaceResult | null> {
    try {
      // Last completed race
      const res = await fetch('https://ergast.com/api/f1/current/last/results.json');
      const data = await res.json();
      const mrdata = data?.MRData;
      const race = mrdata?.RaceTable?.Races?.[0];
      if (!race) return null;
      const season = race.season;
      const round = Number(race.round);
      const raceName = race.raceName;
      const date = race.date;
      const results = race.Results || [];
      const podiumDriverIds: string[] = results.slice(0, 3).map((r: any) => normalizeDriverId(r?.Driver?.driverId || ''));

      // Get pole for that round
      let poleDriverId: string | null = null;
      try {
        const q = await fetch(`https://ergast.com/api/f1/${season}/${round}/qualifying.json`);
        const qd = await q.json();
        const qrace = qd?.MRData?.RaceTable?.Races?.[0];
        const q1 = qrace?.QualifyingResults?.[0];
        poleDriverId = q1 ? normalizeDriverId(q1?.Driver?.driverId || '') : null;
      } catch {}

      return { round, season, raceName, date, poleDriverId, podiumDriverIds };
    } catch (e) {
      console.warn('ResultsService.getLastRaceResult failed', e);
      return null;
    }
  }
}


