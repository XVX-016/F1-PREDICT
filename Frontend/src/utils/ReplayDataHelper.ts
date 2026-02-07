import { RaceTimeline, TelemetryFrame } from '../types/domain';
import { TelemetrySample, DriverMetadata } from './ReplayEngine';

/**
 * Generates sample telemetry for demo purposes when API returns no data.
 */
function generateSampleTelemetry(): TelemetryFrame[] {
    const drivers = ['VER', 'NOR', 'LEC', 'HAM', 'SAI', 'PER', 'RUS', 'PIA', 'ALO', 'STR'];
    const frames: TelemetryFrame[] = [];

    // Generate 60 seconds of data at 1Hz per driver
    const durationMs = 60000;
    const interval = 1000;

    for (let t = 0; t < durationMs; t += interval) {
        drivers.forEach((driverId, idx) => {
            // Progress: each driver starts offset by position
            const baseProgress = (t / 90000) + (idx * 0.02);
            const progress = baseProgress % 1;

            frames.push({
                t,
                driver_id: driverId,
                x: 0,
                y: 0,
                dist: progress * 5412,
                rel_dist: progress,
                speed: 280 + Math.random() * 40,
                gear: 7,
                drs: progress > 0.4 && progress < 0.6 ? 1 : 0,
                throttle: 0.9,
                brake: 0.0
            });
        });
    }

    return frames;
}

/**
 * Transforms backend RaceTimeline into ReplayEngine-compatible telemetry and metadata.
 */
export function transformTimelineData(timeline: RaceTimeline): {
    metadata: DriverMetadata[];
    telemetry: Record<string, TelemetrySample[]>;
} {
    const telemetry: Record<string, TelemetrySample[]> = {};
    const driverIds = new Set<string>();

    // Defensive: Use sample data if telemetry is missing
    const rawTelemetry = timeline?.telemetry ?? generateSampleTelemetry();

    if (!timeline?.telemetry || timeline.telemetry.length === 0) {
        console.warn('[ReplayDataHelper] No telemetry from API, using sample data.');
    }

    // 1. Process Telemetry Frames
    rawTelemetry.forEach(f => {
        if (!telemetry[f.driver_id]) {
            telemetry[f.driver_id] = [];
            driverIds.add(f.driver_id);
        }

        telemetry[f.driver_id].push({
            t: f.t,
            lap: (f as any).lap || 1,
            progress: f.rel_dist,
            speed: f.speed,
            throttle: f.throttle,
            brake: f.brake,
            gear: f.gear,
            drs: f.drs > 0,
            isPitting: (f as any).is_pitting || false
        });
    });

    // 2. Build Metadata using centralized DRIVER_INFO
    const metadata: DriverMetadata[] = Array.from(driverIds).map(id => {
        const info = DRIVER_INFO[id] || { name: id, team: 'Unknown', color: '#CCCCCC', number: 0 };
        return {
            id,
            number: info.number,
            name: info.name,
            team: info.team,
            teamColor: info.color,
            grid: 0
        };
    });

    return { metadata, telemetry };
}

export const DRIVER_INFO: Record<string, { name: string; team: string; color: string; number: number }> = {
    "VER": { name: "Max Verstappen", team: "Red Bull Racing", color: "#3671C6", number: 1 },
    "PER": { name: "Sergio Perez", team: "Red Bull Racing", color: "#3671C6", number: 11 },
    "LEC": { name: "Charles Leclerc", team: "Ferrari", color: "#E80020", number: 16 },
    "SAI": { name: "Carlos Sainz", team: "Ferrari", color: "#E80020", number: 55 },
    "NOR": { name: "Lando Norris", team: "McLaren", color: "#FF8000", number: 4 },
    "PIA": { name: "Oscar Piastri", team: "McLaren", color: "#FF8000", number: 81 },
    "HAM": { name: "Lewis Hamilton", team: "Mercedes", color: "#27F4D2", number: 44 },
    "RUS": { name: "George Russell", team: "Mercedes", color: "#27F4D2", number: 63 },
    "ALO": { name: "Fernando Alonso", team: "Aston Martin", color: "#229971", number: 14 },
    "STR": { name: "Lance Stroll", team: "Aston Martin", color: "#229971", number: 18 },
    "TSU": { name: "Yuki Tsunoda", team: "RB", color: "#6692FF", number: 22 },
    "RIC": { name: "Daniel Ricciardo", team: "RB", color: "#6692FF", number: 3 },
    "HUL": { name: "Nico Hulkenberg", team: "Haas", color: "#B6BABD", number: 27 },
    "MAG": { name: "Kevin Magnussen", team: "Haas", color: "#B6BABD", number: 20 },
    "ALB": { name: "Alexander Albon", team: "Williams", color: "#64C4FF", number: 23 },
    "SAR": { name: "Logan Sargeant", team: "Williams", color: "#64C4FF", number: 2 },
    "BOT": { name: "Valtteri Bottas", team: "Kick Sauber", color: "#52E252", number: 77 },
    "ZHO": { name: "Zhou Guanyu", team: "Kick Sauber", color: "#52E252", number: 24 },
    "GAS": { name: "Pierre Gasly", team: "Alpine", color: "#0093CC", number: 10 },
    "OCO": { name: "Esteban Ocon", team: "Alpine", color: "#0093CC", number: 31 }
};
