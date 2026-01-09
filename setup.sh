#!/bin/bash

echo "=========================================="
echo "F1 PREDICTION MARKET - AUTOMATED SETUP"
echo "=========================================="
echo

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "ERROR: PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first"
    exit 1
fi

echo "[1/6] Setting up PostgreSQL database..."
echo "Please ensure PostgreSQL is running"

# Create database
echo "Creating database..."
createdb f1_prediction_market 2>/dev/null || echo "Database might already exist, continuing..."

echo "[2/6] Importing database schema..."
if ! psql -d f1_prediction_market -f database/schema.sql; then
    echo "ERROR: Failed to import database schema"
    echo "Please check if PostgreSQL is running and you have proper permissions"
    exit 1
fi

echo "[3/6] Setting up backend dependencies..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    if ! npm install; then
        echo "ERROR: Failed to install backend dependencies"
        exit 1
    fi
else
    echo "Backend dependencies already installed"
fi

echo "[4/6] Creating backend environment file..."
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "Created .env file - PLEASE CONFIGURE YOUR API KEYS"
else
    echo ".env file already exists"
fi

cd ..

echo "[5/6] Setting up frontend dependencies..."
cd project

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    if ! npm install; then
        echo "ERROR: Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "Frontend dependencies already installed"
fi

cd ..

echo "[6/6] Setup complete!"
echo
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo "1. Configure your API keys in backend/.env:"
echo "   - COINBASE_COMMERCE_API_KEY"
echo "   - COINBASE_COMMERCE_WEBHOOK_SECRET"
echo "   - DATABASE_URL (if different from default)"
echo
echo "2. Start the backend server:"
echo "   cd backend"
echo "   npm run dev"
echo
echo "3. Start the frontend (in a new terminal):"
echo "   cd project"
echo "   npm start"
echo
echo "4. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   WebSocket: ws://localhost:3002"
echo
echo "=========================================="
