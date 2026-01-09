#!/usr/bin/env python3
"""F1 Prediction Model: Master Calibration Pipeline"""
import subprocess
import sys
import time
from pathlib import Path
import os

def run_script(script_name, description):
    """Run a Python script and handle errors"""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, check=True)
        print(result.stdout)
        if result.stderr:
            print(f"⚠️  Warnings/Info: {result.stderr}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running {script_name}:")
        print(f"  Exit code: {e.returncode}")
        print(f"  Error output: {e.stderr}")
        print(f"  Standard output: {e.stdout}")
        return False
    except FileNotFoundError:
        print(f"❌ Script not found: {script_name}")
        return False

def check_prerequisites():
    """Check if required files exist"""
    print("🔍 Checking prerequisites...")
    
    required_files = [
        "enhanced_monte_carlo_results.csv",
        "temp_scale.py",
        "calibrate_ewma_isotonic.py", 
        "tracktype_calibrate.py",
        "calibration_check.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return False
    
    print("✅ All required files found")
    return True

def print_pipeline_summary():
    """Print summary of the calibration pipeline"""
    print("\n" + "="*80)
    print("🎯 F1 PREDICTION MODEL: COMPLETE CALIBRATION PIPELINE")
    print("="*80)
    print("""
This pipeline implements a comprehensive 4-stage calibration approach:

1. 🌡️  TEMPERATURE SCALING (Global)
   - Applies global temperature scaling to all probabilities
   - Learns optimal temperature parameter using logistic regression
   - Output: enhanced_monte_carlo_results_temp_scaled.csv

2. 📊 EWMA-WEIGHTED CALIBRATION (Per-Group)
   - Per-driver isotonic/Platt calibration with EWMA weights
   - Per-team calibration with recency-weighted samples
   - Output: enhanced_monte_carlo_results_ewma_calibrated.csv

3. 🏁 TRACK-TYPE CALIBRATION (Circuit-Specific)
   - Street, permanent, and hybrid circuit calibration
   - Different calibration factors per track characteristics
   - Output: enhanced_monte_carlo_results_tracktype_calibrated.csv

4. 📈 COMPREHENSIVE EVALUATION
   - Stage-by-stage metrics comparison
   - Calibration curves and progression charts
   - Improvement summary and insights
   - Output: calibration_analysis/ directory

Expected Results:
- Significantly improved Brier Score and Log Loss
- Better calibrated probabilities for betting and prediction
- Track-specific performance insights
- Production-ready calibrated model
""")

def main():
    """Main calibration pipeline"""
    print("F1 Prediction Model: Master Calibration Pipeline")
    print("=" * 70)
    
    # Check prerequisites
    if not check_prerequisites():
        print("❌ Prerequisites not met. Exiting.")
        return
    
    # Print pipeline summary
    print_pipeline_summary()
    
    # Ask for confirmation
    response = input("\n🤔 Proceed with full calibration pipeline? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("❌ Calibration pipeline cancelled.")
        return
    
    print("\n🚀 Starting calibration pipeline...")
    start_time = time.time()
    
    # Stage 1: Temperature Scaling
    if not run_script("temp_scale.py", "Stage 1: Global Temperature Scaling"):
        print("❌ Temperature scaling failed. Stopping pipeline.")
        return
    
    # Stage 2: EWMA-Weighted Calibration
    if not run_script("calibrate_ewma_isotonic.py", "Stage 2: EWMA-Weighted Per-Group Calibration"):
        print("❌ EWMA calibration failed. Stopping pipeline.")
        return
    
    # Stage 3: Track-Type Calibration
    if not run_script("tracktype_calibrate.py", "Stage 3: Track-Type Specific Calibration"):
        print("❌ Track-type calibration failed. Stopping pipeline.")
        return
    
    # Stage 4: Comprehensive Evaluation
    if not run_script("calibration_check.py", "Stage 4: Comprehensive Calibration Evaluation"):
        print("❌ Calibration evaluation failed.")
        print("⚠️  Pipeline completed but evaluation failed.")
    else:
        print("✅ All calibration stages completed successfully!")
    
    # Calculate total time
    total_time = time.time() - start_time
    print(f"\n⏱️  Total pipeline time: {total_time:.1f} seconds")
    
    # Final summary
    print("\n" + "="*80)
    print("🎯 CALIBRATION PIPELINE COMPLETED")
    print("="*80)
    print("""
📁 Generated Files:
- enhanced_monte_carlo_results_temp_scaled.csv
- enhanced_monte_carlo_results_ewma_calibrated.csv  
- enhanced_monte_carlo_results_tracktype_calibrated.csv
- calibration_analysis/ (evaluation dashboard)

🔧 Calibration Models:
- calibration_models/temperature_scaling.joblib
- calibration_models/ewma_calibration/ (driver & team models)
- calibration_models/tracktype_calibration/ (track-type models)

📊 Metrics & Analysis:
- calibration_models/*_metrics.json
- calibration_analysis/calibration_progress_dashboard.png

🚀 Next Steps:
1. Review calibration_analysis/ dashboard
2. Use enhanced_monte_carlo_results_tracktype_calibrated.csv for predictions
3. Monitor performance with new race data
4. Recalibrate periodically (monthly/quarterly)
""")
    
    # Check if final output exists
    final_output = "enhanced_monte_carlo_results_tracktype_calibrated.csv"
    if Path(final_output).exists():
        print(f"\n✅ Final calibrated output ready: {final_output}")
        print("🎯 Your F1 prediction model is now production-ready with advanced calibration!")
    else:
        print(f"\n⚠️  Final output not found: {final_output}")
        print("🔍 Check the pipeline logs for any errors.")

if __name__ == "__main__":
    main()
