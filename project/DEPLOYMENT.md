# F1 Prediction System - Deployment Guide

## 🚀 Overview

This guide covers deploying the F1 Prediction System with local services to avoid CORS and API issues. The system now uses:
- **Local Jolpica API** (Port 5000) - Historical F1 data and ML training
- **Local Fast-F1 Service** (Port 8000) - Track features and additional F1 data
- **React Frontend** (Port 5173) - Main application

**Note**: OpenF1 live data endpoints have been removed as they're not available. The system now focuses on historical data analysis and predictions.

## 📋 Prerequisites

### Required Software
- **Python 3.12** (required for Jolpica compatibility)
- **Node.js 18+** and npm
- **Git** for cloning repositories

### System Requirements
- **RAM**: 4GB+ recommended
- **Storage**: 2GB+ free space
- **Network**: Internet access for initial setup

## 🏗️ Setup Instructions

### 1. Clone and Setup Services

```powershell
# Navigate to project directory
cd project

# Clone services (if not already done)
mkdir services
cd services
git clone https://github.com/jolpica/jolpica-f1.git
git clone https://github.com/theOehrly/Fast-F1.git
cd ..
```

### 2. Setup Jolpica API

```powershell
cd services/jolpica-f1

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
python -m pip install --upgrade pip
python -m pip install poetry==1.8.3
poetry install --only main --no-root

# Setup database (first time only)
python manage.py migrate

# Test the service
python manage.py runserver 0.0.0.0:5000
```

### 3. Setup Fast-F1 Service

```powershell
cd ../Fast-F1

# Use the same virtual environment from Jolpica
..\jolpica-f1\.venv\Scripts\Activate.ps1

# Install Fast-F1 dependencies
python -m pip install -r requirements.txt

# Test the service
python main.py
```

### 4. Setup Frontend

```powershell
cd ../../

# Install frontend dependencies
npm install

# Build the application
npm run build

# Start development server
npm run dev
```

## 🚀 Quick Start (Automated)

Use the provided PowerShell script for automated setup:

```powershell
# Run the startup script
.\start-local-services.ps1
```

This script will:
- Check Python version
- Start Jolpica API on port 5000
- Start Fast-F1 service on port 8000
- Verify services are running
- Provide next steps

## 🔧 Manual Service Management

### Start Jolpica API
```powershell
cd services/jolpica-f1
.\.venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:5000
```

### Start Fast-F1 Service
```powershell
cd services/Fast-F1
..\jolpica-f1\.venv\Scripts\Activate.ps1
python main.py
```

### Start Frontend
```powershell
cd project
npm run dev
```

## 🌐 Service Endpoints

### Jolpica API (Port 5000)
- **Health Check**: `http://localhost:5000/admin/`
- **F1 Data**: `http://localhost:5000/ergast/f1/2025/drivers`
- **Races**: `http://localhost:5000/ergast/f1/2025/races`
- **Results**: `http://localhost:5000/ergast/f1/2025/results`
- **Historical Data**: `http://localhost:5000/ergast/f1/{year}/races`

### Fast-F1 Service (Port 8000)
- **Health Check**: `http://localhost:8000/health`
- **F1 Data**: `http://localhost:8000/api/f1/2025/drivers`
- **Races**: `http://localhost:8000/api/f1/2025/races`
- **Results**: `http://localhost:8000/api/f1/2025/results`
- **Track Features**: Additional F1 data endpoints

### Frontend (Port 5173)
- **Main App**: `http://localhost:5173`
- **Predict Page**: `http://localhost:5173/#/predict`

## 🧪 Testing

### 1. Test Jolpica API
```bash
curl http://localhost:5000/ergast/f1/2025/drivers
```

### 2. Test Fast-F1 Service
```bash
curl http://localhost:8000/health
```

### 3. Test Frontend
- Open `http://localhost:5173`
- Navigate to Predict page
- Check browser console for API calls to local services

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### Python Version Issues
```powershell
# Check Python version
python --version

# If not 3.12, install Python 3.12 from python.org
```

#### Virtual Environment Issues
```powershell
# Recreate virtual environment
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### Database Migration Issues
```powershell
cd services/jolpica-f1
python manage.py makemigrations
python manage.py migrate
```

### Service Health Checks

#### Jolpica Health
- Check `http://localhost:5000/admin/`
- Look for Django admin interface
- Check console for error messages

#### Fast-F1 Health
- Check `http://localhost:8000/health`
- Should return `{"status": "healthy"}`
- Check console for Python errors

#### Frontend Health
- Check browser console for errors
- Verify API calls to localhost:5000 and localhost:8000
- Check network tab for failed requests

## 🚀 Production Deployment

### Environment Variables
Create `.env.production` file:

```bash
# API Configuration
VITE_JOLPICA_BASE_URL=https://your-jolpica-domain.com/ergast/f1
VITE_FAST_F1_BASE_URL=https://your-fastf1-domain.com

# ML Service
VITE_MODEL_SERVICE_URL=https://your-ml-service.com

# Firebase (if using)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Build for Production
```powershell
# Build the application
npm run build

# The built files will be in the `dist` folder
# Deploy the contents of `dist` to your web server
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile for production
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📊 Monitoring

### Service Monitoring
- **Jolpica**: Check Django logs and admin interface
- **Fast-F1**: Monitor FastAPI logs and health endpoint
- **Frontend**: Browser console and network tab

### Performance Metrics
- **Build Time**: Target < 6 seconds (currently ~5.07s ✅)
- **API Response Time**: Target < 500ms
- **Bundle Size**: Target < 500KB (currently 458KB ✅)

## 🔄 Updates and Maintenance

### Update Services
```powershell
cd services/jolpica-f1
git pull origin main
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate

cd ../Fast-F1
git pull origin main
pip install -r requirements.txt
```

### Update Frontend
```powershell
cd project
git pull origin main
npm install
npm run build
```

## 📞 Support

### Logs Location
- **Jolpica**: Console output and Django logs
- **Fast-F1**: Console output and FastAPI logs
- **Frontend**: Browser console and network tab

### Common Commands
```powershell
# Check service status
Get-Process | Where-Object {$_.ProcessName -like "*python*"}

# Restart services
# Close PowerShell windows and run start-local-services.ps1 again

# Clear cache
# Delete .venv folder and recreate virtual environment
```

## ✅ Success Criteria

Your deployment is successful when:
1. ✅ Jolpica API responds on port 5000
2. ✅ Fast-F1 service responds on port 8000
3. ✅ Frontend loads without errors
4. ✅ Predict page loads race data from local APIs
5. ✅ No CORS errors in browser console
6. ✅ Build time remains under 6 seconds
7. ✅ Bundle size remains under 500KB

## 🔄 Architecture Changes

### What Was Removed
- **OpenF1 API**: Live race data endpoints removed (not available)
- **External API calls**: All external dependencies eliminated

### What Was Added
- **Local Jolpica**: Historical F1 data and ML training capabilities
- **Local Fast-F1**: Track features and additional F1 data
- **Dev Server Proxies**: Eliminates CORS issues during development

---

**Last Updated**: December 2024
**Version**: 1.1.0
