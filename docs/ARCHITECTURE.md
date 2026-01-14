# F1 Race Intelligence System - Architecture

## Core Principle

> **ML estimates relative pace. Simulation determines race outcomes. Strategy analysis powers team decisions.**

## Architecture Layers

```
┌────────────────────────┐
│   RAW RACE REALITY     │  ← FastF1 telemetry
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│  SIMULATION ENGINE     │  ← Physics / race logic
│  (no ML here)          │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│  ML PERFORMANCE MODEL  │  ← Relative pace only
│  (no winners)          │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│  PROBABILITY ENGINE    │
└───────────┬────────────┘
            ↓
┌────────────────────────┐
│   FRONTEND / ANALYSIS  │
└────────────────────────┘
```

## Data Flow

### 1. Data Layer
- **Jolpica**: Calendar, drivers, qualifying results, race results
- **FastF1**: Telemetry → aggregated features only (FP2 sessions)
- **Never**: Raw telemetry passed to ML

### 2. Feature Engineering
- Extract: `avg_long_run_pace_ms`, `tire_deg_rate`, `sector_consistency`, `clean_air_delta`
- Store in: `telemetry_features` table

### 3. ML Model
- **Target**: `pace_delta_ms = driver_avg_lap - session_mean_lap`
- **Model**: LightGBM regressor (L1 loss)
- **Output**: Pace deltas only (not winners/positions)
- **Training**: Rolling window (last 3-5 races), separate per regulation era

### 4. Simulation
- **Input**: Base lap time, pace delta (from ML), pit loss, variance, SC probability
- **Process**: Monte Carlo (5k-10k runs)
- **Output**: Win %, podium %, top-10 %

### 5. Probability Engine
- Combines simulation distributions with calibrated ML deltas
- Applies isotonic regression calibration (offline, after each race)
- Stores in: `outcome_probabilities` table

### 6. Frontend
- Consumes probabilities only
- Never calls ML directly
- Never computes odds manually

## Database Schema

- `drivers` - Driver metadata
- `races` - Race calendar (includes `regulation_era`)
- `qualifying_results` - Qualifying positions (from Jolpica)
- `telemetry_features` - Aggregated FastF1 features
- `model_runs` - ML model versioning/auditing
- `pace_deltas` - ML pace predictions
- `simulation_runs` - Simulation traceability
- `outcome_probabilities` - Final probabilities

## Security

- **Backend**: Uses `SUPABASE_SERVICE_KEY` for all DB operations
- **Frontend**: Never talks to Supabase directly
- **RLS**: Public read-only for `races`, `outcome_probabilities`

## Forbidden Patterns

- ML predicting winners/positions
- Raw telemetry in ML input
- Frontend calling ML endpoints
- Simulation using ML for outcomes
- Cross-regulation-era training

## Allowed Patterns

- ML predicting pace deltas only
- Aggregated telemetry features
- Frontend consuming probabilities
- Simulation using ML deltas as inputs
- Per-regulation-era models





