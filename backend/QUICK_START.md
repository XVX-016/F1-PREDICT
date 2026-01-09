# Quick Start Guide

## Prerequisites

- Python 3.9+
- Supabase account and project
- (Optional) Jolpica API key
- (Optional) FastF1 cache directory

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
FASTF1_CACHE_DIR=cache
JOLPICA_API_KEY=your_key_here  # Optional
```

### 3. Set Up Database

1. Go to your Supabase project SQL editor
2. Run the migration: `database/migrations/001_initial_schema.sql`
3. Configure RLS policies:
   - Public read-only: `races`, `outcome_probabilities`
   - Private: All other tables

### 4. Run the Server

```bash
# Option 1: Use refactored main
uvicorn main_refactored:app --reload

# Option 2: Update existing main.py to include new routers
# Then: uvicorn main:app --reload
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Get probabilities (requires race_id in database)
curl http://localhost:8000/api/races/{race_id}/probabilities

# Get markets
curl http://localhost:8000/api/races/{race_id}/markets
```

### 6. Run Examples

```bash
python example_usage.py
```

## Architecture Overview

```
Data Sources → Features → ML (Pace Deltas) → Simulation → Probabilities → Frontend
```

- **Jolpica**: Structured data (calendar, results)
- **FastF1**: Telemetry → aggregated features
- **ML Model**: Predicts pace deltas only (not winners)
- **Simulation**: Monte Carlo determines outcomes
- **Probabilities**: Frontend consumes these only

## Key Endpoints

- `GET /api/races/{race_id}/probabilities` - Outcome probabilities
- `GET /api/races/{race_id}/markets` - Fantasy markets with odds
- `GET /api/races/{race_id}/pace-deltas` - ML pace predictions (debug)
- `GET /api/drivers/{driver_id}/telemetry-summary` - Aggregated telemetry
- `GET /api/live/{race_id}` - SSE live updates

## Next Steps

1. **Train ML Model**: Collect pace delta data and train `pace_model.py`
2. **Populate Database**: Add races, drivers, qualifying results
3. **Generate Probabilities**: Use `probability_engine.generate_probabilities()`
4. **Update Frontend**: Follow migration guide to use new endpoints

## Troubleshooting

### Import Errors
- Ensure you're running from `backend/` directory
- Check that all `__init__.py` files exist
- Verify Python path includes `backend/`

### Database Errors
- Verify Supabase credentials in `.env`
- Check that schema migration was applied
- Ensure RLS policies are configured

### FastF1 Errors
- Check cache directory exists and is writable
- Verify internet connection for data download
- FP2 sessions may not be available for all races

## Support

See documentation:
- `README.md` - Overview
- `ARCHITECTURE.md` - Architecture details
- `VALIDATION_CHECKLIST.md` - Testing guide
- `REFACTOR_SUMMARY.md` - Complete refactor summary





