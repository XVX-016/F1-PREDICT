import fs from 'fs';
import * as THREE from 'three';
import mainTrack from '../data/bahrain_dense.json';

// --- Configuration ---
const TRACK_ID = 'bahrain_pit';
const TARGET_LENGTH = 420; // Meters (approx standard F1 pit lane)
const DENSE_POINTS_COUNT = 200; // Sufficient for 420m
const OUTPUT_PATH = 'src/data/bahrain_pit_dense.json';

// We need to construct the pit lane relative to the main track.
// In a real scenario, we'd use OSM coordinates.
// Here, we'll derive it by offsetting the main track points between Entry and Exit.
// Bahrain Pit Lane is inside the main straight (right side if clockwise? No, usually right side).
// Wait, Bahrain main straight is start/finish. Pit is to the RIGHT of the track (Standard).
// Coordinates in bahrain_dense are [x, z] (mapped to [x, y] in 2D).

// Let's create a synthetic set of points that represents the pit lane.
// Assumes main track is roughly aligned.
// We'll define start and end based on main track indices, then create an offset curve.

// Pit Entry ~0.962 (from config) -> Pit Exit ~0.083
// We'll grab points from main track, offset them, and smooth.
// Note: This is a robust approximation in lieu of raw OSM data.

function generate() {
    console.log(`🏁 Starting PIT spline generation for: ${TRACK_ID}`);

    const mainPoints = mainTrack.points;
    const totalLength = mainTrack.totalLength;

    // 1. Identify Main Track Segment
    // The pit lane covers the Start/Finish line, so it wraps around the array end/start.
    // Entry ~5200m -> Exit ~450m

    // We'll construct raw points manually to guarantee geometry + length control.
    // Main straight in our data seems to be roughly y=0 to y=something or x=something.
    // Let's rely on a predefined set of points that "looks" like the Bahrain pit lane 
    // in the coordinate system of the generated dense spline.
    // Since we don't visualize the dense spline coordinates easily here, 
    // we'll create a generic "straight" pit lane and then map it? 
    // NO, that risks teleporting artifacts.

    // BETTER APPROACH: 
    // Use the normalized points from Phase 1 (BAHRAIN_PIT_POINTS) 
    // and scale them using the same bounding box or scale factor as the main track.
    // Phase 1 RAW_POINTS bounding box: max X ~ 5412, max Y ~ 1250?
    // Not exactly. 
    // Let's reverse-engineer the scale. The generic points were [0,0] to [5412,0] roughly.
    // So the scale is roughly 1 unit = 1 meter.

    // Let's define the pit lane points directly in meters, 
    // assuming the main straight aligns with X-axis roughly near (0,0) and (TotalLength, 0).
    // Bahrain track shape in our `generateBahrainSpline` was a loop.
    // The "Start/Finish" was at [0,0] and [5412,0].
    // So the main straight is along y=0.
    // Pit lane should be offset in Y (e.g. y = -20 or +20) and run parallel.
    // Pit Entry: x ~ 5200, y=0 -> x=5412 -> x=400 approx.
    // We need to bridge the gap.

    const RAW_PIT_POINTS: [number, number][] = [
        [5150, 20],  // Entry Diverge
        [5250, 40],  // Limit Line
        [5412, 40],  // Crosses Start line (wrapped)
        [0, 40],     // Wrapped X (will adjust)
        [200, 40],   // Pit Box area
        [350, 40],   // Limit End
        [450, 20]    // Rejoin
    ];

    // Adjust for wrapping X coordinate logic
    // Since our main spline is a loop [0,0] -> ... -> [5412,0],
    // Points "past" 5412 should conceptually wrap or just exist in this space.
    // However, THREE.CatmullRom expects continuous vectors.
    // We should treat x=0 as x=5412 for the middle points.
    // Let's shift the wrapped points to be continuous for spline generation.
    // [0, 40] becomes [5412, 40], [200, 40] becomes [5612, 40], etc.

    const CONTINUOUS_POINTS: [number, number][] = [
        [5150, 20],
        [5200, 35],
        [5250, 40], // Start of pit lane proper
        [5412, 40],
        [5612, 40], // e.g. x=200 equivalent
        [5762, 40], // e.g. x=350 equivalent
        [5812, 35],
        [5862, 20]  // Rejoin at x=450 equivalent
    ];

    // 2. Spline Generation
    const curvePoints = CONTINUOUS_POINTS.map(p => new THREE.Vector3(p[0], 0, p[1]));
    const spline = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal'); // Open curve

    // 3. Resample
    const densePoints: [number, number][] = [];
    const cumulativeDistances: number[] = [];
    let currentLength = 0;

    for (let i = 0; i <= DENSE_POINTS_COUNT; i++) {
        const t = i / DENSE_POINTS_COUNT;
        const pos = spline.getPointAt(t);

        // Wrap X back to track coordinates if > 5412
        // If x > 5412, it effectively wraps to x - 5412?
        // Actually, our engine tracks strict X/Y. If the track wraps, the renderer handles it?
        // No, the main track points loop back to 0. 
        // We should explicitly wrap the coordinates for the JSON output 
        // if we want them to render "near" the start of the line.
        // BUT, visually, having them > 5412 might break rendering if the map expects bounding box.
        // Let's modulo the X for the output points.

        let finalX = pos.x;
        // Simple modulo won't work perfectly for lines drawing, but for points it's fine.
        // For ReplayEngine, raw coordinates matter.
        // If the main track jumps from 5412 to 0, having pit points at 5600 might be weird visually?
        // No, if the main track is continuous 0->5412, then 5600 is just further right.
        // Wait, the main track is a LOOP. 5412 connects to 0.
        // Visualizing: 
        // 5100 -> 5200 -> ... -> 5412 (Start) -> 0 -> 100 ...
        // Our PIT points: 5150 ... 5862.
        // If we render this, 5862 will be way off to the right of the map?
        // YES. We need to wrap coordinates to match the main track's visual space.
        // If index i has x > 5412, we subtract 5412.

        if (finalX >= 5412) finalX -= 5412;

        densePoints.push([Number(finalX.toFixed(3)), Number(pos.z.toFixed(3))]);

        if (i > 0) {
            const prev = densePoints[i - 1];
            // Caution: If we wrapped, hypot calculation needs to account for wrap or use continuous dist?
            // currentLength should use the SPLINE distance (continuous), not the wrapped point distance.
            // We can ask the spline for length.
            // Or use the continuous position for distance calc.
        }
    }

    // Recalculate length from continuous spline to be accurate
    const rawLength = spline.getLength();

    // 4. Scale to Target Length (420m)
    // The approximate points above span ~700m (5862 - 5150).
    // We want exactly ~420m.
    // Let's trust the points' SHAPE but scale the distance?
    // No, shrinking 700m to 420m will squash it.
    // Let's adjust the input points to be closer to 420m span.
    // 5150 to 5570 approx.

    const SHORT_CONTINUOUS_POINTS: [number, number][] = [
        [5180, 20],
        [5210, 35],
        [5250, 40],
        [5412, 40],
        [5500, 40],
        [5550, 35],
        [5580, 20]
    ];
    // Span: 5580 - 5180 = 400m. This is closer.

    // Re-generate spline
    const curvePoints2 = SHORT_CONTINUOUS_POINTS.map(p => new THREE.Vector3(p[0], 0, p[1]));
    const spline2 = new THREE.CatmullRomCurve3(curvePoints2, false, 'centripetal');

    const finalLength = spline2.getLength();
    console.log(`📏 Computed Pit Length: ${finalLength.toFixed(2)}m (Target: ${TARGET_LENGTH}m)`);

    // Generate final dense points with wrapping
    const finalPoints: [number, number][] = [];
    const finalDistances: number[] = [];
    let accLength = 0;

    for (let i = 0; i <= DENSE_POINTS_COUNT; i++) {
        const t = i / DENSE_POINTS_COUNT;
        const pos = spline2.getPointAt(t); // Continuous position

        let wrappedX = pos.x;
        // Determine if we should wrap. 
        // The track logic wraps at 5412.
        if (wrappedX > 5412) wrappedX -= 5412;

        finalPoints.push([Number(wrappedX.toFixed(3)), Number(pos.z.toFixed(3))]);

        if (i > 0) {
            // Use continuous spline distance for LUT
            // We can approximate or use getLength * t
            // CatmullRom is not perfectly arc-length parameterized by 't' by default?
            // Actually, getPointAt() (not getPoint) uses arc-length cache in Three.js if constructed right.
            // But safer to verify.
        }

        // Exact distance along spline
        // Since getPointAt is normalized 0..1 along arc length in Three.js (usually),
        // we can just use t * totalLength.
        finalDistances.push(Number((t * finalLength).toFixed(3)));
    }

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
