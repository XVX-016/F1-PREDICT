# F1 Prediction Platform - Setup Guide

This guide walks you through setting up the F1 Prediction Platform from scratch.

## Prerequisites

- Python 3.11+
- Docker and Docker Compose (optional, for containerized setup)
- Supabase account and project
- Jolpica API key
- Make (optional, for using Makefile commands)

## Quick Start

### Option 1: Using Makefile (Recommended)

```bash
# Install dependencies
make install

# Run full automated setup
make setup

# Start development server
make dev
```

### Option 2: Using Docker Compose

```bash
# Build and start containers (runs setup automatically)
docker-compose up --build

# Or use Makefile
make docker-build
make docker-up
```

### Option 3: Manual Setup

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Run setup
python setup.py

# 4. Start server
uvicorn main:app --reload
```

## Detailed Setup Steps

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
FASTF1_CACHE_DIR=./cache
JOLPICA_API_KEY=your-jolpica-key
```

### 2. Database Setup (Supabase)

Run the database migrations on your Supabase instance:

```bash
# Using psql
psql <supabase-connection-string> -f backend/database/migrations/001_initial_schema.sql

# Or use Supabase dashboard SQL editor
# Copy and paste the contents of 001_initial_schema.sql
```

Ensure the following tables exist:
- `races`
- `drivers`
- `race_probabilities`
- `telemetry_features`
- `pace_deltas`
- `model_runs`
- `simulation_runs`

### 3. Run Automated Setup

The setup script will:
1. ✅ Check environment variables
2. ✅ Fetch Jolpica structured data (calendar, drivers)
3. ✅ Extract FastF1 telemetry features (FP2/FP3)
4. ✅ Train ML pace-delta model
5. ✅ Run Monte Carlo simulations
6. ✅ Setup probability calibration

```bash
python backend/setup.py
```

### 4. Verify Setup

Check that everything is working:

```bash
# Health check
curl http://localhost:8000/health

# Get probabilities for a race
curl http://localhost:8000/api/races/{race_id}/probabilities

# Get markets
curl http://localhost:8000/api/races/{race_id}/markets
```

## Testing

Run the test suite:

```bash
# All tests
make test

# Unit tests only
make test-unit

# Integration tests
make test-integration

# Validation tests
make test-validation
```

## Development

Start the development server with auto-reload:

```bash
make dev
# or
cd backend && uvicorn main:app --reload
```

## Docker Deployment

### Build Image

```bash
make docker-build
```

### Start Containers

```bash
make docker-up
```

The Docker setup automatically runs `setup.py` on first start.

### View Logs

```bash
make docker-logs
```

### Stop Containers

```bash
make docker-down
```

## Troubleshooting

### Missing Environment Variables

If setup fails with missing environment variables:

```bash
make env-check
```

This will show which variables are missing.

### Database Connection Issues

1. Verify Supabase URL and service key in `.env`
2. Check that migrations have been run
3. Verify RLS policies are set correctly

### FastF1 Cache Issues

If telemetry extraction fails:

1. Check `FASTF1_CACHE_DIR` is writable
2. Clear cache: `make clean`
3. Re-run setup

### ML Model Training Fails

If model training fails:

1. Check that you have sufficient historical data
2. Verify telemetry features were extracted successfully
3. Model training can be skipped and run later

## Next Steps

After setup is complete:

1. ✅ Verify all endpoints are working
2. ✅ Update frontend to use new API endpoints
3. ✅ Deploy to production (Railway/Render for backend, Vercel for frontend)
4. ✅ Monitor logs and performance

## Architecture Compliance

The setup ensures:

- ✅ ML models predict **only pace deltas** (not winners/positions)
- ✅ Simulation determines outcomes via Monte Carlo
- ✅ Probabilities are generated from simulation results
- ✅ Calibration is applied offline (not live)
- ✅ All data flows through Supabase
- ✅ Frontend consumes probabilities only (no direct ML calls)

## Support

For issues or questions, check:
- `backend/ARCHITECTURE.md` - Architecture overview
- `backend/API.md` - API documentation
- `backend/QUICK_START.md` - Quick reference

