# F1 Prediction Wrapper 🏎️

A **super easy-to-use Python wrapper** that makes F1 predictions as simple as a single function call! This wrapper provides a clean, programmatic interface to the F1 prediction system, wrapping all the complex CLI functionality into intuitive Python methods.

## 🚀 Quick Start

### Installation
```bash
# The wrapper is ready to use - no additional installation needed!
cd backend
python f1_prediction_wrapper.py --help
```

### Basic Usage
```python
from f1_prediction_wrapper import F1PredictionWrapper

# Initialize the wrapper
predictor = F1PredictionWrapper()

# Generate predictions for Spa with one line!
results = predictor.predict_race("Spa-Francorchamps", drivers="all")
```

## 🎯 What You Get

- **Single function calls** for any prediction type
- **Automatic error handling** and fallbacks
- **Built-in result analysis** and insights
- **Automatic file management** (outputs, logs)
- **Service + CLI fallback** system
- **Batch processing** capabilities
- **Scenario-based predictions** (dry/wet conditions)

## 📚 Complete API Reference

### Core Methods

#### 1. Single Race Prediction
```python
result = predictor.predict_race(
    race="Spa-Francorchamps",      # Race name
    drivers="all",                 # "all" or specific driver codes
    monte_carlo=5000,             # Number of simulations
    bayesian=True,                 # Enable Bayesian updates
    scenario="dry",                # Optional: weather scenario
    use_service=True               # Try service interface first
)
```

#### 2. Full Season Prediction
```python
season_result = predictor.predict_season(
    monte_carlo=5000,             # Simulations per race
    bayesian=True,                 # Bayesian probability updates
    scenario="dry,wet",            # Multiple scenarios
    use_service=True               # Service interface preferred
)
```

#### 3. Scenario-Based Predictions
```python
scenarios = ["dry", "wet", "intermediate"]
scenario_results = predictor.predict_with_scenarios(
    race="Monaco",
    scenarios=scenarios,
    monte_carlo=3000,
    bayesian=True
)
```

#### 4. Batch Race Processing
```python
races = ["Monaco", "Spa-Francorchamps", "Monza"]
batch_results = predictor.batch_predict_races(
    races=races,
    monte_carlo=2000,
    bayesian=True
)
```

### Result Analysis

```python
# Analyze any prediction result
analysis = predictor.analyze_results(result)

print(f"Race: {analysis['race']}")
print(f"Execution time: {analysis['execution_time']}")
print(f"Total drivers: {analysis['total_drivers']}")
print(f"Method used: {analysis['method']}")

# Top predictions
if "top_predictions" in analysis:
    for driver, prob in analysis["top_predictions"].items():
        print(f"{driver}: {prob:.3f}")
```

### File Management

```python
# Save results with custom filename
saved_file = predictor.save_results(result, "my_spa_predictions.json")

# Load previously saved results
loaded_result = predictor.load_results("my_spa_predictions.json")
```

## 🎮 Usage Examples

### Example 1: Quick Spa Prediction
```python
from f1_prediction_wrapper import F1PredictionWrapper

predictor = F1PredictionWrapper()

# Generate Spa predictions with 5000 Monte Carlo simulations
spa_result = predictor.predict_race(
    race="Spa-Francorchamps",
    monte_carlo=5000,
    bayesian=True
)

# Get insights
analysis = predictor.analyze_results(spa_result)
print(f"Top driver: {list(analysis['top_predictions'].keys())[0]}")
```

### Example 2: Weather Scenario Analysis
```python
# Compare dry vs wet conditions for Monaco
scenarios = ["dry", "wet"]
monaco_scenarios = predictor.predict_with_scenarios(
    race="Monaco",
    scenarios=scenarios,
    monte_carlo=3000
)

# Analyze each scenario
for condition, result in monaco_scenarios.items():
    if result.success:
        analysis = predictor.analyze_results(result)
        top_driver = list(analysis["top_predictions"].keys())[0]
        print(f"{condition.upper()}: {top_driver} wins")
```

### Example 3: Full Season Analysis
```python
# Generate complete 2025 season predictions
season_result = predictor.predict_season(
    monte_carlo=5000,
    bayesian=True,
    scenario="dry,wet"
)

# Save for later analysis
saved_file = predictor.save_results(season_result, "season_2025_predictions.json")
print(f"Season predictions saved to: {saved_file}")
```

### Example 4: Custom Driver Analysis
```python
# Focus on specific drivers
top_drivers = "VER,PER,NOR,PIA"
spa_top = predictor.predict_race(
    race="Spa-Francorchamps",
    drivers=top_drivers,
    monte_carlo=3000,
    bayesian=True
)

# Analyze results
analysis = predictor.analyze_results(spa_top)
print(f"Top among top drivers: {list(analysis['top_predictions'].keys())[0]}")
```

## ⚙️ Configuration Options

### PredictionConfig
```python
from f1_prediction_wrapper import PredictionConfig

config = PredictionConfig(
    race="Monaco",
    drivers="all",
    monte_carlo=5000,
    bayesian=True,
    scenario="dry,wet",
    fallback=True,
    verbose=True
)

predictor = F1PredictionWrapper(config=config)
```

