# F1-PREDICT Architecture

```mermaid
flowchart LR
    U[User Browser]
    FE[Frontend<br/>React + Vite]
    API[Backend API<br/>FastAPI]
    SIM[Simulation Engine<br/>v3.0.0-engineering]
    INTEL[Intelligence Service<br/>v3.0.1-inference]
    REPLAY[Replay API + Cache Resolver]
    REDIS[(Redis)]
    SB[(Supabase<br/>DB + race-telemetry bucket)]
    FF[FastF1/Jolpica Sources]
    SCRIPTS[Ingestion Scripts<br/>replay_ingestion.py<br/>generate_2025_data.py]

    U --> FE
    FE -->|/api/*| API

    API --> SIM
    API --> INTEL
    API --> REPLAY
    API --> REDIS
    API --> SB

    SCRIPTS --> FF
    SCRIPTS --> SB

    REPLAY -->|timeline + telemetry_urls| FE
    FE -->|distributed telemetry fetch| SB
```

## Runtime Notes

- Backend `/health` reports `version: 2.0.0` and `architecture: simulation-first`.
- Replay uses a shared-timeline telemetry contract per driver.
- In cloud deployments, replay data should be served from Supabase storage when local cache is unavailable.
