import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
}

function read(relPath) {
  const p = path.join(root, relPath);
  return fs.readFileSync(p, 'utf8');
}

function run(cmd, args) {
  return spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
}

function runShell(command) {
  return spawnSync(command, { cwd: root, encoding: 'utf8', shell: true });
}

try {
  const mainPy = read('backend/main.py');
  check(
    'Backend routers include intelligence/baseline/live',
    mainPy.includes('app.include_router(baseline.router)') &&
      mainPy.includes('app.include_router(intelligence.router)') &&
      mainPy.includes('app.include_router(live.router)')
  );

  const racesPy = read('backend/api/races.py');
  check(
    'Replay local telemetry endpoint exists',
    racesPy.includes('@router.get("/{race_id}/telemetry/{driver_code}")')
  );
  check(
    'Replay timeline maps local telemetry URLs',
    racesPy.includes('/api/races/{race_id}/telemetry/{driver_code}')
  );

  const replayDir = path.join(root, 'backend/data/replay_cache');
  const replayFiles = fs
    .readdirSync(replayDir)
    .filter((f) => /^\d+_2025_[A-Z0-9]+\.json$/.test(f));

  check('Replay cache files found for 2025', replayFiles.length > 0, `files=${replayFiles.length}`);

  const raceToDrivers = new Map();
  for (const file of replayFiles) {
    const m = file.match(/^(\d+_2025)_([A-Z0-9]+)\.json$/);
    if (!m) continue;
    const raceKey = m[1];
    const list = raceToDrivers.get(raceKey) || [];
    list.push({ file, driver: m[2] });
    raceToDrivers.set(raceKey, list);
  }

  let bestRace = null;
  for (const [race, drivers] of raceToDrivers.entries()) {
    if (!bestRace || drivers.length > bestRace.drivers.length) {
      bestRace = { race, drivers };
    }
  }

  if (bestRace) {
    check(
      'Replay race has near-full grid coverage',
      bestRace.drivers.length >= 18,
      `${bestRace.race} drivers=${bestRace.drivers.length}`
    );
    const samplePath = path.join(replayDir, bestRace.drivers[0].file);
    const payload = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    const lapKeys = Object.keys(payload).filter((k) => /^\d+$/.test(k));
    const hasMultiLap = lapKeys.length > 3;
    const hasFrames = lapKeys.some((k) => Array.isArray(payload[k]) && payload[k].length > 0);
    check('Replay file is lap-keyed with multi-lap frames', hasMultiLap && hasFrames, `laps=${lapKeys.length}`);
  } else {
    check('Replay race has near-full grid coverage', false, 'No grouped races found');
    check('Replay file is lap-keyed with multi-lap frames', false, 'No grouped races found');
  }

  const raceStore = read('Frontend/src/stores/raceStore.ts');
  check(
    'Simulation store uses season-aware full-driver selection',
    raceStore.includes('SEASON_2025_DRIVER_IDS') &&
      raceStore.includes('function getDriversForSeason') &&
      raceStore.includes('drivers = getDriversForSeason(season)')
  );

  const intelligencePage = read('Frontend/src/pages/IntelligencePage.tsx');
  check(
    'Intelligence uses live backend hook',
    intelligencePage.includes('useIntelligence(')
  );
  check(
    'Intelligence baseline maps full 2025 grid',
    intelligencePage.includes('const SEASON_2025_DRIVER_IDS = Object.keys(DRIVER_INFO)') &&
      intelligencePage.includes('baselineOrderEnvelope')
  );
  check(
    'Intelligence podium maps full 2025 grid',
    intelligencePage.includes('podiumProbabilityEnvelope') &&
      intelligencePage.includes('SEASON_2025_DRIVER_IDS.map((driverId)')
  );

  const tsc = runShell('npm --prefix Frontend exec tsc -- --noEmit -p Frontend/tsconfig.app.json');
  const tscDetail = tsc.status === 0
    ? 'ok'
    : (tsc.stderr || tsc.stdout || tsc.error?.message || `status=${String(tsc.status)} signal=${String(tsc.signal)}`);
  check('Frontend TypeScript compile', tsc.status === 0, tscDetail);
} catch (err) {
  check('Smoke check runtime', false, err instanceof Error ? err.message : String(err));
}

const failed = results.filter((r) => !r.ok);
for (const r of results) {
  const marker = r.ok ? '[PASS]' : '[FAIL]';
  const suffix = r.detail ? ` :: ${r.detail}` : '';
  console.log(`${marker} ${r.name}${suffix}`);
}

if (failed.length > 0) {
  console.error(`\nSmoke check failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nSmoke check passed: ${results.length} check(s).`);
