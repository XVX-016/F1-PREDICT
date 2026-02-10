import { TrackData, TrackConfig, positionFromProgress } from './trackSpline';

/**
 * Invariants:
 * - Deterministic: same inputs (telemetry + metadata) -> same replay state
 * - No randomness: all stochastic behavior must be seeded or pre-calculated
 * - No wall-clock time: simulation time is strictly driven by tick(dt)
 * - All state derived from timing + events
 */

/**
 * Driver telemetry point following the production-grade schema.
 */
export interface TelemetrySample {
    t: number;      // ms since race start
    lap: number;
    progress: number; // 0-1 relative distance on main track
    speed: number;
    throttle: number;
    brake: number;
    gear: number;
    drs: boolean;
    isPitting?: boolean; // Flag to indicate if on pit spline
}

// --- Pit State Machine ---
enum PitState {
    TRACK = 0,
    ENTERING = 1,
    PIT_LANE = 2,
    EXITING = 3
}

interface PitContext {
    state: PitState;
    distance: number; // Meters along pit spline
    blendFactor: number; // 0-1 for transitions
    stationaryTimer: number; // ms
}

export interface DriverMetadata {
    id: string;
    number: number;
    name: string;
    team: string;
    teamColor: string;
    grid: number;
}

export interface ReplayState {
    currentTime: number;
    playing: boolean;
    speed: number;
    currentLap: number;
    totalLaps: number;
    drivers: Record<string, DriverState>;
    config: TrackConfig;
}

export interface DriverState extends TelemetrySample {
    id: string;
    name: string;
    teamColor: string;
    position: number;
    gapToLeader: number;
    x: number;
    y: number;
    inPit: boolean;
    pitContext: PitContext;
}

export class ReplayEngine {
    private telemetry: Record<string, TelemetrySample[]> = {};
    private metadata: Record<string, DriverMetadata> = {};

    // Core state
    private currentTime = 0;
    private speedMultiplier = 1;
    private isPlaying = false;
    private duration = 0;

    // Pit Constants
    private readonly PIT_LANE_SPEED_GREEN = 80 / 3.6; // ~22.2 m/s
    private readonly PIT_LANE_SPEED_SC = 60 / 3.6;    // ~16.6 m/s
    private readonly PIT_STOP_DURATION = 2500;        // 2.5s stationary
    private readonly BLEND_DURATION = 1.0;            // Seconds to blend entry/exit

    // New internal state for ReplayEngine
    private driverPitStates: Record<string, PitContext> = {};

    constructor(
        private mainTrack: TrackData,
        private pitTrack: TrackData,
        private config: TrackConfig
    ) { }

    loadData(metadata: DriverMetadata[], telemetry: Record<string, TelemetrySample[]>) {
        this.metadata = {};
        metadata.forEach(m => this.metadata[m.id] = m);

        // Ensure telemetry samples are sorted by time (t)
        this.telemetry = {};
        Object.entries(telemetry).forEach(([id, samples]) => {
            this.telemetry[id] = [...samples].sort((a, b) => a.t - b.t);
            // Initialize Pit State
            this.driverPitStates[id] = {
                state: PitState.TRACK,
                distance: 0,
                blendFactor: 0,
                stationaryTimer: 0
            };
        });

        // Compute authoritative duration
        let maxT = 0;
        Object.values(this.telemetry).forEach(samples => {
            if (samples.length > 0) {
                maxT = Math.max(maxT, samples[samples.length - 1].t);
            }
        });
        this.duration = maxT;
        this.currentTime = 0;
    }

    play() { this.isPlaying = true; }
    pause() { this.isPlaying = false; }
    setSpeed(s: number) { this.speedMultiplier = s; }

    seek(t: number) {
        this.currentTime = Math.max(0, Math.min(t, this.duration));

        // TODO(PHASE-3): Proper indexed state snapshots for O(1) seeks.
        // Current seek mechanism simplistically resets pit states to avoid stuck states.
        // To be fully deterministic, we should ideally replay events from the nearest keyframe.
        Object.keys(this.driverPitStates).forEach(id => {
            this.driverPitStates[id] = {
                state: PitState.TRACK,
                distance: 0,
                blendFactor: 0,
                stationaryTimer: 0
            };
        });
    }

