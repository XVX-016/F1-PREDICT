# Quick Start Guide

Fastest way to get started with the F1 Prediction Platform.

## 🚀 Fastest Setup

### Using Makefile

```bash
# 1. Install everything
make install
cd Frontend && npm install && cd ..

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 3. Run setup
make setup

# 4. Start backend
make dev

# 5. In another terminal, start frontend
cd Frontend
npm run dev
```

### Using Docker

```bash
# Build and start everything (runs setup automatically)
docker-compose up --build
```

## 📋 Quick Checklist

- [ ] Install backend dependencies: `cd backend && pip install -r requirements.txt`
- [ ] Install frontend dependencies: `cd Frontend && npm install`
- [ ] Configure `.env`: `cp backend/.env.example backend/.env`
- [ ] Run database migrations on Supabase
- [ ] Run setup: `make setup` or `python backend/setup.py`
- [ ] Verify backend: `curl http://localhost:8000/health`
- [ ] Start backend: `make dev`
- [ ] Start frontend: `cd Frontend && npm run dev`

## ⚡ Makefile Commands

```bash
make help          # Show all commands
make install       # Install backend dependencies
make setup         # Run full automated setup
make dev           # Start development server
make test          # Run all tests
make test-unit     # Unit tests only
make test-integration  # Integration tests
make test-validation   # Validation tests
make clean         # Clean cache files
make docker-build  # Build Docker image
make docker-up     # Start containers
make docker-down   # Stop containers
make env-check     # Check environment variables
```

## 🔍 Verification

After setup, verify:

- [ ] Backend health endpoint: `curl http://localhost:8000/health`
- [ ] Probabilities endpoint: `curl http://localhost:8000/api/races/{id}/probabilities`
- [ ] Frontend can connect to backend API
- [ ] No direct ML calls from frontend
- [ ] All tests pass: `make test`

## 📚 More Information

- [Setup Instructions](SETUP_INSTRUCTIONS.md) - Detailed step-by-step guide
- [Architecture](ARCHITECTURE.md) - System architecture overview
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment instructions

