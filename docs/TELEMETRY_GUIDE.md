# Telemetry and Replay Guide

This guide explains how to generate F1 race telemetry data, upload it to Supabase, and visualize it using the Replay page.

## 1. Generating Telemetry

Telemetry data is ingested from FastF1 and stored in a local cache or Redis.

### Using the Ingestion Script
Run the `fastf1_to_redis.py` script to fetch data for a specific race.

```powershell
python backend/scripts/fastf1_to_redis.py --year 2025 --race 4
```

- `--year`: The season year (e.g., 2025).
- `--race`: The race round number or name.
- `--session`: Defaults to 'R' (Race).

This script will generate JSON files in `backend/data/replay_cache/` if configured to save to files, or store frames in Redis.

## 2. Uploading to Supabase

To use the cloud-hosted Replay page, you must upload the generated telemetry to Supabase Storage.

> [!IMPORTANT]
> To stay within the **1GB storage limit**, the upload script is restricted to a **whitelist** of races (currently Bahrain).

### Run the Upload Script

```powershell
python backend/scripts/upload_assets_to_supabase.py
```

The script will:
1. Ensure the `race-telemetry` bucket exists.
2. Filter files in `backend/data/replay_cache/` against the `ALLOWED_REPLAY_RACES` whitelist.
3. Upload new JSON files to Supabase.
4. Sync public assets from the Frontend.

## 3. Visualizing in Replay Page

1. Navigate to the **Replay** page in the application.
2. Use the **Select Event** dropdown to choose an available race.
3. Click the **Play** button to start the telemetry playback.
4. Scale the playback speed (1x, 2x, 5x, 10x) using the controls at the bottom right.
5. Scrub through the timeline using the slider.

---

## Technical Details

- **Storage Bucket**: `race-telemetry`
- **File Format**: `[Prefix]_[DriverID].json` (e.g., `4_2025_VER.json`)
- **Frontend Filter**: `ReplayPage.tsx` uses `REPLAY_WHITELIST` to match the backend upload restrictions.
