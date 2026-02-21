# Gold Dataset Spec v1

## Purpose
Gold Dataset v1 is the manually/auditable event-truth layer used for:
- rigorous calibration
- out-of-sample validation
- strategy replay studies
- institutional reporting

It must be deterministic, source-traceable, and immutable once frozen.

## Inclusion Rules
A race is **Gold-qualified** only if all conditions hold:
1. Full or explicitly accepted classified grid (default expectation: 20 drivers)
2. Classification validated against authoritative source(s)
3. SC/VSC periods sourced from track-status/race-control feeds (no lap-time inference)
4. Pit events sourced from structured timing feeds
5. DNF events sourced from official status/classification
6. No inferred labels presented as ground truth
7. Source provenance recorded in metadata
8. File checksums included in dataset manifest

If one rule fails, the race remains non-gold (or `PARTIAL`) and must be flagged.

## Directory Layout
```
backend/data/gold/v1/
  {season}_{round}_{race_slug}/
    classification.json
    pit_events.json
    sc_periods.json
    dnf_events.json
    lap_count.json
    metadata.json
  gold_manifest.json
```

## File Contracts

### `classification.json`
Array of:
```json
{
  "driver": "VER",
  "position": 1,
  "status": "Finished",
  "laps_completed": 57,
  "total_time": "1:31:44.742"
}
```

### `pit_events.json`
Array of:
```json
{
  "driver": "VER",
  "lap": 18,
  "stop": 1,
  "duration_ms": 2400
}
```

### `sc_periods.json`
Array of:
```json
{
  "type": "SC",
  "start_lap": 12,
  "end_lap": 16
}
```
Allowed `type`: `SC`, `VSC`.

### `dnf_events.json`
Array of:
```json
{
  "driver": "LEC",
  "lap": 42,
  "status": "Engine"
}
```

### `lap_count.json`
```json
{ "total_laps": 57 }
```

### `metadata.json`
```json
{
  "season": 2025,
  "round": 7,
  "race_id": "2025_7_bahrain",
  "validated": false,
  "validation_status": "UNREVIEWED",
  "sources": {
    "classification": "ergast",
    "pit_events": "ergast",
    "sc_periods": "fastf1.track_status",
    "dnf_events": "ergast"
  },
  "notes": []
}
```

## Immutability
- `v1` is immutable after freeze.
- Any content change requires a new version (`v2`, ...).
- `gold_manifest.json` stores file checksums for every race artifact.

## No-Inference Rule
- SC/VSC must not be inferred from lap-time anomalies.
- DNF/pit labels must come from explicit status/timing fields.
- Unknown values must remain `null` or be excluded with a note.
