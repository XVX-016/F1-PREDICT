# Development Guide

Detailed instructions for setting up and working on the F1 Prediction Platform.

## 📋 Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase Account

## 🛠️ Step-by-Step Setup

### 1. Backend Configuration
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Fill in your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

### 2. Frontend Configuration
```bash
cd Frontend
npm install
# Ensure .env.local points to your backend URL
```

### 3. Database Initialization
Copy the schema from `backend/database/migrations/001_initial_schema.sql` into the Supabase SQL Editor and run it.

### 4. Run Pipeline Setup
This script handles telemetry extraction, ML training, and simulation initialization.
```bash
cd backend
python setup.py
```

## 🧪 Testing
We use `pytest` for backend verification.
```bash
cd backend
pytest  # Run all tests
```

## 📜 Project Structure
- `backend/`: FastAPI source code
- `Frontend/`: React application
- `docs/`: Technical documentation
- `setup.py`: End-to-end data pipeline script

## 🔍 Troubleshooting
- **Port 8000 busy**: `uvicorn main:app --port 8001`
- **Missing Deps**: Run `pip install -r requirements.txt` again.
- **Docker health check fail**: Ensure your `.env` variables are correctly passed to the container.
