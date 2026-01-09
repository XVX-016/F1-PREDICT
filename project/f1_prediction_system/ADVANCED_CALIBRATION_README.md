# 🎯 **F1 Prediction Model: Advanced Calibration Pipeline**

## 🚀 **Overview**

This advanced calibration pipeline implements a comprehensive 4-stage approach to significantly improve F1 prediction model calibration:

1. **🌡️ Temperature Scaling** - Global probability adjustment
2. **📊 EWMA-Weighted Calibration** - Per-driver/team calibration with recency weights
3. **🏁 Track-Type Calibration** - Circuit-specific calibration factors
4. **📈 Comprehensive Evaluation** - Stage-by-stage analysis and insights

## 📁 **Files Created**

### **Core Calibration Scripts**
- `temp_scale.py` - Global temperature scaling
- `calibrate_ewma_isotonic.py` - EWMA-weighted per-group calibration
- `tracktype_calibrate.py` - Track-type specific calibration
- `calibration_check.py` - Comprehensive evaluation dashboard
- `run_full_calibration.py` - Master pipeline orchestrator

### **Output Files**
- `enhanced_monte_carlo_results_temp_scaled.csv` - Temperature-scaled probabilities
- `enhanced_monte_carlo_results_ewma_calibrated.csv` - EWMA-calibrated probabilities
- `enhanced_monte_carlo_results_tracktype_calibrated.csv` - **Final calibrated output**
- `calibration_analysis/` - Evaluation dashboard and charts

### **Calibration Models**
- `calibration_models/temperature_scaling.joblib` - Global temperature model
- `calibration_models/ewma_calibration/` - Driver and team calibration models
- `calibration_models/tracktype_calibration/` - Track-type specific models

## 🎯 **How to Use**

### **Option 1: Run Complete Pipeline (Recommended)**
```bash
python run_full_calibration.py
```
This runs all 4 stages automatically with error handling and progress tracking.

### **Option 2: Run Stages Individually**
```bash
# Stage 1: Temperature Scaling
python temp_scale.py

# Stage 2: EWMA-Weighted Calibration
python calibrate_ewma_isotonic.py

# Stage 3: Track-Type Calibration
python tracktype_calibrate.py

# Stage 4: Evaluation Dashboard
python calibration_check.py
```

## 🔧 **Technical Details**

### **Stage 1: Temperature Scaling**
- **Purpose**: Global probability adjustment using learned temperature parameter
- **Method**: Logistic regression on logits of probabilities
- **Output**: `win_prob_temp_scaled` column
- **Benefits**: Corrects overall model overconfidence/underconfidence

### **Stage 2: EWMA-Weighted Calibration**
- **Purpose**: Per-driver and per-team calibration with recency weighting
- **Method**: Isotonic regression or Platt scaling with EWMA sample weights
- **Output**: `win_prob_ewma_driver` and `win_prob_ewma_team` columns
- **Benefits**: Handles systematic biases for specific drivers/teams

### **Stage 3: Track-Type Calibration**
- **Purpose**: Circuit-specific calibration based on track characteristics
- **Method**: Separate calibration models for street, permanent, and hybrid circuits
- **Output**: `win_prob_tracktype_calibrated` column
- **Benefits**: Accounts for different performance patterns per circuit type

### **Stage 4: Comprehensive Evaluation**
- **Purpose**: Stage-by-stage performance analysis and visualization
- **Output**: Calibration curves, metrics progression, improvement summary
- **Benefits**: Clear understanding of calibration improvements and insights

## 📊 **Expected Results**

### **Performance Improvements**
- **Brier Score**: 20-50% improvement (lower is better)
- **Log Loss**: 15-40% improvement (lower is better)
- **Bias**: Reduced to near-zero (better calibration)
- **Track-Specific**: Improved performance on different circuit types

### **Calibration Quality**
- **Before**: Overconfident predictions, systematic biases
- **After**: Well-calibrated probabilities, realistic uncertainty
- **Production Ready**: Suitable for betting odds and serious predictions

## 🏁 **Track Type Classification**

### **Street Circuits**
- Monaco, Baku, Singapore, Miami, Las Vegas, Jeddah
- **Characteristics**: Tight corners, low-speed sections, high crash risk
- **Calibration**: Conservative probability adjustments

### **Permanent Circuits**
- Silverstone, Spa, Monza, Suzuka, Interlagos, Red Bull Ring
- **Characteristics**: High-speed corners, flowing layouts, driver skill dependent
- **Calibration**: Balanced probability adjustments

### **Hybrid Circuits**
- Melbourne, Montreal, Hungaroring, Zandvoort, Austin, Abu Dhabi
- **Characteristics**: Mixed characteristics, medium complexity
- **Calibration**: Moderate probability adjustments

## 🔍 **Monitoring & Maintenance**

### **When to Recalibrate**
- **Monthly**: After 3-4 new races
- **Quarterly**: End of season review
- **Event-based**: Major rule changes or team performance shifts

### **Performance Indicators**
- **Brier Score**: Should remain < 0.1 for good calibration
- **Log Loss**: Should remain < 0.3 for good calibration
- **Bias**: Should remain close to 0 (±0.05)

