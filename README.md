# Race Replay & Intelligence Engine

## Overview
Deterministic Formula 1 race replay and analysis engine built on FastF1 / Jolpica timing data.
No fabricated telemetry. All behavior is derived from official timing and events.

## Architecture
- API Layer (Jolpica / Ergast)
- Replay Engine (deterministic state machine)
- Intelligence Page (post-race analysis & charts)

## Data Philosophy
- **No synthetic performance data**: All deltas inferred from timing, gaps, and race control events.
- **Physics-First**: Simulations are anchored in deterministic pysics models (tyre degradation, fuel burn).
- **Probabilistic, Not Predictive**: Evaluates strategy distributions, not point estimates.
- **Replay explains observed behavior**, it does not invent it.

## Installation

### Prerequisites
* **Python 3.9+**
* **Node.js 18+** (for frontend)

### Backend Setup
```bash
# Clone repository
git clone https://github.com/XVX-016/F1-PREDICT.git
cd F1-PREDICT/backend

# Install backend dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Run database migrations & initialize data pipeline
python setup.py

# Start backend server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

## Development

* **Frontend**: Vite + React + TypeScript
* **Linting**: ESLint (strict)
* **Data**: Fallback supported when API unavailable

## Known Limitations

* **No live telemetry**: Real-time telemetry availability depends on upstream sources.
* **Inferred Physics**: ERS, fuel, tyre effects are inferred, not simulated dynamically from car telemetry (which is private).
* **Approximations**: Multi-driver interaction effects are approximated.

## Future Work

* **Adaptive Hazard Modeling**: Dynamically learn track-specific incident probabilities.
* **Multi-Driver Interaction**: Improved overtaking and traffic penalty models.
* **Calibration-Aware Learning**: Continuous Brier-score optimization.
* **Live Telemetry Integration**: Update predictions during races.
