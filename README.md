# F1 Prediction Platform

Simulation-first, ML-assisted F1 race prediction platform with clean architecture and full auditability.

## Architecture

**Simulation-first, ML-assisted architecture:**
- ML models predict **only pace deltas** (not winners/positions)
- Simulation determines outcomes via Monte Carlo
- Probabilities power fantasy markets
- Full auditability with `model_runs` and `simulation_runs` tracking

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- Jolpica API key

### Installation

```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../Frontend
npm install

# Configure environment
cd ../backend
cp .env.example .env
# Edit .env with your credentials

# Run setup
python setup.py
# or
make setup

# Start backend
make dev
# or
uvicorn main:app --reload
```

### Using Makefile

```bash
make install    # Install dependencies
make setup      # Run automated setup
make test       # Run all tests
make dev        # Start development server
make help       # Show all commands
```

### Docker

```bash
docker-compose up --build
```

## Documentation

All documentation is centralized in the [`docs/`](docs/) folder:

### Getting Started
- [Quick Start Guide](docs/QUICK_START.md) - Fastest way to get started
- [Setup Instructions](docs/SETUP_INSTRUCTIONS.md) - Complete step-by-step setup guide
- [Setup Checklist](docs/SETUP_CHECKLIST.md) - Step-by-step checklist

### Architecture & Design
- [Architecture Overview](docs/ARCHITECTURE.md) - System architecture and design principles
- [Backend README](docs/README.md) - Backend-specific documentation

### Setup & Deployment
- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed setup documentation
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Documentation Index](docs/INDEX.md) - Complete documentation index

**Note:** All new `.md` files should be created in the `docs/` folder only.

## Key Principles

1. ✅ ML predicts **pace deltas only** (never winners/positions)
2. ✅ Simulation determines outcomes via Monte Carlo
3. ✅ Probabilities are calibrated offline
4. ✅ Frontend consumes probabilities only (no direct ML calls)
5. ✅ All data flows through Supabase
6. ✅ Full auditability with model and simulation run tracking

## Project Structure

```
F1-PREDICT/
├── backend/           # Python FastAPI backend
│   ├── api/          # API endpoints
│   ├── data/         # Data layer (Jolpica, FastF1)
│   ├── features/     # Feature engineering
│   ├── models/       # ML models (pace deltas only)
│   ├── simulation/   # Monte Carlo simulation
│   ├── services/     # Business logic
│   └── database/     # Supabase client
├── Frontend/         # React/TypeScript frontend
├── docs/             # All documentation
└── docker-compose.yml
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/races/{id}/probabilities` - Get outcome probabilities
- `GET /api/races/{id}/markets` - Get fantasy markets
- `GET /api/races/{id}/pace-deltas` - Get ML pace deltas (debug)
- `GET /api/drivers/{id}/telemetry-summary` - Get aggregated telemetry
- `GET /api/live/{id}` - SSE live updates

## Testing

```bash
make test              # All tests
make test-unit         # Unit tests
make test-integration  # Integration tests
make test-validation   # Validation tests
```

## Deployment

- **Backend**: Railway or Render
- **Frontend**: Vercel
- **Database**: Supabase (managed)

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for details.

## License

[Add your license here]

## Support

For issues or questions, check the [documentation](docs/) or open an issue.