    /**
     * Advances simulation by dt seconds.
     * Uses monotonic time increment.
     */
    tick(dt: number) {
        if (!this.isPlaying) return;

        // Advance Time
        this.currentTime += dt * 1000 * this.speedMultiplier;
        if (this.currentTime >= this.duration) {
            this.currentTime = this.duration;
            this.isPlaying = false;
        }

        // Update Pit Logic for all drivers
        Object.keys(this.telemetry).forEach(driverId => {
            this.updatePitLogic(driverId, dt * this.speedMultiplier);
        });
    }

    private updatePitLogic(driverId: string, dt: number) {
        const context = this.driverPitStates[driverId];
        // Get "target" main track state from pure interpolation
        const mainState = this.interpolateDriver(driverId, this.currentTime);
        // Note: isPitting comes from telemetry sample

        switch (context.state) {
            case PitState.TRACK:
                // Transition Check: Intent + Position
                if (mainState.isPitting && mainState.progress >= this.config.pitEntryProgress) {
                    context.state = PitState.ENTERING;
                    context.blendFactor = 0;
                    context.distance = 0;
                }
                break;

            case PitState.ENTERING:
                // Blend from Track -> Pit
                context.blendFactor += dt / this.BLEND_DURATION;
                if (context.blendFactor >= 1) {
                    context.blendFactor = 1;
                    context.state = PitState.PIT_LANE;
                    context.distance = 0;
                }
                break;

            case PitState.PIT_LANE: {
                // Move along pit spline
                // Speed Limit Logic (Simplified: Green flag speed)
                // TODO(PHASE-4): Check RaceControl interface for SC/VSC status to adjust pit lane speed limit dynamically.
                const isSC = false; // Placeholder for RaceControl
                const speedLimit = isSC ? this.PIT_LANE_SPEED_SC : this.PIT_LANE_SPEED_GREEN;

                // Stationary Logic (Mid-pit approximately ~200m?)
                // Bahrain Pit is ~420m. Mid is 210m.
                const midPoint = this.pitTrack.totalLength / 2;
                if (Math.abs(context.distance - midPoint) < 5 && context.stationaryTimer < this.PIT_STOP_DURATION) {
                    context.stationaryTimer += dt * 1000; // accumulate ms
                    // Car is stopped
                } else {
                    context.distance += speedLimit * dt;
                }

                // Transition Check: End of Pit Lane
                if (context.distance >= this.pitTrack.totalLength) {
                    context.state = PitState.EXITING;
                    context.blendFactor = 0;
                    context.distance = this.pitTrack.totalLength;
                }
                break;
            }

            case PitState.EXITING:
                // Blend from Pit -> Track
                context.blendFactor += dt / this.BLEND_DURATION;
                if (context.blendFactor >= 1) {
                    context.blendFactor = 1;
                    context.state = PitState.TRACK;
                    // Reset
                    context.distance = 0;
                    context.stationaryTimer = 0;
                }
                break;
        }
    }

