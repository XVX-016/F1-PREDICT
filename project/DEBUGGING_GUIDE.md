# F1 Prediction System Debugging Guide

## Issues Fixed

### 1. ML Service Not Running
- **Problem**: Flask ML service wasn't starting properly
- **Solution**: Created `start-ml-service.bat` script
- **Usage**: Double-click `start-ml-service.bat` in the `project` folder

### 2. Predict Page Going Blank
- **Problem**: API calls failed, causing blank page
- **Solution**: Added fallback predictions and error handling
- **Result**: Page now shows default predictions even when ML service is down

### 3. Missing API Endpoints
- **Problem**: Frontend calling `/users/profile` that didn't exist
- **Solution**: Added endpoint to ML service
- **Result**: Profile calls no longer 404

### 4. Environment Configuration
- **Problem**: No centralized API configuration
- **Solution**: Created `src/config/api.ts` with all endpoints
- **Result**: Consistent API URLs across the application

## How to Start the System

### Step 1: Start ML Service
```bash
cd project
start-ml-service.bat
```
This will:
- Install Python requirements
- Start Flask service on port 8000
- Show health endpoint at http://localhost:8000/health

### Step 2: Start Frontend
```bash
cd project
npm run dev
```
This will:
- Start Vite dev server on port 5173
- Proxy `/ml` requests to ML service
- Show the app at http://localhost:5173

### Step 3: Test Endpoints
- **Health**: http://localhost:8000/health
- **Predictions**: http://localhost:8000/predictions/latest?race=Monaco%20Grand%20Prix
- **Markets**: http://localhost:8000/betting/markets?name=Monaco%20Grand%20Prix

## Troubleshooting

### ML Service Won't Start
1. Check if Python is installed: `python --version`
2. Check if port 8000 is free: `netstat -an | findstr :8000`
3. Install requirements manually: `pip install -r model-service/requirements.txt`

### Predict Page Still Blank
1. Check browser console for errors
2. Verify ML service is running: http://localhost:8000/health
3. Check if fallback predictions are working

### CORS Issues
1. ML service has CORS enabled
2. Vite proxy configured for `/ml` → `http://localhost:8000`
3. Frontend should use relative URLs or proxy paths

## API Endpoints

### ML Service (Port 8000)
- `GET /health` - Service health check
- `GET /predictions/latest?race=<name>` - Latest predictions
- `GET /predictions/race?name=<name>&date=<date>` - Race-specific predictions
- `GET /betting/markets?name=<race>&date=<date>` - Betting markets
- `POST /betting/place` - Place bets
- `GET /live/status` - Live race status
- `GET /live/race/<year>/<round>` - Live race data
- `GET /profile/<user_id>` - User profile
- `GET /users/profile` - User profile (frontend endpoint)

### Frontend (Port 5173)
- Main app: http://localhost:5173
- Predict page: http://localhost:5173/#/predict
- Proxy: `/ml/*` → `http://localhost:8000/*`

## File Structure
```
project/
├── src/
│   ├── config/api.ts          # API configuration
│   ├── services/MLPredictionService.ts  # ML service client
│   └── pages/PredictPage.tsx  # Predict page with fallbacks
├── model-service/
│   ├── app.py                 # Flask ML service
│   └── requirements.txt       # Python dependencies
├── start-ml-service.bat       # ML service startup script
└── vite.config.ts             # Vite proxy configuration
```
