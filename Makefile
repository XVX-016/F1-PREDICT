# F1 Prediction Platform - Makefile
# One-command setup and deployment

.PHONY: help setup install test clean docker-build docker-up docker-down

# Default target
help:
	@echo "F1 Prediction Platform - Available Commands:"
	@echo ""
	@echo "  make setup          - Run full automated setup (Jolpica + FastF1 + ML + Simulation)"
	@echo "  make install        - Install backend dependencies"
	@echo "  make test           - Run all tests"
	@echo "  make test-unit       - Run unit tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-validation - Run validation tests"
	@echo "  make clean          - Clean cache and temporary files"
	@echo "  make docker-build   - Build Docker image"
	@echo "  make docker-up      - Start Docker containers"
	@echo "  make docker-down    - Stop Docker containers"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make dev            - Start development server"
	@echo "  make lint           - Run linter"
	@echo ""

# Full setup
setup:
	@echo "Running full automated setup..."
	cd backend && python setup.py

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt

# Run all tests
test:
	@echo "Running all tests..."
	cd backend && python -m pytest tests/ -v

# Unit tests
test-unit:
	@echo "Running unit tests..."
	cd backend && python -m pytest tests/unit/ -v

# Integration tests
test-integration:
	@echo "Running integration tests..."
	cd backend && python -m pytest tests/integration/ -v

# Validation tests
test-validation:
	@echo "Running validation tests..."
	cd backend && python -m pytest tests/validation/ -v

# Clean cache and temporary files
clean:
	@echo "Cleaning cache and temporary files..."
	rm -rf backend/cache/*
	rm -rf backend/__pycache__
	rm -rf backend/**/__pycache__
	find backend -name "*.pyc" -delete
	find backend -name "*.pyo" -delete
	@echo "Clean complete"

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker-compose build

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose logs -f backend

docker-restart:
	@echo "Restarting Docker containers..."
	docker-compose restart

# Development server
dev:
	@echo "Starting development server..."
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Alternative: Start with main_refactored (if exists)
dev-refactored:
	@echo "Starting development server (refactored)..."
	cd backend && uvicorn main_refactored:app --reload --host 0.0.0.0 --port 8000 || uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Linting
lint:
	@echo "Running linter..."
	cd backend && python -m flake8 . --exclude=__pycache__,cache,venv,env
	cd backend && python -m pylint **/*.py --ignore=__pycache__,cache,venv,env || true

# Environment setup
env-check:
	@echo "Checking environment variables..."
	@cd backend && python -c "import os; from dotenv import load_dotenv; load_dotenv(); required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'FASTF1_CACHE_DIR', 'JOLPICA_API_KEY']; missing = [v for v in required if not os.getenv(v)]; exit(0 if not missing else print(f'Missing: {missing}') or 1)"

# Database migrations
migrate:
	@echo "Running database migrations..."
	@echo "Note: Run migrations manually on your Supabase instance:"
	@echo "  psql <supabase-connection> -f backend/database/migrations/001_initial_schema.sql"

# Quick start (setup + dev server)
quickstart: install env-check setup dev
