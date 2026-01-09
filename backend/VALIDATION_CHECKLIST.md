# Architecture Validation Checklist

## Phase 12: Testing & Validation

### 1. ML Model Validation

- [ ] **ML outputs pace deltas only** - No winner/position predictions
- [ ] **Model target is `pace_delta_ms`** - Not classification
- [ ] **LightGBM regressor** - Not classifier
- [ ] **Features are aggregated** - No raw telemetry
- [ ] **Training is per-regulation-era** - No cross-era leakage

### 2. Simulation Validation

- [ ] **Simulation has no ML** - Pure physics/stochastic
- [ ] **Uses pace deltas as input** - Not winner predictions
- [ ] **Monte Carlo runs 5k-10k** - Sufficient for stable probabilities
- [ ] **Outputs probabilities only** - Not positions

### 3. Probability Engine Validation

- [ ] **Combines simulation + ML** - Correctly integrated
- [ ] **Calibration is offline** - Not live
- [ ] **Stores in database** - Traceable
- [ ] **Frontend consumes only** - No direct ML calls

### 4. Data Layer Validation

- [ ] **Jolpica provides structured data** - Calendar, results, standings
- [ ] **FastF1 provides telemetry features** - FP2 only, aggregated
- [ ] **No raw telemetry in ML** - Only aggregated features
- [ ] **Data stored in Supabase** - Not CSV

### 5. API Validation

- [ ] **No winner/position endpoints** - Only probabilities
- [ ] **Probabilities endpoint works** - `/api/races/{id}/probabilities`
- [ ] **Markets endpoint works** - `/api/races/{id}/markets`
- [ ] **Pace deltas endpoint exists** - For debugging only

### 6. Database Validation

- [ ] **Schema matches plan** - All tables present
- [ ] **Model runs table exists** - For auditing
- [ ] **Simulation runs table exists** - For traceability
- [ ] **Outcome probabilities table** - Not "race_probabilities"
- [ ] **Regulation era column** - In races table

### 7. Security Validation

- [ ] **Supabase service key backend only** - Not exposed
- [ ] **Frontend doesn't access Supabase** - All through API
- [ ] **RLS configured** - Public read-only for probabilities
- [ ] **Env vars secure** - Not in code

### 8. Frontend Validation

- [ ] **No direct ML calls** - Only probability endpoints
- [ ] **No winner inference** - Shows probabilities only
- [ ] **No manual odds calculation** - Uses market endpoint
- [ ] **No Supabase access** - All through backend

## Test Commands

```bash
# Test ML model
python -c "from models.pace_model import PaceModel; m = PaceModel(); print('ML model loads')"

# Test simulation
python -c "from simulation.monte_carlo import MonteCarloEngine; e = MonteCarloEngine(); print('Simulation engine loads')"

# Test probability engine
python -c "from services.probability_engine import probability_engine; print('Probability engine loads')"

# Test API
curl http://localhost:8000/health
curl http://localhost:8000/api/races/{race_id}/probabilities
```

## Success Criteria

- No ML model predicts winners/positions
- ML outputs only pace deltas
- Simulation determines outcomes
- Probabilities are realistic (not overconfident)
- Frontend shows probabilities, not predictions
- All data flows through Supabase
- Jolpica provides structured data
- FastF1 provides telemetry features only
- Model runs and simulation runs are auditable
- Regulation eras prevent cross-era leakage
- Calibration is offline (not live)





