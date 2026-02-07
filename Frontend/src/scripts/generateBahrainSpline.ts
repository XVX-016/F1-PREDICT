import fs from 'fs';
import * as THREE from 'three';

// --- Configuration ---
const TRACK_ID = 'bahrain';
const TARGET_LENGTH = 5412;
const DENSE_POINTS_COUNT = 1000; // Final LUT resolution
const OUTPUT_PATH = 'src/data/bahrain_dense.json';

// --- Input: Raw Points (Sampled from User Request) ---
const RAW_POINTS: [number, number][] = [
    [0, 0], [120, 5], [310, 12], [520, 40], [690, 120], [720, 260], [650, 380],
    [520, 470], [400, 520], [260, 560], [140, 620], [80, 760], [120, 920],
    [280, 1040], [520, 1080], [780, 1120], [1050, 1200], [1420, 1250],
    [1780, 1220], [2120, 1120], [2380, 980], [2620, 820], [2890, 640],
    [3200, 500], [3550, 420], [3920, 380], [4300, 360], [4700, 300],
    [5100, 120], [5412, 0]
];

/**
 * Ensures points are ordered clockwise using the shoelace area formula.
 */
function ensureClockwise(points: [number, number][]): [number, number][] {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        area += (p2[0] - p1[0]) * (p2[1] + p1[1]);
    }
    if (area > 0) {
        console.log('🔄 Reversing points for clockwise orientation...');
        return [...points].reverse();
    }
    return points;
}

/**
 * Core Generation Pipeline
 */
function generate() {
    console.log(`🏁 Starting spline generation for: ${TRACK_ID}`);

    let points = ensureClockwise(RAW_POINTS);

    // 1. Convert to THREE.Vector3 for smoothing
    const curvePoints = points.map(p => new THREE.Vector3(p[0], 0, p[1]));

    // 2. Build Catmull-Rom Spline
    // 'centripetal' avoids shrinking/overshooting at sharp turns
    const spline = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal');

    // 3. Resample to dense points based on progress
    const densePoints: [number, number][] = [];
    const cumulativeDistances: number[] = [];
    let currentLength = 0;

    for (let i = 0; i <= DENSE_POINTS_COUNT; i++) {
        const t = i / DENSE_POINTS_COUNT;
        const pos = spline.getPointAt(t);

        densePoints.push([Number(pos.x.toFixed(3)), Number(pos.z.toFixed(3))]);

        if (i > 0) {
            const prev = densePoints[i - 1];
            const dist = Math.hypot(pos.x - prev[0], pos.z - prev[1]);
            currentLength += dist;
        }
        cumulativeDistances.push(Number(currentLength.toFixed(3)));
    }

    // Closure check
    const first = densePoints[0];
    const last = densePoints[densePoints.length - 1];
    const closureError = Math.hypot(first[0] - last[0], first[1] - last[1]);

    if (closureError > 0.01) {
        throw new Error(`❌ Spline is not properly closed! Error: ${closureError.toFixed(4)}m`);
    }

    // 4. Scaling Pass to match TARGET_LENGTH precisely
    const scaleFactor = TARGET_LENGTH / currentLength;
    console.log(`📏 Scaling spline by factor: ${scaleFactor.toFixed(4)}`);

    const finalPoints: [number, number][] = [];
    const finalDistances: number[] = [];
    let finalLength = 0;

    densePoints.forEach((p, i) => {
        const scaledP: [number, number] = [Number((p[0] * scaleFactor).toFixed(3)), Number((p[1] * scaleFactor).toFixed(3))];
        finalPoints.push(scaledP);

        if (i > 0) {
            const prev = finalPoints[i - 1];
            finalLength += Math.hypot(scaledP[0] - prev[0], scaledP[1] - prev[1]);
        }
        finalDistances.push(Number(finalLength.toFixed(3)));
    });

    // Final Validation
    console.log(`✅ Final length: ${finalLength.toFixed(2)}m`);

    // Persist to JSON
    const output = {
        trackId: TRACK_ID,
        totalLength: Number(finalLength.toFixed(3)),
        points: finalPoints,
        cumulativeDistances: finalDistances
    };

    if (!fs.existsSync('src/data')) {
        fs.mkdirSync('src/data', { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`🚀 Saved to: ${OUTPUT_PATH}`);
}

generate();
