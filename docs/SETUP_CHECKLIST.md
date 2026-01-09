# Setup Checklist

Complete checklist for setting up the F1 Prediction Platform.

## Prerequisites

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose (optional)
- [ ] Supabase account and project created
- [ ] Jolpica API key obtained
- [ ] Make installed (optional)

## Installation Steps

### Backend

- [ ] Install Python dependencies: `cd backend && pip install -r requirements.txt`
- [ ] Create virtual environment (recommended): `python -m venv venv`
- [ ] Activate virtual environment: `source venv/bin/activate` (Windows: `venv\Scripts\activate`)
- [ ] Verify installation: `python --version` and `pip list`

### Frontend

- [ ] Install Node dependencies: `cd Frontend && npm install`
- [ ] Verify installation: `npm --version` and `node --version`

## Configuration

### Environment Variables

- [ ] Copy `.env.example` to `.env`: `cp backend/.env.example backend/.env`
- [ ] Set `SUPABASE_URL` in `.env`
- [ ] Set `SUPABASE_SERVICE_KEY` in `.env`
- [ ] Set `FASTF1_CACHE_DIR` in `.env` (default: `./cache`)
- [ ] Set `JOLPICA_API_KEY` in `.env`
- [ ] Verify environment: `make env-check` or `cd backend && python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('SUPABASE_URL'))"`

### Frontend Environment

- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel or `.env.local`
- [ ] Verify no backend secrets in frontend

## Database Setup

- [ ] Apply migrations to Supabase: Run `backend/database/migrations/001_initial_schema.sql`
- [ ] Verify `races` table exists
- [ ] Verify `drivers` table exists
- [ ] Verify `race_probabilities` table exists
- [ ] Verify `telemetry_features` table exists
- [ ] Verify `pace_deltas` table exists
- [ ] Verify `model_runs` table exists
- [ ] Verify `simulation_runs` table exists
- [ ] Configure RLS policies
- [ ] Test database connection

## Automated Setup

- [ ] Run setup script: `make setup` or `python backend/setup.py`
- [ ] Verify Jolpica data fetch succeeded
- [ ] Verify FastF1 telemetry extraction succeeded
- [ ] Verify ML model training (if applicable)
- [ ] Verify Monte Carlo simulations ran
- [ ] Verify calibration setup

## Verification

### Backend

- [ ] Start backend: `make dev` or `uvicorn main:app --reload`
- [ ] Health check: `curl http://localhost:8000/health`
- [ ] Test probabilities endpoint: `curl http://localhost:8000/api/races/{id}/probabilities`
- [ ] Test markets endpoint: `curl http://localhost:8000/api/races/{id}/markets`
- [ ] Test pace deltas endpoint: `curl http://localhost:8000/api/races/{id}/pace-deltas`
- [ ] Test telemetry endpoint: `curl http://localhost:8000/api/drivers/{id}/telemetry-summary`

### Frontend

- [ ] Start frontend: `cd Frontend && npm run dev`
- [ ] Verify frontend loads: Open `http://localhost:5173` (or similar)
- [ ] Verify API connection: Check browser console for API calls
- [ ] Verify no direct ML calls from frontend
- [ ] Verify probabilities display correctly

## Testing

- [ ] Run all tests: `make test`
- [ ] Run unit tests: `make test-unit`
- [ ] Run integration tests: `make test-integration`
- [ ] Run validation tests: `make test-validation`
- [ ] Verify all tests pass

## Architecture Compliance

- [ ] ML models predict **only pace deltas** (not winners/positions)
- [ ] Simulation determines outcomes via Monte Carlo
- [ ] Probabilities generated from simulation results
- [ ] Calibration applied offline (not live)
- [ ] All data flows through Supabase
- [ ] Frontend consumes probabilities only (no direct ML calls)
- [ ] No winner/position prediction code in frontend
- [ ] API endpoints return probabilities, not predictions

## Frontend Refactoring

- [ ] Update `Frontend/src/services/calibration.ts` to consume API
- [ ] Update `Frontend/src/services/enhancedCalibration.ts` to consume API
- [ ] Update `Frontend/src/services/PredictionCalibrationService.ts` to consume API
- [ ] Remove all direct ML calls from frontend services
- [ ] Remove winner/position prediction logic from frontend
- [ ] Update API endpoints to use new architecture
- [ ] Test frontend with new API endpoints

## Production Readiness

### Backend

- [ ] Environment variables configured on deployment platform
- [ ] Database migrations applied to production Supabase
- [ ] Health checks configured
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Error tracking configured (Sentry, etc.)

### Frontend

- [ ] Production build works: `npm run build`
- [ ] Environment variables set in Vercel/Deployment platform
- [ ] API URL points to production backend
- [ ] No console errors in production build
- [ ] Performance optimized

## Deployment

- [ ] Backend deployed to Railway/Render
- [ ] Frontend deployed to Vercel
- [ ] Database connection verified in production
- [ ] Production endpoints tested
- [ ] Monitoring and alerts configured
- [ ] Documentation updated with production URLs

## Post-Deployment

- [ ] Run initial setup on production: `python backend/setup.py`
- [ ] Verify production health endpoint
- [ ] Test production API endpoints
- [ ] Verify production frontend connects to backend
- [ ] Monitor logs for errors
- [ ] Set up automated backups
- [ ] Configure SSL certificates (if needed)

## Completion

- [ ] All checklist items completed
- [ ] All tests passing
- [ ] Architecture compliance verified
- [ ] Documentation updated
- [ ] Team trained on new architecture

## Support

If you encounter issues:
1. Check [Setup Instructions](SETUP_INSTRUCTIONS.md)
2. Review [Quick Start Guide](QUICK_START.md)
3. Check [Architecture](ARCHITECTURE.md) documentation
4. Review error logs
5. Check environment variables: `make env-check`

