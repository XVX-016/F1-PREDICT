# F1-PREDICT 🏎️💨

**Domain:** Applied ML for Science | High-Stakes Predictive Modeling  
**Track:** Track 03 — High-Stakes Applied Machine Learning  
**Team:** Byte_me  
**Members:** Tanmmay Kanhaiya (24BCA7072), Hardik Kumar (24BCE7727)

---

## 🔬 Problem Statement

Formula 1 is a **high-stakes environment** where milliseconds and minor strategic miscalculations can cost millions of dollars and podium positions. Traditional predictions—single-point estimates of winners—are insufficient in this partially observable, stochastic domain.

**F1-PREDICT** transforms raw race data into **probabilistic intelligence**, capturing uncertainty, risk, and strategy implications to support robust, data-driven decisions.

**Key Challenges:**

* **Partial observability**: Hidden tire wear, fuel load, and opponent strategies
* **Stochastic hazards**: Crashes, Safety Cars, and weather changes
* **High-stakes decisions**: Small miscalculations have irreversible outcomes
* **Uncertainty modeling**: Deterministic predictions are risky; probabilities and confidence intervals are required

---

## 🛠️ Technical Architecture & Methodology

### 1. Data Acquisition

* **FastF1 Telemetry**: Lap-level telemetry, sector times, and race dynamics
* **Jolpica F1 API**: Race schedules, historical standings, and archives
* **Feature Engineering**: Driver form, constructor reliability, track characteristics, environmental conditions
* **Redis Cache**: Real-time telemetry state management for live race sessions

### 2. Physics-First Simulation Engine

* **Deterministic Physics Models**:
  * Tyre degradation (compound-specific, non-linear curves)
  * Fuel burn and mass reduction effects
  * Pit stop time loss and traffic penalties
  * Monotonic lap time constraints within stints

* **Probabilistic Layer**:
  * Safety Car probability models by lap window
  * Weather transition modeling
  * Execution noise and variance
  * Strategy robustness under uncertainty

### 3. Machine Learning Integration

* **Pace Delta Prediction**:
  * **Model**: LightGBM regressor (L1 loss)
  * **Target**: Relative pace deltas (ms) vs field average
  * **Features**: `avg_long_run_pace_ms`, `tire_deg_rate`, `sector_consistency`, `clean_air_delta`, `recent_form`, `grid_position`
  * **Training**: GroupKFold cross-validation by race (prevents data leakage)
  * **Calibration**: Residual distribution analysis for uncertainty bands

* **Model Versioning**: Artifact tracking with metadata (OOF MAE, baselines, feature importance)

### 4. Monte Carlo Simulation

* **Strategy Evaluation**: 5,000-10,000 iterations per strategy
* **Output Distributions**: Win probability, podium probability, DNF risk, pace distributions (P05/P50/P95)
* **Robustness Metrics**: Variance analysis and confidence intervals
* **Event Attribution**: Causal shadow runs for Safety Car impact analysis

### 5. Strategy Optimization

* **Multi-Objective Optimization**: Expected time vs. risk vs. robustness
* **Strategy Space Search**: Pit window optimization, compound selection
* **What-If Analysis**: Side-by-side strategy comparison under identical conditions

### 6. Explainability & Decision Support

* **Feature Importance**: LightGBM gain-based importance
* **SHAP Values**: Feature contribution per prediction (when enabled)
* **Counterfactual Simulation**: "What-if" scenarios for pit windows and hazard timing
* **Calibration Metrics**: Brier score and reliability diagrams for probability outputs

### 7. Visualization & Frontend

* **Interactive Dashboard (React + TypeScript + Vite)**:
  * Real-time probability distributions
  * Podium likelihoods and win probabilities
  * Risk/confidence bands (P05/P50/P95)
  * Strategy comparison visualizations
  * Live telemetry integration via WebSocket

* **Charting Libraries**: D3.js for engineering-grade visualizations, Recharts for statistical plots

---

## 📊 Performance Metrics

| Metric                        | Result        | Scientific Significance                                     |
| ----------------------------- | ------------- | ----------------------------------------------------------- |
| **OOF MAE (Pace Delta)**      | ~102 ms       | Out-of-fold cross-validation MAE for pace prediction       |
| **Baseline Improvement**      | 68% vs zero   | Significant improvement over zero-delta baseline            |
| **Brier Score**               | 0.05-0.09     | Probability calibration quality (lower is better)           |
| **Simulation Iterations**     | 5k-10k        | Monte Carlo convergence for stable distributions            |
| **Model Versioning**          | v20260117     | Reproducible model artifacts with full metadata              |

**Note**: Metrics are continuously updated as more race data becomes available. The system prioritizes **calibration and robustness** over headline accuracy.

---

## 🚀 Installation & Quick Start

### Prerequisites

* **Python 3.9+**
* **Node.js 18+** (for frontend)
* **Redis** (for live telemetry caching)
* **Supabase Account** (for database)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/XVX-016/F1-PREDICT.git
cd F1-PREDICT

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and API keys

