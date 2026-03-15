export type RuntimeRaceStatus = 'upcoming' | 'live' | 'completed';

const DEFAULT_LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

export type ScheduleRaceLike = {
  date?: string | null;
  time?: string | null;
  startISO?: string | null;
  raceName?: string;
  name?: string;
};

export type RaceTimingState = {
  startTime: Date;
  endTime: Date;
  status: RuntimeRaceStatus;
  isNext: boolean;
  countdown: string;
  label: 'NEXT' | 'LIVE' | 'RACE COMPLETE';
  relativeMs: number;
};

const isIsoLike = (value: string) => value.includes('T');

export const toRaceStartTime = (race: ScheduleRaceLike): Date => {
  if (race.startISO) {
    return new Date(race.startISO);
  }

  const date = race.date ?? '';
  const rawTime = race.time ?? '00:00:00Z';
  if (!date) {
    return new Date(NaN);
  }

  if (isIsoLike(rawTime)) {
    return new Date(rawTime);
  }

  const normalizedTime = rawTime.includes('Z') ? rawTime : `${rawTime}Z`;
  return new Date(`${date}T${normalizedTime}`);
};

export const getRuntimeRaceStatus = (
  race: ScheduleRaceLike,
  now = new Date(),
  liveWindowMs = DEFAULT_LIVE_WINDOW_MS
): RuntimeRaceStatus => {
  const startTime = toRaceStartTime(race);
  const startMs = startTime.getTime();

  if (Number.isNaN(startMs)) {
    return 'upcoming';
  }

  const nowMs = now.getTime();
  if (nowMs < startMs) return 'upcoming';
  if (nowMs <= startMs + liveWindowMs) return 'live';
  return 'completed';
};

export const formatCountdown = (targetTime: Date, now = new Date()) => {
  const diff = Math.max(0, targetTime.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const getRaceTimingState = (
  race: ScheduleRaceLike,
  now = new Date(),
  liveWindowMs = DEFAULT_LIVE_WINDOW_MS
): RaceTimingState => {
  const startTime = toRaceStartTime(race);
  const endTime = new Date(startTime.getTime() + liveWindowMs);
  const status = getRuntimeRaceStatus(race, now, liveWindowMs);

  if (status === 'live') {
    return {
      startTime,
      endTime,
      status,
      isNext: false,
      countdown: 'LIVE',
      label: 'LIVE',
      relativeMs: 0,
    };
  }

  if (status === 'completed') {
    return {
      startTime,
      endTime,
      status,
      isNext: false,
      countdown: 'Race Complete',
      label: 'RACE COMPLETE',
      relativeMs: 0,
    };
  }

  return {
    startTime,
    endTime,
    status,
    isNext: true,
    countdown: formatCountdown(startTime, now),
    label: 'NEXT',
    relativeMs: startTime.getTime() - now.getTime(),
  };
};

export const sortByRaceStart = <T extends ScheduleRaceLike>(races: T[]) =>
  [...races].sort((a, b) => toRaceStartTime(a).getTime() - toRaceStartTime(b).getTime());

export const getFeaturedRace = <T extends ScheduleRaceLike>(races: T[], now = new Date()): T | null => {
  const sorted = sortByRaceStart(races);
  const nextOrLive = sorted.find((race) => {
    const status = getRuntimeRaceStatus(race, now);
    return status === 'upcoming' || status === 'live';
  });
  if (nextOrLive) return nextOrLive;

  const completed = sorted.filter((race) => getRuntimeRaceStatus(race, now) === 'completed');
  return completed.length > 0 ? completed[completed.length - 1] : (sorted[0] ?? null);
};
