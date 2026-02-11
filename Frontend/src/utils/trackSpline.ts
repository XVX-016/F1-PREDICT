import bahrainDense from '../data/bahrain_dense.json';

export interface Point {
    x: number;
    y: number;
    s?: number; // cumulative distance
}

export interface TrackData {
    trackId: string;
    totalLength: number;
    points: [number, number][]; // [x, y]
    cumulativeDistances: number[];
}

export interface TrackConfig {
    lengthMeters: number;
    pitEntryProgress: number;
    pitExitProgress: number;
    pitLossMs: number;
}

/**
 * Precomputes cumulative distance (arc-length) for a set of points.
 * Primarily used for dynamic tracks or pit lanes.
 */
export function buildDistanceMap(points: Point[]): TrackData {
    let total = 0;
    const mapped: [number, number][] = points.map((p, i) => {
        if (i > 0) {
            const prev = points[i - 1];
            total += Math.hypot(p.x - prev.x, p.y - prev.y);
        }
        return [p.x, p.y];
    });

    const cumulativeDistances: number[] = [];
    let acc = 0;
    mapped.forEach((p, i) => {
        if (i > 0) {
            const prev = mapped[i - 1];
            acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        }
        cumulativeDistances.push(acc);
    });

    return {
        trackId: 'dynamic',
        totalLength: total,
        points: mapped,
        cumulativeDistances
    };
}

/**
 * Returns the {x, y} coordinate for a given progress (0 to 1) 
 * using high-precision binary search on a track's LUT.
 */
export function positionFromProgress(track: TrackData, progress: number): Point {
    // Defensive check for invalid track data
    if (!track || !track.points || track.points.length === 0 || !track.cumulativeDistances) {
        console.warn(`[trackSpline] Invalid track data for lookup`, track);
        return { x: 0, y: 0 };
    }

    // Wrap progress between 0 and 1 and guard against NaN
    let p = ((progress % 1) + 1) % 1;
    if (isNaN(p)) p = 0;

    const targetDist = p * track.totalLength;

    const distances = track.cumulativeDistances;
    const points = track.points;

    // Binary search for the segment
    let low = 0;
    let high = distances.length - 1;
    let idx = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (distances[mid] <= targetDist) {
            idx = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    // idx is the start of the segment
    if (idx >= points.length - 1) {
        const pLast = points[points.length - 1];
        return { x: pLast[0], y: pLast[1] };
    }

    const a = points[idx];
    const b = points[idx + 1];
    const distA = distances[idx];
    const distB = distances[idx + 1];

    const segmentDist = distB - distA;
    if (segmentDist <= 0) return { x: a[0], y: a[1] };

    const t = (targetDist - distA) / segmentDist;
    return {
        x: a[0] + (b[0] - a[0]) * t,
        y: a[1] + (b[1] - a[1]) * t
    };
}

// --- Bahrain Spline Data ---
import bahrainPitDense from '../data/bahrain_pit_dense.json';

export const BAHRAIN_MAIN_TRACK: TrackData = bahrainDense as TrackData;

// Compatibility Export for TrackMap
export const BAHRAIN_MAIN_POINTS_VEC: [number, number][] = BAHRAIN_MAIN_TRACK.points;

// Use dense pit track
export const BAHRAIN_PIT_TRACK: TrackData = bahrainPitDense as TrackData;

export const BAHRAIN_PIT_POINTS: Point[] = BAHRAIN_PIT_TRACK.points.map(p => ({ x: p[0], y: p[1] }));

export const BAHRAIN_TRACK_CONFIG: TrackConfig = {
    lengthMeters: 5412,
    pitEntryProgress: 0.945, // Calibrated
    pitExitProgress: 0.085,  // Calibrated
    pitLossMs: 23000
};
