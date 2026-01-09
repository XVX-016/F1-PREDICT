#!/usr/bin/env python3
"""
Stage 1 Roadmap Implementation Runner
Implements the complete Stage 1: Ranking & Pairwise Learning pipeline
"""

import pandas as pd
import numpy as np
import subprocess
import sys
import time
from pathlib import Path
import json

# Stage 1 components
STAGE1_SCRIPTS = [
    "build_pairwise_dataset.py",
    "fit_bt_model.py", 
    "pl_sample_and_backtest.py"
]

# Output directories
OUTPUT_DIRS = [
    "bradley_terry_models",
    "plackett_luce_models"
]

def print_stage_header(stage_name, description):
    """Print formatted stage header"""
    print("\n" + "="*80)
    print(f"🚀 STAGE 1: {stage_name}")
    print("="*80)
    print(description)
    print("-"*80)

def check_prerequisites():
    """Check if required files exist before running Stage 1"""
    print("Checking prerequisites for Stage 1 implementation...")
    
    required_files = [
        "2025_race_results.csv",
        "2025_qualifying_results.csv", 
        "driver_statistics.csv",
        "driver_track_baselines.csv"
    ]
    
    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        print("Please ensure all required data files are present before running Stage 1.")
        return False
    
    print("✅ All prerequisites satisfied")
    return True

def run_script(script_name, description):
    """Run a Python script and handle errors"""
    print(f"\n📋 Running: {script_name}")
    print(f"   Purpose: {description}")
    
    try:
        start_time = time.time()
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, check=True)
        
        execution_time = time.time() - start_time
        print(f"✅ {script_name} completed successfully in {execution_time:.1f}s")
        
        # Print any important output
        if result.stdout:
            lines = result.stdout.strip().split('\n')
            for line in lines[-5:]:  # Last 5 lines
                if line.strip():
                    print(f"   {line}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ {script_name} failed with exit code {e.returncode}")
        if e.stdout:
            print("STDOUT:")
            print(e.stdout)
        if e.stderr:
            print("STDERR:")
            print(e.stderr)
        return False
    except Exception as e:
        print(f"❌ Unexpected error running {script_name}: {e}")
        return False

