import { RaceTimeline } from '../types/domain';
import { TelemetrySample, DriverMetadata } from './ReplayEngine';

/**
 * Transforms backend RaceTimeline into ReplayEngine-compatible telemetry and metadata.
 */
export function transformTimelineData(timeline: RaceTimeline): {
    metadata: DriverMetadata[];
    telemetry: Record<string, TelemetrySample[]>;
} {
    const telemetry: Record<string, TelemetrySample[]> = {};
    const driverIds = new Set<string>();

    const rawTelemetry = timeline?.telemetry ?? [];
    if (rawTelemetry.length === 0) {
        console.warn('[ReplayDataHelper] No telemetry returned for replay timeline.');
    }

    // 1. Process Telemetry Frames
    rawTelemetry.forEach(f => {
        if (!telemetry[f.driver_id]) {
            telemetry[f.driver_id] = [];
            driverIds.add(f.driver_id);
        }

        telemetry[f.driver_id].push({
            t: f.t || 0,
            lap: (f as any).lap || 1,
            progress: isNaN(f.rel_dist) ? 0 : (f.rel_dist || 0),
            speed: isNaN(f.speed) ? 0 : (f.speed || 0),
            throttle: isNaN(f.throttle) ? 0 : (f.throttle || 0),
            brake: isNaN(f.brake) ? 0 : (f.brake || 0),
            gear: isNaN(f.gear) ? 1 : (f.gear || 1),
            drs: (f.drs || 0) > 0,
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
