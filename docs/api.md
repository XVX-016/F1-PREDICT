# API Overview

Base URL examples:

- Local: `http://localhost:8000`
- Production: your deployed backend URL

## Core Endpoints

### Health

- `GET /health`

### Races / Replay

- `GET /api/races/`
- `GET /api/races/replay/available`
- `GET /api/races/{race_id}/timeline`
- `GET /api/races/{race_id}/telemetry/{driver_code}`

### Simulation

- `POST /api/races/{race_id}/simulate`
- `POST /api/races/{race_id}/simulate-rigorous`

### Intelligence

- `GET /api/intelligence?race_id={id}&drivers=VER,NOR,...`

### Status / Live

- `GET /api/race-status`
- WebSocket/SSE routes under `api.live`, `api.ws_race`, and `api.live_telemetry`

## Replay Contract Summary

- Timeline endpoint should return `meta` and either:
  - inline `telemetry`, or
  - `telemetry_urls` for distributed per-driver payloads.

- Frontend replay is considered valid only when at least one telemetry source is non-empty.
