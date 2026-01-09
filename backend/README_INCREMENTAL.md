# F1 Hybrid Prediction System - Incremental Trainer

## 🚀 Overview

The `run_full_season_incremental.py` script provides an **auto-updating F1 prediction pipeline** that:

1. **Loads all existing 2025 race data** from your specified folder
2. **Trains the hybrid system** (Monte Carlo + Bayesian + optional ML layer)
3. **Applies custom driver and team weights** (McLaren dominance)
4. **Automatically retrains** after each new GP or session is added
5. **Updates JSON predictions incrementally** (only retrains changed races)
6. **Monitors race data folders** for real-time changes

## 📋 Features

- **🔄 Incremental Updates**: Only retrains races with new/changed data
- **👀 Folder Monitoring**: Watches for new race data files automatically
- **⚡ Smart Caching**: Reuses existing predictions when possible
- **📊 Rich Metadata**: Tracks training history, timing, and data hashes
- **🎯 Custom Weights**: Configurable driver and team performance adjustments
- **🌦️ Scenario Support**: Multiple weather and race condition simulations
- **📝 Comprehensive Logging**: Detailed logs for debugging and analysis

## 🛠️ Installation

### 1. Install Dependencies

```bash
pip install -r requirements_incremental.txt
```

### 2. Verify Your Setup

Ensure you have:
- Python 3.7+ installed
- Your F1 prediction system working (tested with `test_all_drivers.py`)
- A folder containing 2025 race data (FP, Quali, GP results)

## 🚀 Quick Start

### Basic Training (One-time)

```bash
python run_full_season_incremental.py \
    --train-data "./2025-race-data" \
    --incremental-update
```

### Advanced Training with Custom Weights

```bash
python run_full_season_incremental.py \
    --train-data "./2025-race-data" \
    --num-simulations 5000 \
    --use-bayesian \
    --use-ml-layer \
    --driver-weights '{"VER":1.20,"NOR":1.35,"PIA":1.30}' \
    --team-weights '{"McLaren-Mercedes":1.35,"Red Bull Racing":1.15}' \
    --scenarios dry wet safety_car \
    --incremental-update
```

### Auto-Monitoring Mode

```bash
python run_full_season_incremental.py \
    --train-data "./2025-race-data" \
    --num-simulations 5000 \
    --use-bayesian \
    --use-ml-layer \
    --watch-folder \
    --incremental-update
```

## 📖 Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--train-data` | **Required**: Path to race data folder | - |
| `--output` | Output JSON file path | `./predictions/season_2025_incremental.json` |
| `--num-simulations` | Monte Carlo simulation count | `5000` |
| `--use-bayesian` | Enable Bayesian probability updates | `False` |
| `--use-ml-layer` | Enable ML layer for hidden patterns | `False` |
| `--driver-weights` | Custom driver weights (JSON string) | `{}` |
| `--team-weights` | Custom team weights (JSON string) | `{}` |
| `--scenarios` | Race scenarios to simulate | `dry wet safety_car` |
| `--incremental-update` | Enable incremental updates | `False` |
| `--watch-folder` | Monitor folder for changes | `False` |
| `--force-retrain` | Force full retraining of all races | `False` |
| `--verbose` | Enable verbose logging | `False` |

## 🎯 Custom Weights Examples

### Driver Weights (Reflecting Current Form)

```json
{
    "VER": 1.20,    // Max Verstappen - slightly below default
    "NOR": 1.35,    // Lando Norris - McLaren dominance
    "PIA": 1.30,    // Oscar Piastri - strong McLaren support
    "LEC": 1.25,    // Charles Leclerc - Ferrari leader
    "HAM": 1.15,    // Lewis Hamilton - Mercedes experience
    "RUS": 1.10,    // George Russell - Mercedes potential
    "SAI": 1.20,    // Carlos Sainz - Ferrari consistency
    "ALO": 1.15,    // Fernando Alonso - Aston Martin veteran
    "STR": 1.00,    // Lance Stroll - baseline performance
    "GAS": 1.05,    // Pierre Gasly - Alpine experience
    "OCO": 1.05,    // Esteban Ocon - Alpine consistency
    "ALB": 1.00,    // Alexander Albon - Williams baseline
    "TSU": 1.00,    // Yuki Tsunoda - Racing Bulls baseline
    "HUL": 1.00,    // Nico Hulkenberg - Haas baseline
    "LAW": 0.95,    // Liam Lawson - rookie adjustment
    "HAD": 0.95,    // Isack Hadjar - rookie adjustment
    "ANT": 0.90,    // Andrea Kimi Antonelli - rookie adjustment
    "BEA": 0.90,    // Oliver Bearman - rookie adjustment
    "BOR": 0.90,    // Gabriel Bortoleto - rookie adjustment
    "COL": 0.90     // Franco Colapinto - rookie adjustment
}
```

