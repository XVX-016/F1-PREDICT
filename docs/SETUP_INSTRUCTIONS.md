# Setup Instructions

Complete step-by-step setup guide for the F1 Prediction Platform.

## Prerequisites Checklist

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed  
- [ ] Docker and Docker Compose (optional)
- [ ] Supabase account and project
- [ ] Jolpica API key
- [ ] Make installed (optional, for Makefile)

## Step-by-Step Setup

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Using virtual environment (recommended):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd ../Frontend  # Note: Capital 'F' in Frontend
npm install
```

**Or using yarn:**
```bash
cd Frontend
yarn install
```

### 3. Set Environment Variables

#### Backend Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

**Required in `backend/.env`:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
FASTF1_CACHE_DIR=./cache
JOLPICA_API_KEY=your-jolpica-api-key-here
```

#### Frontend Environment (Vercel or `.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # Development
# Or for production:
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

**Important:** Frontend should NOT have backend secrets. Only `NEXT_PUBLIC_API_URL` is needed.

### 4. Run Database Migrations

Apply migrations to your Supabase instance:

```bash
# Using psql
psql <supabase-connection-string> -f backend/database/migrations/001_initial_schema.sql

# Or use Supabase dashboard SQL editor
# Copy and paste: backend/database/migrations/001_initial_schema.sql
```

**Verify these tables exist:**
- `races`
- `drivers`  
- `race_probabilities`
- `telemetry_features`
- `pace_deltas`
- `model_runs`
- `simulation_runs`

### 5. Run Automated Setup

The setup script will automatically:
- ✅ Fetch Jolpica structured data
- ✅ Extract FastF1 telemetry features
- ✅ Train ML pace-delta model
- ✅ Run Monte Carlo simulations
- ✅ Setup probability calibration

**Using Makefile:**
```bash
make setup
```

**Or manually:**
```bash
cd backend
python setup.py
```

### 6. Verify Backend Setup

Test that backend is working:

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "version": "2.0.0",
#   "architecture": "simulation-first"
# }

# Get probabilities (replace {race_id} with actual ID)
curl http://localhost:8000/api/races/{race_id}/probabilities

# Get markets
curl http://localhost:8000/api/races/{race_id}/markets

# Get pace deltas (debugging)
curl http://localhost:8000/api/races/{race_id}/pace-deltas
```

### 7. Run Tests

Verify everything works:

```bash
# All tests
make test

# Or manually
cd backend
pytest tests/ -v

# Specific test suites
make test-unit         # Unit tests
make test-integration  # Integration tests  
make test-validation   # Validation tests
```

### 8. Start Backend Development Server

**Using Makefile (Recommended):**
```bash
make dev
```

**Or manually:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Note:** 
- `main.py` contains the refactored code (this is the default)
- If you have `main_refactored.py` as a separate file, use: `make dev-refactored` or `uvicorn main_refactored:app --reload`

### 9. Update Frontend API Calls

**Critical:** Refactor frontend services to consume probabilities only from backend API.

**Files to update:**
- `Frontend/src/services/calibration.ts`
- `Frontend/src/services/enhancedCalibration.ts`
- `Frontend/src/services/PredictionCalibrationService.ts`
- `Frontend/src/services/*.ts` (all prediction services)

**Remove:**
- ❌ Direct ML calls
- ❌ Winner prediction logic
- ❌ Position prediction logic

**Replace with:**
- ✅ API calls to `/api/races/{id}/probabilities`
- ✅ Display probabilities (win%, podium%, top10%)
- ✅ Use backend-provided probabilities only

**Example refactor:**

**Before (❌ Wrong):**
```typescript
// Don't do this - direct ML prediction
const prediction = await mlService.predictWinner(driverId);
const winProb = prediction.winProbability;
```

**After (✅ Correct):**
```typescript
// Do this - consume from backend API
const response = await fetch(`${API_URL}/api/races/${raceId}/probabilities`);
const data = await response.json();
const driverProb = data.find(p => p.driver_id === driverId);
const winProb = driverProb?.win_probability || 0;
```

### 10. Start Frontend Development Server

```bash
cd Frontend
npm run dev
# or
yarn dev
```

Frontend typically runs on:
- Vite: `http://localhost:5173`
- Next.js: `http://localhost:3000`

### 11. Verify Full Stack Integration

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:5173` (or similar)
- [ ] Frontend can fetch probabilities from backend
- [ ] No direct ML calls from frontend
- [ ] All data flows through Supabase

## Quick Start (All-in-One)

For fastest setup:

```bash
# 1. Install everything
make install
cd Frontend && npm install && cd ..

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with credentials

# 3. Run migrations (manual step - apply to Supabase)

# 4. Run setup and verify
make setup
make test

# 5. Start backend
make dev

# 6. In another terminal, start frontend
cd Frontend && npm run dev
```

## Docker Quick Start

One-command setup with Docker:

```bash
# Build and start (runs setup automatically)
docker-compose up --build

# View logs
make docker-logs

# Stop
make docker-down
```

## Troubleshooting

### Port Already in Use

```bash
# Change port
uvicorn main:app --reload --port 8001
```

### Missing Environment Variables

```bash
make env-check
# Shows which variables are missing
```

### Database Connection Failed

- Verify Supabase URL and service key in `.env`
- Check migrations have been run
- Verify RLS policies are set correctly

### Frontend Can't Connect to Backend

- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running
- Check CORS settings in backend
- Check network/firewall settings

### Module Not Found Errors

```bash
# Backend
cd backend
rm -rf venv __pycache__
pip install -r requirements.txt

# Frontend
cd Frontend
rm -rf node_modules package-lock.json
npm install
```

## Architecture Compliance Checklist

After setup, verify:

- [ ] ML models predict **only pace deltas** (not winners/positions)
- [ ] Simulation determines outcomes via Monte Carlo
- [ ] Probabilities generated from simulation results
- [ ] Calibration applied offline (not live)
- [ ] All data flows through Supabase
- [ ] Frontend consumes probabilities only (no direct ML calls)
- [ ] No winner/position prediction code in frontend
- [ ] API endpoints return probabilities, not predictions

## Next Steps

1. ✅ Verify all endpoints work correctly
2. ✅ Run full test suite: `make test`
3. ✅ Update frontend to use new API endpoints
4. ✅ Deploy to production (see [Deployment Guide](DEPLOYMENT_GUIDE.md))

## Support & Documentation

- [Quick Start Guide](QUICK_START.md) - Quick reference
- [Architecture](ARCHITECTURE.md) - Architecture overview
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment guide

