"""
Debug Features - Verify Feature Extraction Produces Sane Values
Run: python backend/scripts/debug_features.py

This is the CRITICAL verification script that answers:
"Can I eyeball these features and say they make sense?"

If these don't make sense → STOP. No ML until this passes.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from data.fastf1_client import fastf1_client
from features.build_telemetry_features import extract_telemetry_features
import numpy as np
import pandas as pd

def print_separator(title: str):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print('='*70)

def print_feature_vector(driver_code: str, features: dict, grid_position: int = None):
    """Print a single driver's feature vector with UNITS"""
    print(f"\n┌{'─'*50}┐")
    print(f"│  DRIVER: {driver_code:<40}│")
    print(f"├{'─'*50}┤")
    
    # Feature explanations with units
    feature_docs = {
        "avg_long_run_pace_ms": ("Average Long Run Pace", "ms", "Expected: 85,000-95,000 ms (1:25-1:35)"),
        "tire_deg_rate": ("Tyre Degradation Rate", "ms/lap", "Expected: 10-100 ms/lap"),
        "sector_consistency": ("Sector Consistency (Std Dev)", "ms", "Expected: 100-500 ms"),
        "clean_air_delta": ("Clean Air Delta", "ms", "Negative = faster in clean air"),
    }
    
    for key, value in features.items():
        if key in feature_docs:
            name, unit, note = feature_docs[key]
            formatted_value = f"{value:,.2f}" if isinstance(value, float) else str(value)
            print(f"│  {name:<30}                    │")
            print(f"│    Value: {formatted_value:>15} {unit:<10}           │")
            print(f"│    {note:<48}│")
            print(f"│{'─'*50}│")
    
    # Add derived context
    if "avg_long_run_pace_ms" in features:
        pace_sec = features["avg_long_run_pace_ms"] / 1000
        minutes = int(pace_sec // 60)
        seconds = pace_sec % 60
        print(f"│  Pace as time: {minutes}:{seconds:05.2f} (MM:SS.ss){'':>20}│")
    
    if grid_position:
        print(f"│  Grid Position: P{grid_position:<42}│")
    
    print(f"└{'─'*50}┘")

def verify_feature_sanity(features: dict, driver_code: str) -> dict:
    """Check if features are within expected bounds"""
    checks = {}
    
    # Avg pace should be 80-100 seconds (80,000-100,000 ms)
    if "avg_long_run_pace_ms" in features:
        pace = features["avg_long_run_pace_ms"]
        checks["avg_pace_sane"] = 80000 < pace < 100000
        if not checks["avg_pace_sane"]:
            print(f"  ⚠️ {driver_code}: Pace {pace:.0f}ms outside expected range (80-100s)")
    
    # Deg rate should be 10-200 ms/lap
    if "tire_deg_rate" in features:
        deg = features["tire_deg_rate"]
        checks["deg_rate_sane"] = -50 < deg < 200  # Can be slightly negative with fuel burn
        if not checks["deg_rate_sane"]:
            print(f"  ⚠️ {driver_code}: Deg rate {deg:.2f}ms/lap outside expected range")
    
    # Sector consistency should be 100-2000 ms std
    if "sector_consistency" in features:
        cons = features["sector_consistency"]
        checks["consistency_sane"] = 0 < cons < 5000
        if not checks["consistency_sane"]:
            print(f"  ⚠️ {driver_code}: Consistency {cons:.2f}ms outside expected range")
    
    return checks

def extract_features_for_driver(season: int, round_num: int, driver_code: str) -> dict:
    """Extract features for a single driver"""
    features = extract_telemetry_features(season, round_num, driver_code)
    return features

def main():
    print("\n" + "="*70)
    print("  F1-PREDICT FEATURE EXTRACTION VERIFICATION")
    print("  If these features don't make sense, ML is INVALID")
    print("="*70)
    
    # Configuration
    SEASON = 2024
    ROUND = 1  # Bahrain
    DRIVERS = ["VER", "NOR", "LEC", "HAM", "SAI"]
    
    print(f"\nExtracting features for {SEASON} Round {ROUND}...")
    print(f"Drivers: {', '.join(DRIVERS)}")
    
    all_features = {}
    all_checks = {}
    
    for driver in DRIVERS:
        print(f"\nProcessing {driver}...", end=" ")
        features = extract_features_for_driver(SEASON, ROUND, driver)
        
        if features:
            print("✓")
            all_features[driver] = features
            print_feature_vector(driver, features)
            all_checks[driver] = verify_feature_sanity(features, driver)
        else:
            print("❌ No features extracted")
            all_features[driver] = None
    
    # Summary statistics across drivers
    print_separator("CROSS-DRIVER COMPARISON")
    
    valid_features = {k: v for k, v in all_features.items() if v is not None}
    
    if len(valid_features) < 2:
        print("❌ Not enough drivers with valid features for comparison")
        sys.exit(1)
    
    # Build comparison table
    print(f"\n{'Driver':<8} {'Avg Pace (ms)':<15} {'Deg Rate':<12} {'Consistency':<12} {'Clean Δ':<10}")
    print("-" * 60)
    
    for driver, feat in valid_features.items():
        print(f"{driver:<8} "
              f"{feat.get('avg_long_run_pace_ms', 0):>12,.0f}   "
              f"{feat.get('tire_deg_rate', 0):>10.2f}   "
              f"{feat.get('sector_consistency', 0):>10.1f}   "
              f"{feat.get('clean_air_delta', 0):>8.1f}")
    
    # Pace ranking (should match roughly to grid order)
    print_separator("PACE RANKING (Fastest to Slowest)")
    
    sorted_by_pace = sorted(valid_features.items(), key=lambda x: x[1].get('avg_long_run_pace_ms', float('inf')))
    
    for rank, (driver, feat) in enumerate(sorted_by_pace, 1):
        pace_sec = feat['avg_long_run_pace_ms'] / 1000
        delta_to_leader = (feat['avg_long_run_pace_ms'] - sorted_by_pace[0][1]['avg_long_run_pace_ms']) / 1000
        print(f"  P{rank}: {driver} - {pace_sec:.3f}s (+{delta_to_leader:.3f}s)")
    
    # Final verdict
    print_separator("VERIFICATION SUMMARY")
    
    total_drivers = len(DRIVERS)
    valid_count = len(valid_features)
    
    # Check all sanity tests passed
    all_sane = all(
        all(checks.values()) 
        for checks in all_checks.values() 
        if checks
    )
    
    print(f"  Drivers processed: {total_drivers}")
    print(f"  Features extracted: {valid_count}")
    print(f"  Sanity checks: {'✓ ALL PASSED' if all_sane else '⚠️ SOME FAILED'}")
    
    if valid_count == total_drivers and all_sane:
        print("\n✅ FEATURE EXTRACTION VERIFIED")
        print("   Features are human-readable and within expected bounds.")
        print("   ML training can proceed with real telemetry data.")
    elif valid_count > 0:
        print("\n⚠️ PARTIAL SUCCESS")
        print("   Some features extracted but review warnings above.")
    else:
        print("\n❌ FEATURE EXTRACTION FAILED")
        print("   Cannot proceed with ML training.")
        sys.exit(1)

if __name__ == "__main__":
    main()