### Team Weights (Constructor Performance)

```json
{
    "McLaren-Mercedes": 1.35,      // Most dominant team
    "Red Bull Racing": 1.15,       // Strong but not dominant
    "Ferrari": 1.10,               // Competitive
    "Mercedes": 1.05,              // Improving
    "Aston Martin": 1.00,          // Baseline
    "Alpine": 0.95,                // Slightly below baseline
    "Williams": 0.90,              // Developing team
    "Sauber": 0.85,                // Rebuilding
    "Racing Bulls": 0.85,          // Rebuilding
    "Haas": 0.80                   // Challenging season
}
```

## 📁 Output Structure

The script generates a comprehensive JSON file with:

```json
{
    "metadata": {
        "generated_at": "2025-01-15T10:30:00",
        "training_time": "2025-01-15T10:25:00",
        "num_simulations": 5000,
        "use_bayesian": true,
        "use_ml_layer": true,
        "driver_weights": {...},
        "team_weights": {...},
        "scenarios": ["dry", "wet", "safety_car"],
        "training_history": [...]
    },
    "predictions": {
        "Bahrain Grand Prix": {
            "metadata": {...},
            "predictions": [...],
            "scenarios": {...}
        },
        "Saudi Arabian Grand Prix": {...},
        // ... all 24 races
    }
}
```

## 🔄 Incremental Update Logic

The system intelligently determines when to retrain:

1. **Data Hash Calculation**: Creates MD5 hash of all race data files
2. **Change Detection**: Compares current hash with previous training
3. **Selective Retraining**: Only retrains races with new/changed data
4. **Cache Validation**: Verifies existing predictions are still valid
5. **Efficient Updates**: Minimizes computation time and resources

## 👀 Folder Monitoring

When `--watch-folder` is enabled:

- **Real-time Detection**: Monitors for new/changed/deleted JSON files
- **Debounced Triggers**: Waits 5 seconds after last change to avoid rapid retraining
- **Background Processing**: Retraining runs in separate thread
- **Graceful Shutdown**: Press `Ctrl+C` to stop monitoring

## 📊 Training History

Each training run records:

- **Timestamp**: When training completed
- **Duration**: Total training time in seconds
- **Races Processed**: Total number of races handled
- **Success/Failure Counts**: Races that succeeded or failed
- **Data Hash**: Fingerprint of training data used
- **Configuration**: Settings used for that training run

## 🚨 Troubleshooting

### Common Issues

#### 1. Import Errors
```
ModuleNotFoundError: No module named 'services.EnhancedHybridPredictionService'
```
**Solution**: The script automatically falls back to `HybridPredictionService`

#### 2. Permission Errors
```
PermissionError: [Errno 13] Permission denied
```
**Solution**: Ensure write permissions to output directory

#### 3. Memory Issues
```
MemoryError: Unable to allocate array
```
**Solution**: Reduce `--num-simulations` (try 1000-2000)

#### 4. Folder Monitoring Not Working
**Solution**: Ensure `watchdog` is installed: `pip install watchdog`

### Debug Mode

Enable verbose logging for detailed information:

```bash
python run_full_season_incremental.py \
    --train-data "./2025-race-data" \
    --verbose \
    --incremental-update
```

## 🔧 Advanced Usage

### Batch Processing

```bash
# Train multiple configurations
for sims in 1000 2000 5000; do
    python run_full_season_incremental.py \
        --train-data "./2025-race-data" \
        --num-simulations $sims \
        --output "./predictions/season_2025_${sims}sims.json" \
        --incremental-update
done
```

### Integration with Other Tools

```bash
# Use with your existing prediction system
python run_full_season_incremental.py \
    --train-data "./2025-race-data" \
    --output "./api/predictions.json" \
    --watch-folder \
    --incremental-update &

# Your API can now serve fresh predictions from the JSON file
```

## 📈 Performance Tips

1. **Start Small**: Begin with 1000 simulations, increase as needed
2. **Use Incremental Updates**: Avoid full retraining unless necessary
3. **Monitor Resources**: Watch CPU/memory usage during training
4. **SSD Storage**: Use fast storage for race data and predictions
5. **Background Processing**: Use `--watch-folder` for continuous updates

## 🔮 Future Enhancements

- **Database Integration**: Store predictions in PostgreSQL/MongoDB
- **API Endpoints**: REST API for real-time prediction access
- **Web Dashboard**: Real-time monitoring and visualization
- **Cloud Deployment**: AWS/GCP integration for scalability
- **Multi-Season Support**: Historical data analysis and trends

## 📞 Support

For issues or questions:

1. Check the logs in `./predictions/training.log`
2. Enable `--verbose` mode for detailed output
3. Verify your race data folder structure
4. Ensure all dependencies are installed

---

**Happy Predicting! 🏎️🏆**
