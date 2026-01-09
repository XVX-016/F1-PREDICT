# 🚀 F1 Prediction System - Startup Guide

## Quick Start Commands

### 1. **Start ML Service**
```powershell
# Navigate to project directory
cd C:\Computing\F1PREDICT-main\project

# Start ML service
cd model-service
python app.py
```

### 2. **Start Frontend** (in a new terminal)
```powershell
# Navigate to project directory
cd C:\Computing\F1PREDICT-main\project

# Start frontend
npm run dev
```

### 3. **Access the Application**
- Open browser and go to: `http://localhost:5173`
- Navigate to the Predictions page
- The PredictPage should load without parsing issues

## ✅ Verification Commands

### Test ML Service
```powershell
curl http://localhost:8000/health
# Should return: {"status": "healthy", "service": "ml-service"}
```

### Test Predictions
```powershell
curl "http://localhost:8000/predictions/race?name=Dutch Grand Prix&date=2025-08-31"
# Should return prediction data
```

## 🎯 What's Fixed

1. **PredictPage.tsx** - Simplified loading logic, removed debug code
2. **Dependencies** - Updated for Python 3.13 compatibility
3. **Service Communication** - Fixed API endpoints and error handling
4. **Loading States** - Improved reliability and user experience

## 📁 Correct Directory Structure

```
C:\Computing\F1PREDICT-main\
├── project/                    # Main project directory
│   ├── model-service/         # ML Service (Flask)
│   │   ├── app.py            # Main Flask app
│   │   └── requirements.txt  # Python dependencies
│   ├── src/                  # React Frontend
│   │   └── pages/
│   │       └── PredictPage.tsx # Fixed prediction page
│   └── package.json          # Frontend dependencies
└── backend/                  # Python backend (not used)
```

## 🚨 Common Issues & Solutions

### "No such file or directory"
- **Problem**: Running commands from wrong directory
- **Solution**: Always start from `C:\Computing\F1PREDICT-main\project`

### "ModuleNotFoundError: No module named 'flask_cors'"
- **Problem**: Dependencies not installed
- **Solution**: Run `python -m pip install -r requirements.txt` in model-service directory

### "npm error Missing script: dev"
- **Problem**: Running npm from wrong directory
- **Solution**: Run `npm run dev` from the `project` directory, not the root

## 🎉 Success Indicators

- ✅ ML service responds to health check
- ✅ Frontend loads at `http://localhost:5173`
- ✅ Predictions page loads without errors
- ✅ Race selection works
- ✅ No console errors in browser

**The PredictPage parsing issues have been completely resolved!**
