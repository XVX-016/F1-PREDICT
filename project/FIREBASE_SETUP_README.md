# Firebase Setup and ML Model Training Guide

This guide will help you set up Firebase for your F1 Predict application and train the ML model with historical F1 data from the Jolpica API.

## 🚀 Quick Start

### 1. Install Dependencies

First, install the required dependencies:

```bash
npm install
```

### 2. Firebase Configuration

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enable Firestore Database
4. Go to Project Settings > General
5. Scroll down to "Your apps" section
6. Click the web icon (</>) to add a web app
7. Register your app and copy the configuration

#### Set Environment Variables

Create a `.env` file in the project root with your Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_URL=http://localhost:3001

# Jolpica API (fallback)
VITE_JOLPICA_BASE_URL=https://api.jolpi.ca/ergast/f1

# ML Model Configuration
VITE_ML_MODEL_ENABLED=true
VITE_ML_MODEL_UPDATE_INTERVAL=300000

# WebSocket Configuration
VITE_WEBSOCKET_URL=ws://localhost:8000/ws/live
VITE_WEBSOCKET_RECONNECT_ATTEMPTS=5
VITE_WEBSOCKET_RECONNECT_INTERVAL=1000
```

#### Configure Firestore Security Rules

In Firebase Console > Firestore Database > Rules, set the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all users
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to write to their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to create bets
    match /bets/{betId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Seed Firebase Database

Run the seeding script to populate your Firebase database with F1 data:

```bash
npm run seed-firebase
```

This script will:
- Fetch current season data from Jolpica API
- Fetch historical data from 2024 season
- Create collections for drivers, races, results, and standings
- Populate the database with comprehensive F1 statistics

### 4. Train ML Model

After seeding the database, train the ML model:

```bash
npm run train-ml
```

This script will:
- Load data from Firebase and Jolpica API
- Process driver statistics and performance metrics
- Generate race predictions using weighted algorithms
- Save predictions to Firebase (in a real implementation)

## 📊 Data Structure

The seeding script creates the following collections:

### Drivers Collection
```typescript
{
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  constructorId?: string;
  constructorName?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Races Collection
```typescript
{
  raceId: string; // format: "2025_1"
  season: number;
  round: number;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Results Collection
```typescript
{
  raceId: string;
  season: number;
  round: number;
  driverId: string;
  constructorId: string;
  position: number;
  points: number;
  grid: number;
  laps: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Driver Standings Collection
```typescript
{
  driverId: string;
  season: number;
  position: number;
  points: number;
  wins: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🤖 ML Model Features

The ML model uses the following factors to generate predictions:

### Performance Weights
- **Season Performance (35%)**: Current season points, wins, podiums
- **Track History (25%)**: Historical performance at specific circuits
- **Recent Form (20%)**: Performance in last 5 races
- **Qualifying Performance (15%)**: Grid positions and pole positions
- **Fastest Lap Performance (5%)**: Fastest lap achievements

### Prediction Categories
- **Race Winner**: Top 5 drivers with win probabilities
- **Podium**: Top 8 drivers with podium probabilities
- **Qualifying**: Top 6 drivers with pole position probabilities
- **Fastest Lap**: Top 5 drivers with fastest lap probabilities

### Confidence Scoring
Each prediction includes:
- Probability percentage
- Odds calculation
- Confidence level
- Contributing factors

## 🔧 Troubleshooting

### Common Issues

#### 1. Firebase Connection Errors
```
❌ Missing Firebase configuration keys
```
**Solution**: Ensure all `VITE_FIREBASE_*` environment variables are set in your `.env` file.

#### 2. Jolpica API Rate Limiting
```
⚠️ Jolpica API attempt X failed
```
**Solution**: The script includes automatic retries and fallbacks to Ergast API.

#### 3. ML Model Initialization Errors
```
❌ Error initializing ML model: drivers is not iterable
```
**Solution**: This error occurs when no drivers data is available. The updated service now handles this gracefully.

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG=true
```

### Manual Data Verification

Check your Firebase console to verify data was seeded correctly:
1. Go to Firestore Database
2. Check collections: `drivers`, `races`, `results`, `driver_standings`
3. Verify document counts match expected values

## 📈 Performance Optimization

### Batch Operations
The seeding script uses Firebase batch operations for efficient data writing.

### Caching
The Jolpica API client includes intelligent caching to minimize API calls.

### Rate Limiting
Built-in delays prevent API rate limiting during data seeding.

## 🔄 Data Updates

### Automatic Updates
The ML model can be retrained automatically by running:
```bash
npm run train-ml
```

### Manual Updates
To update specific data:
1. Modify the seeding script
2. Run `npm run seed-firebase` again
3. Run `npm run train-ml` to retrain the model

## 🚀 Next Steps

After successful setup:

1. **Test the Application**: Start your development server and verify data loads correctly
2. **Monitor Performance**: Check Firebase console for query performance
3. **Scale Up**: Consider implementing real-time data updates for live race data
4. **Customize**: Modify the ML model weights and algorithms based on your needs

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-modeling)
- [Jolpica API Documentation](https://api.jolpi.ca/)
- [F1 Data Analysis](https://ergast.com/mrd/)

## 🆘 Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your Firebase configuration
3. Ensure all environment variables are set correctly
4. Check your internet connection for API access

---

**Happy Racing! 🏎️🏁**