### Environment Setup
```python
# Custom output and log directories
predictor = F1PredictionWrapper(
    base_output_dir="./my_predictions",
    base_log_dir="./my_logs"
)
```

## 🔧 CLI Interface

The wrapper also provides a command-line interface:

```bash
# Single race prediction
python f1_prediction_wrapper.py --race "Spa-Francorchamps" --monte_carlo 5000

# Full season prediction
python f1_prediction_wrapper.py --race "all" --monte_carlo 5000

# With scenarios
python f1_prediction_wrapper.py --race "Monaco" --scenario "dry,wet"

# Custom output directories
python f1_prediction_wrapper.py --race "Spa" --output_dir "./results" --log_dir "./logs"
```

## 📊 Output Structure

### PredictionResult Object
```python
@dataclass
class PredictionResult:
    success: bool                    # Whether prediction succeeded
    race: str                       # Race name
    drivers: List[str]              # List of drivers analyzed
    predictions: Dict[str, Any]     # Raw prediction data
    metadata: Dict[str, Any]        # Execution metadata
    execution_time: float           # Time taken
    timestamp: str                  # When prediction was made
    errors: List[str]               # Any errors encountered
    warnings: List[str]             # Any warnings
```

### File Outputs
- **Predictions**: `./predictions/race_predictions_timestamp.json`
- **Logs**: `./logs/race_predictions_timestamp.log`
- **Analysis**: Built-in result analysis and insights

## 🚨 Error Handling

The wrapper includes comprehensive error handling:

```python
try:
    result = predictor.predict_race("Spa-Francorchamps")
    
    if result.success:
        # Process successful results
        analysis = predictor.analyze_results(result)
    else:
        # Handle failures
        print(f"Prediction failed: {result.errors}")
        print(f"Warnings: {result.warnings}")
        
except Exception as e:
    print(f"Wrapper error: {e}")
```

## 🔄 Fallback System

The wrapper automatically handles service failures:

1. **Primary**: Try EnhancedHybridPredictionService (if available)
2. **Fallback**: Use CLI interface with subprocess
3. **Error Handling**: Comprehensive error reporting and recovery

## 📈 Performance Tips

### For Development/Testing
```python
# Use fewer simulations for faster results
result = predictor.predict_race(
    race="Monaco",
    monte_carlo=1000,  # Faster for testing
    bayesian=True
)
```

### For Production
```python
# Use full simulations for accuracy
result = predictor.predict_race(
    race="Spa-Francorchamps",
    monte_carlo=5000,  # Full accuracy
    bayesian=True
)
```

### Batch Processing
```python
# Process multiple races efficiently
races = ["Monaco", "Spa", "Monza", "Silverstone"]
batch_results = predictor.batch_predict_races(
    races=races,
    monte_carlo=3000
)
```

## 🎯 Best Practices

1. **Start Simple**: Begin with single race predictions
2. **Use Scenarios**: Leverage weather scenario analysis
3. **Monitor Logs**: Check log files for debugging
4. **Save Results**: Always save important predictions
5. **Error Handling**: Implement proper error handling in your scripts
6. **Resource Management**: Adjust Monte Carlo simulations based on needs

## 🚀 Advanced Usage

### Custom Analysis
```python
# Custom result processing
def custom_analysis(result):
    if result.success and "predictions" in result.predictions:
        preds = result.predictions["predictions"]
        # Your custom analysis logic here
        return custom_insights
    return None

# Use with wrapper
result = predictor.predict_race("Monaco")
insights = custom_analysis(result)
```

### Integration with Other Systems
```python
# Integrate with your existing systems
class MyF1Analyzer:
    def __init__(self):
        self.predictor = F1PredictionWrapper()
    
    def analyze_race(self, race_name):
        result = self.predictor.predict_race(race_name)
        # Your custom business logic here
        return self.process_predictions(result)
```

## 📝 Troubleshooting

### Common Issues

1. **Service Not Available**: Wrapper automatically falls back to CLI
2. **Import Errors**: Ensure you're in the correct directory
3. **Timeout Issues**: Reduce Monte Carlo simulations for faster results
4. **File Permission Errors**: Check output directory permissions

### Debug Mode
```python
# Enable verbose logging
predictor = F1PredictionWrapper()
predictor.logger.setLevel(logging.DEBUG)

# Check service availability
print(f"Enhanced service available: {ENHANCED_SERVICE_AVAILABLE}")
```

## 🎉 What's Next?

1. **Run the example**: `python example_usage.py`
2. **Try single predictions**: Start with one race
3. **Experiment with scenarios**: Test different weather conditions
4. **Scale up**: Move to full season predictions
5. **Integrate**: Use in your own applications

---

**🎯 The F1 Prediction Wrapper makes F1 predictions as easy as calling a function!**

No more complex CLI commands, no more manual file management, no more error handling headaches. Just clean, simple Python code that gets you the predictions you need, when you need them.

Happy predicting! 🏎️🏆