    /**
     * Returns a frozen snapshot of the current state.
     * This is the authoritative UI contract.
     */
    getState(): ReplayState {
        const drivers: Record<string, DriverState> = {};

        // Find leader for relative gaps
        let leader: TelemetrySample | null = null;
        const sorted = Object.keys(this.telemetry)
            .map(id => this.interpolateDriver(id, this.currentTime))
            .sort((a, b) => (b.lap + b.progress) - (a.lap + a.progress));

        if (sorted.length > 0) leader = sorted[0];

        sorted.forEach((s, i) => {
            // Get interpolated position from Main Track
            let pos = positionFromProgress(this.mainTrack, s.progress);

            // Defensive: Ensure pitContext exists
            let pitCtx = this.driverPitStates[s.id];
            if (!pitCtx) {
                pitCtx = {
                    state: PitState.TRACK,
                    distance: 0,
                    blendFactor: 0,
                    stationaryTimer: 0
                };
                this.driverPitStates[s.id] = pitCtx;
            }

            // Override with Pit Logic
            if (pitCtx.state !== PitState.TRACK) {
                if (pitCtx.state === PitState.PIT_LANE) {
                    const prog = pitCtx.distance / this.pitTrack.totalLength;
                    pos = positionFromProgress(this.pitTrack, prog);
                }
                else if (pitCtx.state === PitState.ENTERING) {
                    const trackPos = positionFromProgress(this.mainTrack, this.config.pitEntryProgress);
                    const pitPos = positionFromProgress(this.pitTrack, 0);
                    pos = this.lerpPos(trackPos, pitPos, pitCtx.blendFactor);
                }
                else if (pitCtx.state === PitState.EXITING) {
                    const pitPos = positionFromProgress(this.pitTrack, 1);
                    const trackPos = positionFromProgress(this.mainTrack, this.config.pitExitProgress);
                    pos = this.lerpPos(pitPos, trackPos, pitCtx.blendFactor);
                }
            }

            // Guard against NaN
            if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
                console.warn(`[ReplayEngine] NaN position for ${s.id}, falling back.`);
                pos = { x: 0, y: 0 };
            }

            // Meta
            const meta = this.metadata[s.id] || { name: s.id, teamColor: '#CCCCCC' };
            const inPit = pitCtx.state !== PitState.TRACK;

            drivers[s.id] = {
                ...s,
                name: meta.name,
                teamColor: meta.teamColor,
                position: i + 1,
                gapToLeader: leader ? (leader.lap + leader.progress) - (s.lap + s.progress) : 0,
                x: pos.x,
                y: pos.y,
                inPit,
                pitContext: pitCtx
            };
        });

        return Object.freeze({
            currentTime: this.currentTime,
            playing: this.isPlaying,
            speed: this.speedMultiplier,
            currentLap: leader?.lap || 1,
            totalLaps: 57,
            drivers: Object.freeze(drivers),
            config: this.config
        });
    }

    private lerp(v0: number, v1: number, t: number): number {
        const val = v0 * (1 - t) + v1 * t;
        return Number.isFinite(val) ? val : v0;
    }

    private lerpPos(a: { x: number, y: number }, b: { x: number, y: number }, t: number) {
        const x = this.lerp(a.x, b.x, t);
        const y = this.lerp(a.y, b.y, t);
        return {
            x: Number.isFinite(x) ? x : a.x,
            y: Number.isFinite(y) ? y : a.y
        };
    }

    /**
     * Hardened interpolation with O(log N) binary search and bounds safety.
     * Guaranteed to return a valid TelemetrySample even with packet loss.
     */
    private interpolateDriver(id: string, t: number): TelemetrySample & { id: string } {
        const samples = this.telemetry[id];

        // Edge Case: No data for driver
        if (!samples || samples.length === 0) {
            return { id, t, lap: 1, progress: 0, speed: 0, throttle: 0, brake: 0, gear: 0, drs: false };
        }

        // Edge Case: Before first sample
        if (t <= samples[0].t) {
            return { ...samples[0], id, t };
        }

        // Edge Case: After last sample
        if (t >= samples[samples.length - 1].t) {
            return { ...samples[samples.length - 1], id, t };
        }

        // Optimized Binary Search for bounding samples
        let low = 0;
        let high = samples.length - 1;
        let i = 0;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (samples[mid].t <= t) {
                i = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        // Boundary safety
        if (i >= samples.length - 1) {
            return { ...samples[samples.length - 1], id, t };
        }

        const a = samples[i];
        const b = samples[i + 1];

        const deltaTime = b.t - a.t;
        const factor = deltaTime > 0 ? (t - a.t) / deltaTime : 0;

        return {
            id,
            t: t,
            lap: a.lap,
            progress: this.lerp(a.progress, b.progress, factor),
            speed: this.lerp(a.speed, b.speed, factor),
            throttle: this.lerp(a.throttle, b.throttle, factor),
            brake: this.lerp(a.brake, b.brake, factor),
            gear: Math.round(this.lerp(a.gear, b.gear, factor)),
            drs: factor > 0.5 ? b.drs : a.drs,
            isPitting: factor > 0.5 ? b.isPitting : a.isPitting
        };
    }

    getDuration() { return this.duration; }
}
