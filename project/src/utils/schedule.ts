import { Race } from '../types/predictions';

export function getNextRace(races: Race[], now = new Date()): Race | null {
  return races
    .filter(r => new Date(r.endDate + "T23:59:59") >= now) // still upcoming or this weekend
    .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] || null;
}

export function getRaceStatus(race: Race, now = new Date()): "upcoming" | "live" | "finished" {
  const startDate = new Date(race.startDate);
  const endDate = new Date(race.endDate + "T23:59:59");
  
  if (now < startDate) return "upcoming";
  if (now >= startDate && now <= endDate) return "live";
  return "finished";
}

export function isRaceThisWeekend(race: Race, now = new Date()): boolean {
  const raceDate = new Date(race.startDate);
  const daysDiff = Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff >= 0 && daysDiff <= 7;
}

export function formatRaceDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getTimeUntilRace(race: Race, now = new Date()): { days: number; hours: number; minutes: number } {
  const raceDate = new Date(race.startDate);
  const diff = raceDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}
