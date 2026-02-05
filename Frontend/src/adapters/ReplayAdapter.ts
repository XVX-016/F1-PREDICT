import { RaceTimeline, TelemetryFrame } from "../types/domain";

export interface ReplayState {
    currentTime: number;
    currentLap: number;
    totalLaps: number;
    drivers: Record<string, DriverReplayState>;
    status: string;
    isFinished: boolean;
}

export interface DriverReplayState {
    driverId: string;
    name: string;
    teamName: string;
    teamColor: string;
    position: number;
    speed: number;
    gear: number;
    drs: boolean;
    throttle: number;
    brake: number;
    compound: string;
    tyreLife: number;
    gapToFront: number;
    x: number;
    y: number; // progress: number; // 0 to 1 relative distance
    progress: number;
}

/**
 * ReplayAdapter
 * Bridges the gap between raw backend RaceTimeline and the high-density UI.
 */
// 2024 Driver Map (Simplified)
const DRIVER_MAP: Record<string, { name: string; team: string; color: string }> = {
    "VER": { name: "Max Verstappen", team: "Red Bull Racing", color: "#3671C6" },
    "PER": { name: "Sergio Perez", team: "Red Bull Racing", color: "#3671C6" },
    "LEC": { name: "Charles Leclerc", team: "Ferrari", color: "#E80020" },
    "SAI": { name: "Carlos Sainz", team: "Ferrari", color: "#E80020" },
    "NOR": { name: "Lando Norris", team: "McLaren", color: "#FF8000" },
    "PIA": { name: "Oscar Piastri", team: "McLaren", color: "#FF8000" },
    "HAM": { name: "Lewis Hamilton", team: "Mercedes", color: "#27F4D2" },
    "RUS": { name: "George Russell", team: "Mercedes", color: "#27F4D2" },
    "ALO": { name: "Fernando Alonso", team: "Aston Martin", color: "#229971" },
    "STR": { name: "Lance Stroll", team: "Aston Martin", color: "#229971" },
    "TSU": { name: "Yuki Tsunoda", team: "RB", color: "#6692FF" },
    "RIC": { name: "Daniel Ricciardo", team: "RB", color: "#6692FF" },
    "HUL": { name: "Nico Hulkenberg", team: "Haas", color: "#B6BABD" },
    "MAG": { name: "Kevin Magnussen", team: "Haas", color: "#B6BABD" },
    "ALB": { name: "Alexander Albon", team: "Williams", color: "#64C4FF" },
    "SAR": { name: "Logan Sargeant", team: "Williams", color: "#64C4FF" },
    "BOT": { name: "Valtteri Bottas", team: "Kick Sauber", color: "#52E252" },
    "ZHO": { name: "Zhou Guanyu", team: "Kick Sauber", color: "#52E252" },
    "GAS": { name: "Pierre Gasly", team: "Alpine", color: "#0093CC" },
    "OCO": { name: "Esteban Ocon", team: "Alpine", color: "#0093CC" },
    "COL": { name: "Franco Colapinto", team: "Williams", color: "#64C4FF" },
    "BEA": { name: "Oliver Bearman", team: "Ferrari", color: "#E80020" }
};

export class ReplayAdapter {
    static getInitialState(timeline: RaceTimeline): ReplayState {
        const totalLaps = timeline.meta.lap_count || 0;
        return {
            currentTime: 0,
            currentLap: 1,
            totalLaps: totalLaps,
            drivers: {},
            status: "READY",
            isFinished: false
        };
    }

    static resolveStateAtTime(timeline: RaceTimeline, t: number): ReplayState {
        // 1. Find the telemetry frames for each driver closest to time t
        const drivers: Record<string, DriverReplayState> = {};
        let currentLap = 1;

        // Group telemetry by driver
        const telemetryByDriver: Record<string, TelemetryFrame[]> = {};
        timeline.telemetry.forEach(f => {
            if (!telemetryByDriver[f.driver_id]) telemetryByDriver[f.driver_id] = [];
            telemetryByDriver[f.driver_id].push(f);
        });

        Object.keys(telemetryByDriver).forEach(id => {
            const driverFrames = telemetryByDriver[id];
            // Find frame closest to t (without going over)
            let frame = driverFrames[0];
            for (let i = 0; i < driverFrames.length; i++) {
                if (driverFrames[i].t <= t) {
                    frame = driverFrames[i];
                } else {
                    break;
                }
            }

            if (frame) {
                const info = DRIVER_MAP[id] || { name: id, team: "Unknown", color: "#CCCCCC" };

                drivers[id] = {
                    driverId: id,
                    name: info.name,
                    teamName: info.team,
                    teamColor: info.color,
                    position: 0, // Calculated below
                    speed: frame.speed,
                    gear: frame.gear,
                    drs: frame.drs > 0,
                    throttle: frame.throttle,
                    brake: frame.brake,
                    compound: frame.compound || "M",
                    tyreLife: frame.tyre_life || 0,
                    gapToFront: 0,
                    x: frame.x,
                    y: frame.y,
                    progress: frame.rel_dist
                };
                if (id === "VER") currentLap = (frame as any).lap || 1;
            }
        });

        // 2. Calculate positions based on total distance covered
        const sortedDrivers = Object.values(drivers).sort(() => {
            return 0; // TODO: Use dist if available
        });

        sortedDrivers.forEach((d, i) => {
            d.position = i + 1;
        });

        return {
            currentTime: t,
            currentLap: currentLap,
            totalLaps: timeline.meta.lap_count || 1,
            drivers,
            status: "PLAYING",
            isFinished: t >= timeline.summary.total_time_ms
        };
    }
}
