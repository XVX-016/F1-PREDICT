# F1 Prediction System - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

```powershell
# Navigate to project directory
cd project

# Install ML service dependencies
cd model-service
python -m pip install -r requirements.txt

# Install frontend dependencies
cd ..
npm install
```

### 2. Start Services

```powershell
# Start ML service (in one terminal)
cd model-service
python app.py

# Start frontend (in another terminal)
cd ..
npm run dev
```

### 3. Test Services

```powershell
# Test ML service health
curl http://localhost:8000/health

# Test predictions
curl "http://localhost:8000/predictions/race?race_name=Dutch%20Grand%20Prix&date=2025-08-31"

# Frontend should be available at
# http://localhost:5173
```

## 🔧 Troubleshooting

### ML Service Not Starting
- **Error**: `ModuleNotFoundError: No module named 'flask_cors'`
- **Solution**: Run `python -m pip install -r requirements.txt` in model-service directory

### Frontend Not Loading Predictions
- **Error**: Predictions not showing
- **Solution**: Ensure ML service is running on port 8000

### Port Already in Use
- **Error**: Port 8000 or 5173 already in use
- **Solution**: Kill existing processes or change ports in configuration

## 📁 Project Structure

```
project/
├── model-service/          # ML Prediction Service (Flask)
│   ├── app.py             # Main Flask application
│   └── requirements.txt   # Python dependencies
├── src/                   # React Frontend
│   ├── pages/
│   │   └── PredictPage.tsx # Main prediction page (FIXED)
│   └── services/          # API services
├── backend/               # Node.js Backend (optional)
└── scripts/               # Utility scripts
```

## 🎯 What's Fixed

1. **PredictPage.tsx** - Removed complex fallback logic and debug code
2. **Service Scripts** - Fixed PowerShell syntax errors
3. **Project Structure** - Identified and documented proper structure
4. **Loading States** - Improved reliability of prediction loading

## 🚨 Known Issues

1. **Dependencies** - Need to install Python packages for ML service
2. **Service Coordination** - Services need to be started in correct order
3. **Environment Variables** - May need to configure .env file

## ✅ Success Indicators

- ML service responds to `/health` endpoint
- Frontend loads without errors
- Predictions display correctly
- No console errors in browser

## 🆘 Need Help?

1. Check if all services are running: `netstat -an | findstr :8000`
2. Check browser console for errors
3. Verify Python dependencies are installed
4. Ensure ports are not blocked by firewall
