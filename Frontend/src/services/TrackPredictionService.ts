import { SEASON_2026_SCHEDULE, SEASON_2026_DRIVERS } from '../data/season2026';

export interface DriverPrediction {
    driverName: string;
    team: string;
    position: number;
    winProbability: number;
    podiumProbability: number;
}

export interface TrackPrediction {
    trackName: string;
    circuit: string;
    date: string;
    trackType: string;
    difficulty: string;
    weather: {
        condition: string;
        tempC: number;
        rainChancePct: number;
    };
    predictions: DriverPrediction[];
}

export class TrackPredictionService {
    getAllTracks() {
        return SEASON_2026_SCHEDULE;
    }

    async generateAllTrackPredictions(): Promise<TrackPrediction[]> {
        return SEASON_2026_SCHEDULE.map((track, trackIndex) => {
            // Create a deterministic but track-specific seed for variety
            const seed = track.raceName.length + trackIndex;

            // Basic prediction factors
            const tracksDifficulty = ["Low", "Medium", "High", "Critical"];
            const trackTypes = ["STREET", "PERMANENT", "HIGH_SPEED", "TECHNICAL", "HYBRID"];

            const difficulty = tracksDifficulty[seed % tracksDifficulty.length];
            const trackType = trackTypes[seed % trackTypes.length];

            // Weather patterns
            const weatherConditions = ["Clear", "Sunny", "Overcast", "Partly Cloudy", "Light Rain", "Heavy Rain"];
            const condition = weatherConditions[seed % weatherConditions.length];
            const tempC = 18 + (seed % 15);
            const rainChancePct = condition.includes("Rain") ? 60 + (seed % 40) : (seed % 20);

            // Generate driver predictions
            // In a real scenario, this would call the simulator or ML engine
            // Here we use a heuristic based on driver/team "rank" for 2026
            const driverPredictions: DriverPrediction[] = [...SEASON_2026_DRIVERS]
                .map((driver, index) => {
                    // Add some "jitter" to the index for each track
                    const jitter = (Math.sin(seed + index) * 5);
                    const rank = index + jitter;
                    return { driver, rank };
                })
                .sort((a, b) => a.rank - b.rank)
                .map((item, index) => {
                    const position = index + 1;
                    // Heuristic probabilities
                    const winProbability = position === 1 ? 0.35 + (Math.random() * 0.1) :
                        position === 2 ? 0.20 + (Math.random() * 0.05) :
                            0.1 / position;

                    const podiumProbability = position <= 3 ? 0.6 + (Math.random() * 0.3) :
                        position <= 10 ? 0.3 + (Math.random() * 0.2) :
                            0.1;

                    return {
                        driverName: item.driver.name,
                        team: item.driver.teamName || 'Unknown',
                        position,
                        winProbability,
                        podiumProbability
                    };
                });

            return {
                trackName: track.raceName,
                circuit: track.circuit,
                date: track.date,
                trackType,
                difficulty,
                weather: {
                    condition,
                    tempC,
                    rainChancePct
                },
                predictions: driverPredictions
            };
        });
    }
}

export const trackPredictionService = new TrackPredictionService();
export default trackPredictionService;