def create_stage1_summary():
    """Create a comprehensive summary of Stage 1 implementation"""
    print("\n📊 Creating Stage 1 implementation summary...")
    
    summary = {
        "stage": "Stage 1: Ranking & Pairwise Learning",
        "implementation_date": pd.Timestamp.now().isoformat(),
        "components": {
            "sequential_sampling": {
                "status": "implemented",
                "file": "sequential_sampling_simulator.py",
                "description": "Sequential Sampling with Exclusion for ranked outcomes"
            },
            "bradley_terry": {
                "status": "implemented", 
                "file": "fit_bt_model.py",
                "description": "Bradley-Terry pairwise comparison model"
            },
            "plackett_luce": {
                "status": "implemented",
                "file": "pl_sample_and_backtest.py", 
                "description": "Plackett-Luce full ranking model"
            }
        },
        "outputs": {
            "pairwise_dataset": "pairwise_comparisons.csv",
            "bt_model": "bradley_terry_models/bt_model.joblib",
            "pl_model": "plackett_luce_models/pl_model.joblib"
        },
        "next_steps": [
            "Stage 2: Hierarchical Bayesian Ranking",
            "Stage 3: Rare-event & Event Modeling", 
            "Stage 4: Ensemble & Market Integration",
            "Stage 5: Productionize & Monitoring"
        ]
    }
    
    # Save summary
    with open("STAGE1_IMPLEMENTATION_SUMMARY.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("✅ Stage 1 summary saved to: STAGE1_IMPLEMENTATION_SUMMARY.json")
    return summary

def validate_stage1_outputs():
    """Validate that Stage 1 outputs were created successfully"""
    print("\n🔍 Validating Stage 1 outputs...")
    
    expected_outputs = [
        "pairwise_comparisons.csv",
        "bradley_terry_models/bt_model.joblib",
        "bradley_terry_models/driver_rankings.csv",
        "plackett_luce_models/pl_model.joblib",
        "plackett_luce_models/backtest_results.csv"
    ]
    
    validation_results = {}
    all_valid = True
    
    for output in expected_outputs:
        if Path(output).exists():
            file_size = Path(output).stat().st_size
            validation_results[output] = {
                "status": "✅ exists",
                "size_bytes": file_size,
                "size_mb": file_size / (1024 * 1024)
            }
        else:
            validation_results[output] = {"status": "❌ missing"}
            all_valid = False
    
    # Print validation results
    for output, result in validation_results.items():
        if "exists" in result["status"]:
            print(f"  {result['status']} {output} ({result['size_mb']:.2f} MB)")
        else:
            print(f"  {result['status']} {output}")
    
    if all_valid:
        print("✅ All Stage 1 outputs validated successfully")
    else:
        print("❌ Some Stage 1 outputs are missing")
    
    return all_valid, validation_results

def print_next_steps():
    """Print next steps for the roadmap"""
    print("\n🎯 Stage 1 Implementation Complete!")
    print("="*60)
    
    print("\n📋 What was implemented:")
    print("  • Sequential Sampling with Exclusion simulator")
    print("  • Bradley-Terry pairwise comparison model")
    print("  • Plackett-Luce full ranking model")
    print("  • Comprehensive backtesting and validation")
    
    print("\n🚀 Next roadmap stages:")
    print("  • Stage 2: Hierarchical Bayesian Ranking")
    print("  • Stage 3: Rare-event & Event Modeling (DNF, Safety Car, Weather)")
    print("  • Stage 4: Ensemble & Market Integration")
    print("  • Stage 5: Productionize & Monitoring")
    
    print("\n💡 Key improvements achieved:")
    print("  • Moved from independent probabilities to ranked outcomes")
    print("  • Implemented proper pairwise learning framework")
    print("  • Added full race order simulation capabilities")
    print("  • Established foundation for advanced ranking models")

def main():
    """Main Stage 1 implementation pipeline"""
    print("🏁 F1 Prediction System - Stage 1 Roadmap Implementation")
    print("="*80)
    print("Implementing: Ranking & Pairwise Learning (Bradley-Terry / Plackett-Luce)")
    print("="*80)
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites not met. Please resolve missing files before continuing.")
        return False
    
    # Stage 1.1: Build Pairwise Dataset
    print_stage_header("1.1", "Building Pairwise Comparison Dataset")
    print("Converting race results into head-to-head driver comparisons for Bradley-Terry model training")
    
    if not run_script("build_pairwise_dataset.py", "Create pairwise driver comparison dataset"):
        print("❌ Failed to build pairwise dataset. Stopping Stage 1.")
        return False
    
    # Stage 1.2: Fit Bradley-Terry Model
    print_stage_header("1.2", "Fitting Bradley-Terry Model")
    print("Training pairwise comparison model with regularization and cross-validation")
    
    if not run_script("fit_bt_model.py", "Fit Bradley-Terry model for driver rankings"):
        print("❌ Failed to fit Bradley-Terry model. Stopping Stage 1.")
        return False
    
    # Stage 1.3: Implement Plackett-Luce Model
    print_stage_header("1.3", "Implementing Plackett-Luce Model")
    print("Building full ranking model with sampling and backtesting capabilities")
    
    if not run_script("pl_sample_and_backtest.py", "Implement Plackett-Luce ranking model"):
        print("❌ Failed to implement Plackett-Luce model. Stopping Stage 1.")
        return False
    
    # Validate outputs
    outputs_valid, validation_results = validate_stage1_outputs()
    
    # Create summary
    summary = create_stage1_summary()
    
    # Print next steps
    print_next_steps()
    
    if outputs_valid:
        print("\n🎉 Stage 1 implementation completed successfully!")
        return True
    else:
        print("\n⚠️ Stage 1 completed with some missing outputs. Please check validation results.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
