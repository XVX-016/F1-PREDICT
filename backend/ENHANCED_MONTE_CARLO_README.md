# Enhanced Monte Carlo F1 Prediction System

## Overview

This enhanced system runs **30,000 Monte Carlo simulations** for each Grand Prix, integrating with calibration data to provide robust, probabilistic F1 race predictions. The system combines:

- **Monte Carlo Simulations**: 30,000 simulations per race for statistical robustness
- **Calibration Integration**: Driver and team performance factors from calibration data
- **Track-Specific Factors**: Circuit characteristics and weather sensitivity
- **Hybrid Prediction Model**: Combines multiple prediction approaches for accuracy

## Features

### 🎲 Monte Carlo Engine
- **30,000 simulations per race** (upgraded from 1,000)
- Statistical distributions and confidence intervals
- Position probability calculations (win, podium, points)
- Performance variance analysis

### 🔧 Calibration Integration
- Driver tier and form factors
- Team performance metrics (aero, power, reliability)
- Track-specific adjustments
- Weather sensitivity factors

### 📊 Output Format
- Individual race prediction files
- Combined season predictions
- API-ready formats for frontend consumption
- Detailed metadata and simulation statistics

## File Structure

```
backend/
├── services/
│   ├── EnhancedHybridMonteCarloService.py    # Main service
│   ├── MonteCarloEngine.py                   # Monte Carlo engine (updated to 30k sims)
│   └── ...
├── generate_monte_carlo_predictions.py       # Generation script
├── run_monte_carlo_predictions.bat           # Windows batch file
├── run_monte_carlo_predictions.ps1           # PowerShell script
└── predictions/                               # Generated prediction files
    ├── {circuit}_monte_carlo_predictions.json
    ├── all_races_monte_carlo_predictions.json
    └── monte_carlo_generation_summary.json
```

## Quick Start

### 1. Generate All Race Predictions

**Windows (Batch):**
```cmd
run_monte_carlo_predictions.bat
```

**PowerShell:**
```powershell
.\run_monte_carlo_predictions.ps1
```

**Python directly:**
```bash
python generate_monte_carlo_predictions.py
```

### 2. Generate Single Race Predictions

```python
from services.EnhancedHybridMonteCarloService import enhanced_hybrid_monte_carlo_service

# Generate predictions for a specific race
predictions = enhanced_hybrid_monte_carlo_service.generate_monte_carlo_predictions("Monaco Grand Prix")

# Get existing predictions
predictions = enhanced_hybrid_monte_carlo_service.get_race_predictions("Monaco Grand Prix")
```

## API Endpoints

The system provides these API endpoints for frontend consumption:

### Get Race Predictions
```
GET /predict/{race_identifier}
```
Returns comprehensive predictions for a specific race.

### Get Next Race Predictions
```
GET /predict/next-race/simple
```
Returns simplified predictions for the upcoming race.

### Get Race Predictions (Legacy)
```
GET /predictions/race?name={race_name}
```
Returns predictions in the legacy format.

## Prediction File Format

Each race generates a JSON file with this structure:

```json
{
  "race_name": "Monaco Grand Prix",
  "circuit": "monaco",
  "round": 6,
  "date": "2025-05-25",
  "monte_carlo_metadata": {
    "num_simulations": 30000,
    "model_version": "2025-Hybrid-MonteCarlo-v1.0"
  },
  "driver_predictions": [
    {
      "driver_id": "max_verstappen",
      "driver_name": "Max Verstappen",
      "team": "Red Bull Racing",
      "monte_carlo_results": {
        "win_probability": 0.45,
        "podium_probability": 0.78,
        "points_probability": 0.92,
        "expected_position": 1.2,
        "position_std": 0.8,
        "confidence_interval_95": [0.8, 2.1]
      },
      "calibration_factors": {
        "driver_weight": 1.2,
        "team_weight": 1.1,
        "tier": 1,
        "form_factor": 1.15
      }
    }
  ]
}
```

## Performance

### Simulation Time
- **Per race**: ~2-5 minutes (depending on system)
- **Full season**: ~1-2 hours for 24 races
- **Total simulations**: 720,000 simulations per season

### Memory Usage
- **Per simulation**: ~50-100 MB
- **Peak memory**: ~2-4 GB during generation
- **Storage**: ~50-100 MB per race file

## Calibration Data

The system uses these calibration factors:

### Driver Factors
- **Weight**: Base performance multiplier
- **Tier**: Driver skill level (1-5)
- **Form Factor**: Recent performance adjustment
- **Consistency**: Reliability factor

### Team Factors
- **Aero Efficiency**: Aerodynamic performance
- **Power Unit**: Engine performance
- **Reliability**: Mechanical reliability

### Track Factors
- **Type**: Street, permanent, high-speed, technical
- **Weather Sensitivity**: Rain impact factor
- **Overtaking Opportunities**: Track passing difficulty

## Troubleshooting

### Common Issues

1. **Memory Errors**
   - Reduce batch size in Monte Carlo engine
   - Run races individually instead of all at once

2. **Import Errors**
   - Ensure all required packages are installed
   - Check Python path and virtual environment

3. **File Not Found Errors**
   - Verify data files exist (drivers_2025.json, etc.)
   - Check file permissions and paths

### Debug Mode

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Updating Predictions

### Regenerate All Races
```bash
python generate_monte_carlo_predictions.py
```

### Regenerate Single Race
```python
enhanced_hybrid_monte_carlo_service.generate_monte_carlo_predictions("Race Name")
```

### Update Calibration
1. Modify `driver_calibration.json`
2. Regenerate predictions for affected races
3. Restart the service if running

## Integration with Frontend

The frontend can consume predictions through:

1. **Direct API calls** to the new endpoints
2. **File-based loading** from prediction JSON files
3. **Real-time generation** on-demand

## Future Enhancements

- **Parallel Processing**: Multi-core Monte Carlo simulations
- **Real-time Updates**: Live prediction updates during race weekends
- **Machine Learning Integration**: ML-enhanced Monte Carlo parameters
- **Weather Integration**: Dynamic weather-based adjustments
- **Historical Data**: Past performance integration

## Support

For issues or questions:
1. Check the logs in the console output
2. Verify data file integrity
3. Ensure all dependencies are installed
4. Check file permissions and paths

---

**Note**: This system generates predictions using 30,000 Monte Carlo simulations per race, providing robust statistical confidence in the results. The generation process may take several minutes per race depending on your system's performance.
