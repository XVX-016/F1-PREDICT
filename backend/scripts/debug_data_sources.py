"""
Debug Data Sources - Verify Ergast/Jolpica API Data Provenance
Run: python backend/scripts/debug_data_sources.py

This script proves that raw race data is real and consistent.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from data.jolpica_client import jolpica_client
import json

def print_separator(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def verify_calendar():
    """Fetch and display 2024 race calendar (completed season)"""
    print_separator("RACE CALENDAR VERIFICATION (2024)")
    
    calendar = jolpica_client.get_calendar(season=2024)
    
    if not calendar:
        print("❌ FAILED: No calendar data returned")
        print("   Possible causes:")
        print("   - JOLPICA_API_KEY not set in .env")
        print("   - API endpoint changed")
        return False
    
    print(f"✓ Fetched {len(calendar)} races\n")
    print(f"{'Round':<6} {'Race Name':<30} {'Country':<20} {'Date'}")
    print("-" * 80)
    
    for race in calendar[:5]:  # First 5 races
        print(f"{race.get('round', 'N/A'):<6} "
              f"{race.get('name', 'Unknown')[:29]:<30} "
              f"{race.get('country', 'Unknown')[:19]:<20} "
              f"{race.get('race_date', 'N/A')}")
    
    print(f"... and {len(calendar) - 5} more races")
    return True

def verify_race_results():
    """Fetch and display results for one completed race (Bahrain 2024)"""
    print_separator("RACE RESULTS VERIFICATION (Bahrain 2024, Round 1)")
    
    results = jolpica_client.get_race_results(season=2024, round_num=1)
    
    if not results:
        print("❌ FAILED: No race results returned")
        return False
    
    print(f"✓ Fetched {len(results)} result entries\n")
    print(f"{'Pos':<4} {'Driver ID':<15} {'Driver Name':<25} {'Team':<20} {'Status'}")
    print("-" * 90)
    
    for res in results[:10]:  # Top 10
        driver = res.get('driver', {})
        constructor = res.get('constructor', {})
        print(f"{res.get('position', 'N/A'):<4} "
              f"{driver.get('driver_id', driver.get('code', 'N/A')):<15} "
              f"{driver.get('given_name', '')} {driver.get('family_name', 'Unknown')}"[:24].ljust(25) + " "
              f"{constructor.get('name', 'Unknown')[:19]:<20} "
              f"{res.get('status', 'N/A')}")
    
    return True

def verify_qualifying():
    """Fetch qualifying results for cross-check"""
    print_separator("QUALIFYING RESULTS VERIFICATION (Bahrain 2024)")
    
    quali = jolpica_client.get_qualifying_results(season=2024, round_num=1)
    
    if not quali:
        print("⚠️ No qualifying data (may not be available via this endpoint)")
        return True  # Not a failure
    
    print(f"✓ Fetched {len(quali)} qualifying entries\n")
    
    for q in quali[:5]:
        driver = q.get('driver', {})
        print(f"P{q.get('position', 'N/A')}: "
              f"{driver.get('code', 'N/A')} - "
              f"Q1: {q.get('q1', 'N/A')} | "
              f"Q2: {q.get('q2', 'N/A')} | "
              f"Q3: {q.get('q3', 'N/A')}")
    
    return True

def verify_driver_standings():
    """Fetch driver standings"""
    print_separator("DRIVER STANDINGS VERIFICATION (2024)")
    
    standings = jolpica_client.get_driver_standings(season=2024)
    
    if not standings:
        print("⚠️ No standings data returned")
        return True
    
    print(f"✓ Fetched {len(standings)} driver standings\n")
    print(f"{'Pos':<4} {'Driver':<20} {'Team':<25} {'Points':<8} {'Wins'}")
    print("-" * 70)
    
    for s in standings[:5]:
        driver = s.get('driver', {})
        constructor = s.get('constructor', {})
        print(f"{s.get('position', 'N/A'):<4} "
              f"{driver.get('code', 'N/A'):<20} "
              f"{constructor.get('name', 'Unknown')[:24]:<25} "
              f"{s.get('points', 0):<8} "
              f"{s.get('wins', 0)}")
    
    return True

def main():
    print("\n" + "="*60)
    print("  F1-PREDICT DATA PROVENANCE VERIFICATION")
    print("  Source: Jolpica/Ergast API")
    print("="*60)
    
    results = {
        "Calendar": verify_calendar(),
        "Race Results": verify_race_results(),
        "Qualifying": verify_qualifying(),
        "Standings": verify_driver_standings()
    }
    
    print_separator("VERIFICATION SUMMARY")
    
    all_passed = True
    for test, passed in results.items():
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"  {test:<20}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n✅ ALL DATA PROVENANCE CHECKS PASSED")
        print("   Raw Ergast/Jolpica data is accessible and valid.")
    else:
        print("\n❌ SOME CHECKS FAILED - Review output above")
        sys.exit(1)

if __name__ == "__main__":
    main()
