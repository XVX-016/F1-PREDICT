#!/usr/bin/env python3
"""
Fetch 2025 F1 Season Data
Uses Ergast API to get race results, qualifying, and standings
"""

import requests
import pandas as pd
import json
from datetime import datetime
import time

BASE_URL = "https://ergast.com/api/f1/2025"

def fetch_race_results():
    """Fetch all 2025 race results"""
    print("Fetching 2025 race results...")
    results = []
    
    for round_num in range(1, 25):  # F1 2025 calendar max rounds
        try:
            url = f"{BASE_URL}/{round_num}/results.json"
            print(f"  Round {round_num}...", end=" ")
            
            r = requests.get(url, timeout=10)
            if r.status_code != 200:
                print("Failed")
                break
                
            data = r.json()
            if not data["MRData"]["RaceTable"]["Races"]:
                print("No data")
                break
                
            race = data["MRData"]["RaceTable"]["Races"][0]
            race_name = race["raceName"]
            race_date = race["date"]
            circuit = race.get("Circuit", {}).get("circuitName", "Unknown")
            
            for res in race["Results"]:
                results.append({
                    "round": round_num,
                    "raceName": race_name,
                    "circuit": circuit,
                    "date": race_date,
                    "driver": f"{res['Driver']['givenName']} {res['Driver']['familyName']}",
                    "driverCode": res['Driver']['code'],
                    "constructor": res["Constructor"]["name"],
                    "grid": int(res["grid"]),
                    "position": int(res["position"]),
                    "points": float(res["points"]),
                    "status": res["status"],
                    "laps": int(res.get("laps", 0)),
                    "time": res.get("Time", {}).get("time", ""),
                    "fastestLap": res.get("FastestLap", {}).get("rank", "")
                })
            
            print(f"✓ {len(race['Results'])} drivers")
            time.sleep(0.5)  # Be nice to the API
            
        except Exception as e:
            print(f"Error: {e}")
            break
    
    df = pd.DataFrame(results)
    if not df.empty:
        df.to_csv("2025_race_results.csv", index=False)
        print(f"✅ Saved {len(df)} race results to 2025_race_results.csv")
    else:
        print("❌ No race results found")
    
    return df

def fetch_qualifying_results():
    """Fetch all 2025 qualifying results"""
    print("\nFetching 2025 qualifying results...")
    qualis = []
    
    for round_num in range(1, 25):
        try:
            url = f"{BASE_URL}/{round_num}/qualifying.json"
            print(f"  Round {round_num}...", end=" ")
            
            r = requests.get(url, timeout=10)
            if r.status_code != 200:
                print("Failed")
                break
                
            data = r.json()
            if not data["MRData"]["RaceTable"]["Races"]:
                print("No data")
                break
                
            race = data["MRData"]["RaceTable"]["Races"][0]
            race_name = race["raceName"]
            
            for res in race["QualifyingResults"]:
                qualis.append({
                    "round": round_num,
                    "raceName": race_name,
                    "driver": f"{res['Driver']['givenName']} {res['Driver']['familyName']}",
                    "driverCode": res['Driver']['code'],
                    "constructor": res["Constructor"]["name"],
                    "q1": res.get("Q1"),
                    "q2": res.get("Q2"),
                    "q3": res.get("Q3"),
                    "qualyPosition": int(res["position"])
                })
            
            print(f"✓ {len(race['QualifyingResults'])} drivers")
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error: {e}")
            break
    
    df = pd.DataFrame(qualis)
    if not df.empty:
        df.to_csv("2025_qualifying_results.csv", index=False)
        print(f"✅ Saved {len(df)} qualifying results to 2025_qualifying_results.csv")
    else:
        print("❌ No qualifying results found")
    
    return df

def fetch_driver_standings():
    """Fetch current 2025 driver standings"""
    print("\nFetching 2025 driver standings...")
    
    try:
        url = f"{BASE_URL}/driverStandings.json"
        r = requests.get(url, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            standings = []
            
            for standing in data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]:
                standings.append({
                    "position": int(standing["position"]),
                    "driver": f"{standing['Driver']['givenName']} {standing['Driver']['familyName']}",
                    "driverCode": standing['Driver']['code'],
                    "constructor": standing["Constructors"][0]["name"],
                    "points": float(standing["points"]),
                    "wins": int(standing["wins"]),
                    "podiums": int(standing.get("podiums", 0))
                })
            
            df = pd.DataFrame(standings)
            df.to_csv("2025_driver_standings.csv", index=False)
            print(f"✅ Saved {len(df)} driver standings to 2025_driver_standings.csv")
            return df
        else:
            print("❌ Failed to fetch driver standings")
            return None
            
    except Exception as e:
        print(f"❌ Error fetching driver standings: {e}")
        return None

def fetch_constructor_standings():
    """Fetch current 2025 constructor standings"""
    print("\nFetching 2025 constructor standings...")
    
    try:
        url = f"{BASE_URL}/constructorStandings.json"
        r = requests.get(url, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            standings = []
            
            for standing in data["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"]:
                standings.append({
                    "position": int(standing["position"]),
                    "constructor": standing["Constructor"]["name"],
                    "points": float(standing["points"]),
                    "wins": int(standing["wins"]),
                    "podiums": int(standing.get("podiums", 0))
                })
            
            df = pd.DataFrame(standings)
            df.to_csv("2025_constructor_standings.csv", index=False)
            print(f"✅ Saved {len(df)} constructor standings to 2025_constructor_standings.csv")
            return df
        else:
            print("❌ Failed to fetch constructor standings")
            return None
            
    except Exception as e:
        print(f"❌ Error fetching constructor standings: {e}")
        return None

def main():
    """Main function to fetch all data"""
    print("🏎️  F1 2025 Data Fetcher")
    print("=" * 40)
    
    # Fetch all data
    race_df = fetch_race_results()
    quali_df = fetch_qualifying_results()
    driver_standings = fetch_driver_standings()
    constructor_standings = fetch_constructor_standings()
    
    print("\n" + "=" * 40)
    print("📊 Data Summary:")
    
    if not race_df.empty:
        print(f"  Races: {race_df['round'].nunique()}")
        print(f"  Drivers: {race_df['driver'].nunique()}")
        print(f"  Total Results: {len(race_df)}")
    
    if not quali_df.empty:
        print(f"  Qualifying Sessions: {quali_df['round'].nunique()}")
        print(f"  Total Qualifying Results: {len(quali_df)}")
    
    if driver_standings is not None:
        print(f"  Driver Standings: {len(driver_standings)} drivers")
    
    if constructor_standings is not None:
        print(f"  Constructor Standings: {len(constructor_standings)} teams")
    
    print("\n✅ Data collection complete!")
    print("Files saved:")
    print("  - 2025_race_results.csv")
    print("  - 2025_qualifying_results.csv")
    print("  - 2025_driver_standings.csv")
    print("  - 2025_constructor_standings.csv")

if __name__ == "__main__":
    main()
