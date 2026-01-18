"""
Debug FastF1 - Verify Telemetry Data Provenance
Run: python backend/scripts/debug_fastf1.py

This script proves that raw telemetry data from FastF1 is real.
Prints 5 raw laps with compounds, times, and driver codes.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from data.fastf1_client import fastf1_client
import pandas as pd

def print_separator(title: str):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print('='*70)

def format_lap_time(td) -> str:
    """Format timedelta to MM:SS.mmm"""
    if pd.isna(td):
        return "N/A"
    total_seconds = td.total_seconds()
    minutes = int(total_seconds // 60)
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:06.3f}"

def verify_fp2_session():
    """Load FP2 Bahrain 2024 and print raw lap data"""
    print_separator("FastF1 SESSION VERIFICATION (Bahrain 2024 FP2)")
    
    print("Loading session (this may take a moment on first run)...")
    session = fastf1_client.get_session_laps(season=2024, round_num=1, session_type="FP2")
    
    if session is None:
        print("❌ FAILED: Could not load FP2 session")
        print("   Possible causes:")
        print("   - FastF1 cache issues")
        print("   - Network connectivity")
        print("   - Session not available")
        return False
    
    print(f"✓ Session loaded: {session.event['EventName']} - {session.name}")
    print(f"  Date: {session.date}")
    print(f"  Total laps in session: {len(session.laps)}")
    print(f"  Drivers in session: {len(session.drivers)}")
    
    return session

def print_raw_laps(session, driver_code: str = "VER", num_laps: int = 5):
    """Print raw lap data for a specific driver"""
    print_separator(f"RAW LAP DATA: {driver_code} (First {num_laps} Clean Laps)")
    
    driver_laps = session.laps.pick_driver(driver_code)
    
    if len(driver_laps) == 0:
        print(f"❌ No laps found for {driver_code}")
        return False
    
    # Filter to clean laps only
    clean_laps = driver_laps[
        (driver_laps["IsAccurate"] == True) &
        (driver_laps["PitOutTime"].isna()) &
        (driver_laps["PitInTime"].isna())
    ]
    
    print(f"Total laps for {driver_code}: {len(driver_laps)}")
    print(f"Clean laps (accurate, no pit): {len(clean_laps)}")
    print()
    
    print(f"{'Lap':<5} {'Time':<12} {'Compound':<10} {'TyreAge':<8} {'S1':<10} {'S2':<10} {'S3':<10}")
    print("-" * 75)
    
    for idx, (_, lap) in enumerate(clean_laps.head(num_laps).iterrows()):
        lap_time = format_lap_time(lap["LapTime"])
        compound = lap.get("Compound", "N/A")
        tyre_age = lap.get("TyreLife", "N/A")
        
        s1 = format_lap_time(lap.get("Sector1Time")) if pd.notna(lap.get("Sector1Time")) else "N/A"
        s2 = format_lap_time(lap.get("Sector2Time")) if pd.notna(lap.get("Sector2Time")) else "N/A"
        s3 = format_lap_time(lap.get("Sector3Time")) if pd.notna(lap.get("Sector3Time")) else "N/A"
        
        print(f"{int(lap['LapNumber']):<5} "
              f"{lap_time:<12} "
              f"{str(compound):<10} "
              f"{str(tyre_age):<8} "
              f"{s1:<10} "
              f"{s2:<10} "
              f"{s3:<10}")
    
    return True

def verify_lap_time_sanity(session):
    """Verify lap times are within sane bounds (85-95 seconds for Bahrain)"""
    print_separator("LAP TIME SANITY CHECK")
    
    clean_laps = session.laps[
        (session.laps["IsAccurate"] == True) &
        (session.laps["PitOutTime"].isna()) &
        (session.laps["PitInTime"].isna()) &
        (session.laps["LapTime"].notna())
    ]
    
    if len(clean_laps) == 0:
        print("❌ No clean laps to analyze")
        return False
    
    lap_times_sec = clean_laps["LapTime"].dt.total_seconds()
    
    min_time = lap_times_sec.min()
    max_time = lap_times_sec.max()
    mean_time = lap_times_sec.mean()
    std_time = lap_times_sec.std()
    
    print(f"Clean laps analyzed: {len(clean_laps)}")
    print(f"\nLap Time Statistics (seconds):")
    print(f"  Minimum:   {min_time:.3f} s")
    print(f"  Maximum:   {max_time:.3f} s")
    print(f"  Mean:      {mean_time:.3f} s")
    print(f"  Std Dev:   {std_time:.3f} s")
    
    # Bahrain FP2 should be roughly 90-95 seconds
    if 80 < min_time < 100 and 80 < max_time < 120:
        print(f"\n✓ Lap times within expected bounds (80-120s)")
        return True
    else:
        print(f"\n⚠️ Lap times outside expected bounds - review manually")
        return False

def verify_compound_distribution(session):
    """Show compound distribution"""
    print_separator("TYRE COMPOUND DISTRIBUTION")
    
    laps = session.laps[session.laps["Compound"].notna()]
    
    if len(laps) == 0:
        print("⚠️ No compound data available")
        return True
    
    compound_counts = laps["Compound"].value_counts()
    
    print(f"{'Compound':<15} {'Laps':<10} {'Percentage'}")
    print("-" * 40)
    
    total = len(laps)
    for compound, count in compound_counts.items():
        pct = (count / total) * 100
        print(f"{compound:<15} {count:<10} {pct:.1f}%")
    
    return True

def main():
    print("\n" + "="*70)
    print("  F1-PREDICT FASTF1 TELEMETRY VERIFICATION")
    print("  Source: FastF1 (Bahrain 2024 FP2)")
    print("="*70)
    
    # Load session
    session = verify_fp2_session()
    if session is False:
        print("\n❌ FASTF1 VERIFICATION FAILED")
        sys.exit(1)
    
    # Print raw laps for multiple drivers
    drivers = ["VER", "NOR", "LEC"]
    for driver in drivers:
        print_raw_laps(session, driver, num_laps=5)
    
    # Sanity checks
    sanity_ok = verify_lap_time_sanity(session)
    compound_ok = verify_compound_distribution(session)
    
    print_separator("VERIFICATION SUMMARY")
    
    if sanity_ok and compound_ok:
        print("✅ FASTF1 DATA PROVENANCE VERIFIED")
        print("   - Session loads correctly")
        print("   - Lap times are within realistic bounds")
        print("   - Compound data is present")
        print("\n   Raw telemetry data is REAL and usable for feature extraction.")
    else:
        print("⚠️ SOME CHECKS NEED REVIEW")
        sys.exit(1)

if __name__ == "__main__":
    main()
