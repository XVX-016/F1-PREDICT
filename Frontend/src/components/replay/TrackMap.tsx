import { useMemo } from 'react';
import { DriverState } from '../../utils/ReplayEngine';
import { DRIVER_INFO } from '../../utils/ReplayDataHelper';

interface TrackMapProps {
    drivers: DriverState[];
    loading?: boolean;
    circuitImage?: string;
    circuitLabel?: string;
    trackPath?: Array<{ x: number; y: number }>;
}

type MapTransform = {
    rotateDeg: number;
    scaleX: number;
    scaleY: number;
    translateX: number;
    translateY: number;
    flipX?: boolean;
    flipY?: boolean;
};

const DEFAULT_TRANSFORM: MapTransform = {
    rotateDeg: 0,
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0
};

const TRACK_TRANSFORMS: Record<string, MapTransform> = {
    // Tuned to align normalized telemetry with image orientation.
    aus: { rotateDeg: -92, scaleX: 0.92, scaleY: 0.92, translateX: 0.02, translateY: 0.03 },
    bhr: { rotateDeg: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
    jap: { rotateDeg: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
    chn: { rotateDeg: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
    mco: { rotateDeg: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
    gbr: { rotateDeg: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
    silverstone: { rotateDeg: 0, scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 }
};

const extractTrackKey = (circuitImage?: string): string => {
    if (!circuitImage) return 'default';
    const lower = circuitImage.toLowerCase();
    const m = lower.match(/f1_2024_([a-z0-9]+)_outline\.png/);
    if (m?.[1]) return m[1];
    if (lower.includes('silverstone')) return 'silverstone';
    return 'default';
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const applyTransformRaw = (x: number, y: number, tf: MapTransform) => {
    let dx = x - 0.5;
    let dy = y - 0.5;

    if (tf.flipX) dx = -dx;
    if (tf.flipY) dy = -dy;

    dx *= tf.scaleX;
    dy *= tf.scaleY;

    const r = (tf.rotateDeg * Math.PI) / 180;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    return { x: rx + 0.5 + tf.translateX, y: ry + 0.5 + tf.translateY };
};

const applyTransform = (x: number, y: number, tf: MapTransform) => {
    const mapped = applyTransformRaw(x, y, tf);
    return {
        x: clamp01(mapped.x),
        y: clamp01(mapped.y)
    };
};

const computeAutoRotateDeg = (points: Array<{ x: number; y: number }>) => {
    if (points.length < 3) return 0;
    const valid = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (valid.length < 3) return 0;
    let meanX = 0;
    let meanY = 0;
    for (const p of valid) {
        meanX += p.x;
        meanY += p.y;
    }
    meanX /= valid.length;
    meanY /= valid.length;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const p of valid) {
        const dx = p.x - meanX;
        const dy = p.y - meanY;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
    }
    if (sxx === 0 && syy === 0) return 0;
    const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    return (-angle * 180) / Math.PI;
};

const computeFitTransform = (
    points: Array<{ x: number; y: number }>,
    base: MapTransform,
    padding = 0.04
) => {
    if (!points.length) return base;
    const mapped = points.map((p) => applyTransformRaw(p.x, p.y, base));
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of mapped) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return base;
    const width = Math.max(1e-6, maxX - minX);
    const height = Math.max(1e-6, maxY - minY);
    const target = 1 - padding * 2;
    const scale = Math.min(target / width, target / height);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const translateX = 0.5 - cx * scale;
    const translateY = 0.5 - cy * scale;
    return {
        ...base,
        scaleX: base.scaleX * scale,
        scaleY: base.scaleY * scale,
        translateX: base.translateX + translateX,
        translateY: base.translateY + translateY
    };
};

export const TrackMap = ({ drivers, loading, circuitImage, circuitLabel, trackPath }: TrackMapProps) => {
    const trackKey = extractTrackKey(circuitImage);
    const baseTransform = TRACK_TRANSFORMS[trackKey] || DEFAULT_TRANSFORM;
    const autoRotateDeg = computeAutoRotateDeg(trackPath ?? []);
    const autoTransform = {
        ...baseTransform,
        rotateDeg: baseTransform.rotateDeg + autoRotateDeg
    };
    const transform = computeFitTransform(trackPath ?? [], autoTransform);

    const normalizedDrivers = useMemo(() => {
        return drivers.map((d) => {
            const x = Number(d.x);
            const y = Number(d.y);
            if (Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                const mapped = applyTransform(x, y, transform);
                return { ...d, mapX: mapped.x, mapY: mapped.y };
            }

            const p = Number.isFinite(d.progress) ? ((d.progress % 1) + 1) % 1 : 0;
            const angle = (p * Math.PI * 2) - Math.PI / 2;
            const fallback = {
                ...d,
                mapX: 0.5 + Math.cos(angle) * 0.32,
                mapY: 0.5 + Math.sin(angle) * 0.24
            };
            const mapped = applyTransform(fallback.mapX, fallback.mapY, transform);
            return { ...fallback, mapX: mapped.x, mapY: mapped.y };
        });
    }, [drivers, transform]);

    if (drivers.length === 0 && !loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 rounded-xl border border-white/5 relative">
                {circuitImage && (
                    <img
                        src={circuitImage}
                        alt={circuitLabel || 'Circuit outline'}
                        className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none"
                    />
                )}

                <div className="text-center z-10">
                    <div className="text-[10px] font-mono font-black text-[#E10600] uppercase tracking-[0.4em] mb-2 animate-pulse">
                        Awaiting Telemetry Stream
                    </div>
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
                        Circuit: {circuitLabel || 'Unknown'} | Live Replay Feed
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black/40 rounded-xl overflow-hidden border border-white/5 group">
            {circuitImage && (
                <img
                    src={circuitImage}
                    alt={circuitLabel || 'Circuit outline'}
                    className="absolute inset-0 w-full h-full object-contain opacity-20 pointer-events-none"
                />
            )}

            {/* Top-left label removed per design */}

            <svg
                viewBox="0 0 1000 1000"
                className="w-full h-full opacity-90 transition-opacity"
                preserveAspectRatio="xMidYMid meet"
            >
                {trackPath && trackPath.length > 1 && (
                    <polyline
                        fill="none"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={2}
                        points={trackPath
                            .map((p) => {
                                const mapped = applyTransform(p.x, p.y, transform);
                                return `${mapped.x * 1000},${mapped.y * 1000}`;
                            })
                            .join(' ')}
                    />
                )}
                {normalizedDrivers.map((d) => (
                    <g
                        key={d.id}
                        transform={`translate(${d.mapX * 1000}, ${d.mapY * 1000})`}
                        className={`transition-transform duration-100 ease-linear ${d.inPit ? 'opacity-60 scale-75' : 'opacity-100'}`}
                    >
                        <circle
                            r={d.inPit ? 8 : 10}
                            fill={d.teamColor || DRIVER_INFO[d.id]?.color || '#FFFFFF'}
                            className={`${!d.inPit ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`}
                        />
                        <text
                            y={-14}
                            textAnchor="middle"
                            fill="white"
                            fontSize={9}
                            fontFamily="monospace"
                            fontWeight="bold"
                            className={`uppercase tracking-tighter ${d.inPit ? 'fill-white/40' : ''}`}
                        >
                            {d.id}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};