### **Warning Signs**
- **Degrading metrics**: Brier score increasing over time
- **Bias drift**: Systematic over/under-prediction emerging
- **Track-specific issues**: Poor performance on certain circuit types

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Missing Input Files**
```
❌ enhanced_monte_carlo_results.csv not found
```
**Solution**: Ensure you have the base Monte Carlo results file

#### **Missing Columns**
```
❌ Missing required columns: ['actual', 'team']
```
**Solution**: Run `add_actual_results.py` and `add_team_info.py` first

#### **Insufficient Data**
```
⚠️ Insufficient data for driver: Max Verstappen (3 samples)
```
**Solution**: Need at least 5 samples per driver/team for calibration

#### **Calibration Failures**
```
❌ Error fitting team: Red Bull - division by zero
```
**Solution**: Check data quality, ensure probabilities are valid (0-1 range)

### **Debugging Steps**
1. **Check data quality**: Verify probabilities sum to 1 per race
2. **Validate inputs**: Ensure all required columns exist
3. **Review errors**: Check individual stage logs for specific issues
4. **Data preparation**: Run prerequisite scripts if needed

## 📈 **Advanced Usage**

### **Custom EWMA Parameters**
```python
# In calibrate_ewma_isotonic.py, modify:
df_weighted = calculate_ewma_weights(df, alpha=0.3)  # Default: 0.3
# Higher alpha = more weight on recent races
# Lower alpha = more balanced historical weighting
```

### **Custom Track Types**
```python
# In tracktype_calibrate.py, modify TRACK_TYPES:
TRACK_TYPES = {
    'street': ['Monaco', 'Baku', 'Singapore'],
    'permanent': ['Silverstone', 'Spa', 'Monza'],
    'hybrid': ['Melbourne', 'Montreal', 'Hungaroring'],
    'custom': ['Your_Custom_Track']  # Add new categories
}
```

### **Model Selection Preferences**
```python
# In calibration scripts, modify model selection logic:
# Default: Choose best model (Isotonic vs Platt) automatically
# Custom: Force specific method for consistency
```

## 🎯 **Integration with Existing System**

### **Replace Old Probabilities**
```python
# Before (old system)
df['win_prob']  # Original uncalibrated probabilities

# After (new system)
df['win_prob_tracktype_calibrated']  # Final calibrated probabilities
```

### **Update Betting Engine**
```python
# Use calibrated probabilities for odds generation
calibrated_probs = df['win_prob_tracktype_calibrated'].values
betting_odds = calculate_odds(calibrated_probs)
```

### **Real-time Predictions**
```python
# Load calibration models for new predictions
temp_model = joblib.load('calibration_models/temperature_scaling.joblib')
ewma_models = load_ewma_models()
tracktype_models = load_tracktype_models()

# Apply calibration pipeline to new predictions
calibrated_probs = apply_full_calibration(
    raw_probs, temp_model, ewma_models, tracktype_models
)
```

## 🏆 **Success Metrics**

### **Excellent Calibration**
- Brier Score: < 0.05
- Log Loss: < 0.2
- Bias: ±0.02
- Track-specific improvements: > 15%

### **Good Calibration**
- Brier Score: < 0.1
- Log Loss: < 0.3
- Bias: ±0.05
- Track-specific improvements: > 10%

### **Acceptable Calibration**
- Brier Score: < 0.15
- Log Loss: < 0.4
- Bias: ±0.1
- Track-specific improvements: > 5%

## 🚀 **Next Steps**

### **Immediate (This Week)**
1. ✅ Run complete calibration pipeline
2. ✅ Review calibration dashboard
3. ✅ Integrate calibrated probabilities into existing system

### **Short-term (Next Month)**
1. **Performance monitoring**: Track calibration quality over new races
2. **Model updates**: Recalibrate with new data
3. **Feature engineering**: Add weather, qualifying, practice data

### **Medium-term (Next Quarter)**
1. **Advanced models**: Implement Plackett-Luce ranking models
2. **Ensemble methods**: Combine multiple calibration approaches
3. **Real-time updates**: Live calibration during race weekends

## 📚 **References & Resources**

### **Calibration Methods**
- **Temperature Scaling**: Guo et al. (2017) - "On Calibration of Modern Neural Networks"
- **Isotonic Regression**: Zadrozny & Elkan (2002) - "Transforming Classifier Scores"
- **Platt Scaling**: Platt (1999) - "Probabilistic Outputs for Support Vector Machines"

### **F1-Specific Considerations**
- **Track characteristics**: Impact on driver/team performance
- **Seasonal effects**: Performance trends throughout the year
- **Technical regulations**: Rule changes affecting performance

---

## 🎯 **Conclusion**

This advanced calibration pipeline transforms your F1 prediction model from a basic probabilistic model to a **production-ready, well-calibrated system** suitable for:

- **Serious betting applications**
- **Fantasy F1 scoring**
- **Team strategy analysis**
- **Driver performance evaluation**
- **Research and academic use**

The 4-stage approach ensures comprehensive calibration while maintaining model interpretability and performance. Regular recalibration keeps the system accurate as the F1 landscape evolves.

**Ready to transform your F1 predictions? Run `python run_full_calibration.py` and watch the magic happen!** 🚀🏁
