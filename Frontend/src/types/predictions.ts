export type Race = {
  id: string;           // e.g., "aus"
  round: number;
  name: string;         // "Australian Grand Prix"
  circuit: string;      // "Albert Park Circuit"
  city: string;         // "Melbourne"
  country: string;      // "Australia"
  startDate: string;    // "2025-03-14"
  endDate: string;      // "2025-03-16"
  timezone: string;     // "Australia/Melbourne"
  has_sprint: boolean;
  status: "upcoming" | "live" | "finished";
};

export type Weather = {
  date: string;           // race day (local to track)
  tempC: number;
  windKmh: number;
  rainChancePct: number;
  condition: "Sunny"|"Cloudy"|"Rain"|"Storm";
};

export type DriverPrediction = {
  driverId: string;        // "VER"
  driverName: string;      // "Max Verstappen"
  team: string;            // "Red Bull"
  grid?: string;           // optional "P2" etc.
  predictedLapTime?: number; // optional seconds
  winProbPct: number;      // 0..100
  podiumProbPct: number;   // 0..100
  position: number;        // 1..20 (sorted)
};

export type RacePrediction = {
  raceId: string;
  generatedAt: string;     // ISO
  weatherUsed?: Weather | null;    // either forecast or user-custom
  race?: string;           // human-readable race name
  date?: string;           // ISO date string for race
  top3: DriverPrediction[]; // first three entries from `all`
  all: DriverPrediction[]; // length = drivers on grid
  modelStats: { accuracyPct: number; meanErrorSec: number; trees: number; lr: number };
};
