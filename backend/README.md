# F1 Prediction Platform - Backend

## Architecture

**Simulation-first, ML-assisted architecture**

- **ML predicts only relative pace deltas** (not winners/positions)
- **Simulation determines race outcomes** via Monte Carlo
- **Probabilities power fantasy markets** (not direct predictions)
- **Jolpica provides structured data**, **FastF1 provides telemetry features**

## Project Structure

```
backend/
├── api/              # API endpoints
├── data/             # Data layer (Jolpica, FastF1, weather)
├── features/         # Feature engineering
├── models/           # ML models (pace deltas only)
├── simulation/       # Race simulator and Monte Carlo
├── services/         # Probability engine, market engine, fantasy
├── database/         # Supabase client and migrations
└── main.py          # FastAPI application
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Run database migrations:
```bash
# Apply migrations in database/migrations/ to your Supabase instance
```

4. Run the server:
```bash
uvicorn main:app --reload
```

## API Endpoints

- `GET /api/races/{race_id}/probabilities` - Get outcome probabilities
- `GET /api/races/{race_id}/markets` - Get fantasy markets
- `GET /api/races/{race_id}/pace-deltas` - Get ML pace deltas (debugging)
- `GET /api/drivers/{driver_id}/telemetry-summary` - Get aggregated telemetry
- `GET /api/live/{race_id}` - SSE live updates

## Key Principles

1. **ML only predicts pace deltas** - never winners or positions
2. **Simulation determines outcomes** - pure physics/stochastic
3. **Probabilities are calibrated** - offline process after each race
4. **Frontend consumes probabilities only** - no direct ML calls