# Run database migrations
# Execute SQL files from backend/database/migrations/ in Supabase SQL Editor

# Initialize data pipeline
python setup.py

# Start backend server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# From project root
cd Frontend

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

### Docker Deployment (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

### Run a Simulation

```bash
# Via API
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "track_id": "abu_dhabi",
    "iterations": 5000,
    "use_ml": true,
    "seed": 42
  }'
```

**Expected Output:**

* Win probabilities per driver
* Podium probabilities (P1/P2/P3)
* DNF risk estimates
* Pace distributions with confidence bands
* Recommended strategy with robustness score
* Event attribution (if Safety Car events injected)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│  FastF1 Telemetry  │  Jolpica API  │  Supabase Database   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              FEATURE ENGINEERING                             │
│  Telemetry Aggregation  │  Driver Form  │  Track Context   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              ML PACE MODEL (LightGBM)                        │
│  Predicts: pace_delta_ms (relative to field average)        │
│  Output: Calibrated pace offsets with uncertainty bands     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│         SIMULATION ENGINE (Physics + Monte Carlo)            │
│  • Deterministic: Tyre deg, fuel burn, pit loss             │
│  • Probabilistic: SC events, weather, execution noise       │
│  • Strategy optimization and comparison                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│         PROBABILITY ENGINE                                  │
│  Win/Podium/DNF probabilities with confidence intervals     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│         FRONTEND (React + TypeScript)                       │
│  Interactive dashboards, real-time visualizations           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔮 Future Features (High-Stakes Innovation)

1. **Adaptive Hazard Modeling**: Dynamically learn track-specific incident probabilities in real-time
2. **Multi-Driver Interaction**: Model overtaking, DRS effects, and traffic penalties more accurately
3. **Calibration-Aware Learning**: Continuous Brier-score optimization for probability reliability
4. **Live Telemetry Integration**: Update predictions during races for dynamic strategy support
5. **Team Strategy Optimization**: Suggest non-obvious tactics using game-theoretic analysis
6. **Regulation Era Separation**: Per-era model training to handle rule changes (2022+ ground effect, etc.)

---

## 🛡️ Ethics & Robustness

* **Bias Mitigation**: Adjust model to avoid over-reliance on dominant teams or historical streaks
* **Reproducibility**: Fixed seeds, deterministic preprocessing, and traceable probability outputs
* **Safety-First Modeling**: Avoid overconfident predictions; explicitly show confidence intervals and risk bands
* **Stateless Design**: No user tracking, no personal data storage, fully auditable outputs
* **Physics Constraints**: ML predictions are bounded by physical plausibility checks

---

## 📁 Project Structure

```
F1-PREDICT/
├── backend/
│   ├── api/              # FastAPI endpoints
│   ├── engine/           # Simulation engine (physics + Monte Carlo)
│   │   ├── physics/      # Tyre, fuel, pit models
│   │   ├── simulation/   # Monte Carlo simulator
│   │   └── telemetry/    # Redis telemetry manager
│   ├── ml/               # Machine learning models
│   │   ├── training/     # LightGBM training scripts
│   │   └── features/     # Feature engineering
│   ├── models/           # Domain models and calibration
│   ├── services/         # Business logic services
│   ├── data/             # Data clients (FastF1, Jolpica)
│   └── database/         # Supabase client and migrations
├── Frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── sim/          # Simulation logic
│   │   └── api/          # API clients
│   └── public/           # Static assets
└── docs/                 # Architecture and deployment docs
```

---

## 🧪 Testing & Validation

```bash
# Run backend tests
cd backend
pytest tests/

# Verify simulation physics
python scripts/verify_simulation.py

# Debug feature extraction
python scripts/debug_features.py

# Validate ML model
python ml/training/train_lgbm.py
```

---

## 📚 Documentation

* [Architecture Overview](docs/ARCHITECTURE.md)
* [Deployment Guide](docs/DEPLOYMENT.md)
* [Development Guide](docs/DEVELOPMENT.md)
* [Model Validation](docs/model_validation.md)
* [Features V1](docs/FEATURES_V1.md)

---

## 🎯 Design Philosophy

F1-PREDICT follows a **physics-first, ML-assisted** approach:

1. **Physics First**: All simulations enforce physical constraints (tyre degradation, fuel burn, pit loss)
2. **Probabilistic, Not Predictive**: Evaluates strategy distributions, not point estimates
3. **Reproducibility by Construction**: Deterministic seeds, traceable outputs
4. **Transparency Over Black-Box AI**: ML is bounded, optional, and fully traceable
5. **Evidence Over Claims**: Verification scripts, automated tests, and explicit limitations

This project is an **engineering-grade analysis tool**, not a betting system or fan prediction app.

---

## 📝 License

[Specify your license here]

---

## 🙏 Acknowledgments

* FastF1 library for telemetry data
* Jolpica F1 API for race schedules and results
* Supabase for database infrastructure
* Formula 1 teams for inspiring real-world strategy analysis workflows



