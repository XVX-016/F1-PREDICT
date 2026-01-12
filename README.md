# F1 Prediction Platform

A simulation-first, ML-assisted F1 race prediction platform.

## Key Features
- **Simulation-First**: Outcomes are determined by physics-based Monte Carlo simulations, not raw ML classes.
- **ML-Assisted**: LightGBM models predict pure driver pace deltas (relative speed) to feed the simulation.
- **Production-Ready**: "Thin Client" frontend communicates with a robust FastAPI backend.
- **Auditable**: Full tracking of every model run and simulation instance in Supabase.

## Quick Start (Docker)

The fastest way to get the platform running is using Docker Compose.

```bash
# 1. Clone and configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Start the stack (automated setup)
docker-compose up --build
```
The backend will automatically run `setup.py` on first start to initialize the pipeline.

## Local Development

For manual setup and detailed developer instructions:
See [**Development Guide**](docs/DEVELOPMENT.md)

## Architecture

- **Backend**: Python (FastAPI, FastF1, LightGBM, Scikit-Learn)
- **Frontend**: React (TypeScript, Vite)
- **Database**: Supabase (PostgreSQL)

For a deep dive into how it works:
See [**Architecture Deep Dive**](docs/ARCHITECTURE.md)

## API Endpoints

- `GET /health` - API status
- `GET /api/races/{id}/probabilities` - Calibrated win/podium/top10 probabilities
- `GET /api/races/{id}/markets` - Fantasy odds and market data

## Deployment

Detailed instructions for Railway, Vercel, and Render:
See [**Deployment Guide**](docs/DEPLOYMENT.md)
