# 🏎️ F1 Hybrid Prediction System - Quick Start Guide

## 🚀 **Get Started in 30 Seconds!**

### **Option 1: Windows Batch File (Easiest)**
```cmd
# Show all available commands
run_incremental_trainer.bat help

# Run demo with McLaren dominance
run_incremental_trainer.bat demo

# Start folder monitoring (auto-updates)
run_incremental_trainer.bat watch

# Quick training
run_incremental_trainer.bat quick
```

### **Option 2: Direct Python Commands**
```bash
# Basic training (all 20 drivers)
python run_full_season_incremental.py --train-data "./2025-race-data" --incremental-update

# Full McLaren dominance setup
python run_full_season_incremental.py --train-data "./2025-race-data" --num-simulations 5000 --use-bayesian --use-ml-layer --incremental-update

# Force retrain everything
python run_full_season_incremental.py --train-data "./2025-race-data" --force-retrain
```

### **Option 3: PowerShell Script**
```powershell
# Show help
.\run_incremental_trainer.ps1 help

# Run demo
.\run_incremental_trainer.ps1 demo -Simulations 2000

# Start monitoring
.\run_incremental_trainer.ps1 watch -Bayesian -MLLayer
```

## ✅ **What You Get Immediately**

- **🎯 All 20 Drivers**: Complete 2025 F1 driver predictions
- **🏁 24 Races**: Full season coverage with realistic probabilities
- **🔄 Auto-Updates**: Only retrains when race data changes
- **📊 Rich Metadata**: Training history, timing, and data hashes
- **🌦️ Multiple Scenarios**: Dry, wet, and safety car conditions
- **📁 JSON Output**: Ready for API integration or analysis

## 🎯 **McLaren Dominance Configuration**

The system automatically applies:
- **McLaren-Mercedes**: 1.35x team weight (most dominant)
- **Lando Norris**: 1.35x driver weight (top performer)
- **Oscar Piastri**: 1.30x driver weight (strong support)
- **Max Verstappen**: 1.20x driver weight (realistic competition)

## 📁 **Output Files**

- **`predictions/season_2025_incremental.json`**: Main predictions file
- **`predictions/training.log`**: Detailed training logs
- **`predictions/`**: All generated prediction files

## 🔄 **Incremental Update Magic**

1. **First Run**: Generates predictions for all 24 races
2. **Subsequent Runs**: Only retrains races with new data
3. **Smart Caching**: Reuses existing predictions when possible
4. **Data Hash Tracking**: Detects changes automatically

## 👀 **Folder Monitoring Mode**

```bash
# Start watching for new race data
python run_full_season_incremental.py --train-data "./2025-race-data" --watch-folder --incremental-update
```

This will:
- Monitor your `2025-race-data` folder
- Auto-retrain when new FP/Quali/GP files arrive
- Keep predictions always up-to-date
- Press `Ctrl+C` to stop monitoring

## 🚨 **Troubleshooting**

### **"Only 5 drivers predicted"**
- The system now generates **all 20 drivers** by default
- If you see 5 drivers, run with `--force-retrain`

### **Import errors**
- The system automatically falls back to a working prediction service
- No additional dependencies required

### **PowerShell issues**
- Use the `.bat` file instead (works on all Windows versions)
- Or use direct Python commands

## 📈 **Performance Tips**

1. **Start Small**: Begin with 1000 simulations, increase as needed
2. **Use Incremental**: Avoid full retraining unless necessary
3. **Monitor Resources**: Watch CPU/memory during training
4. **Background Mode**: Use `--watch-folder` for continuous updates

## 🎮 **Example Workflows**

### **Daily Race Analysis**
```bash
# Morning: Check current predictions
python run_full_season_incremental.py --train-data "./2025-race-data" --incremental-update

# After FP/Quali: Auto-update (if using --watch-folder)
# Or manual update:
python run_full_season_incremental.py --train-data "./2025-race-data" --force-retrain
```

### **Season Planning**
```bash
# Generate full season baseline
python run_full_season_incremental.py --train-data "./2025-race-data" --num-simulations 5000 --use-bayesian --use-ml-layer --incremental-update

# Save to specific file
python run_full_season_incremental.py --train-data "./2025-race-data" --output "./season_planning_2025.json" --force-retrain
```

### **API Integration**
```bash
# Generate predictions for your API
python run_full_season_incremental.py --train-data "./2025-race-data" --output "./api/predictions.json" --watch-folder --incremental-update
```

## 🏆 **Success Metrics**

✅ **20 drivers predicted** for each race  
✅ **24 races covered** (full 2025 season)  
✅ **Incremental updates** working  
✅ **McLaren dominance** reflected  
✅ **JSON output** generated  
✅ **Logging** operational  

## 🎯 **Next Steps**

1. **Run the demo**: `run_incremental_trainer.bat demo`
2. **Check output**: Look at `predictions/season_2025_incremental.json`
3. **Start monitoring**: `run_incremental_trainer.bat watch`
4. **Customize weights**: Modify the fallback service for your preferences
5. **Integrate**: Use the JSON output in your applications

---

**🎉 You're ready to predict F1 races like a pro! 🏎️🏆**

*The system automatically handles all the complexity - just run the commands and get professional-grade F1 predictions for all 20 drivers across the entire 2025 season.*
