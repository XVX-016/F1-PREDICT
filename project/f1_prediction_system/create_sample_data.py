#!/usr/bin/env python3
"""
Create Sample F1 2025 Data for Demonstration
Generates realistic sample data when API is not accessible
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def create_sample_race_results():
    """Create sample 2025 race results"""
    print("🏁 Creating sample 2025 race results...")
    
    # Sample drivers and teams
    drivers = [
        "Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc",
        "George Russell", "Lewis Hamilton", "Carlos Sainz", "Fernando Alonso",
        "Lance Stroll", "Pierre Gasly", "Esteban Ocon", "Valtteri Bottas",
        "Zhou Guanyu", "Nico Hulkenberg", "Kevin Magnussen", "Yuki Tsunoda",
        "Daniel Ricciardo", "Alexander Albon", "Logan Sargeant", "Oliver Bearman"
    ]
    
    teams = [
        "McLaren", "McLaren", "Red Bull", "Ferrari", "Mercedes", "Ferrari",
        "Kick Sauber", "Aston Martin", "Aston Martin", "Alpine", "Alpine", "Kick Sauber",
        "Kick Sauber", "Haas", "Haas", "Racing Bulls", "Racing Bulls", "Williams",
        "Williams", "Ferrari"
    ]
    
    # Sample races (first 8 races of 2025)
    races = [
        "Bahrain Grand Prix", "Saudi Arabian Grand Prix", "Australian Grand Prix",
        "Japanese Grand Prix", "Chinese Grand Prix", "Miami Grand Prix",
        "Emilia Romagna Grand Prix", "Monaco Grand Prix"
    ]
    
    race_dates = [
        "2025-03-02", "2025-03-09", "2025-03-23", "2025-04-06",
        "2025-04-20", "2025-05-04", "2025-05-18", "2025-05-25"
    ]
    
    results = []
    
    for round_num, (race_name, race_date) in enumerate(zip(races, race_dates), 1):
        print(f"  Creating {race_name}...")
        
        # Generate realistic race results with McLaren dominance
        for pos in range(1, 21):
            driver_idx = pos - 1
            driver = drivers[driver_idx]
            team = teams[driver_idx]
            
            # McLaren drivers get better positions in recent races
            if team == "McLaren" and round_num >= 4:
                actual_pos = max(1, pos - 3)  # Boost McLaren performance
            else:
                actual_pos = pos
            
            # Points calculation
            if actual_pos == 1:
                points = 25
            elif actual_pos == 2:
                points = 18
            elif actual_pos == 3:
                points = 15
            elif actual_pos == 4:
                points = 12
            elif actual_pos == 5:
                points = 10
            elif actual_pos == 6:
                points = 8
            elif actual_pos == 7:
                points = 6
            elif actual_pos == 8:
                points = 4
            elif actual_pos == 9:
                points = 2
            elif actual_pos == 10:
                points = 1
            else:
                points = 0
            
            # Grid position (qualifying result)
            grid = max(1, actual_pos + np.random.randint(-2, 3))
            grid = min(20, grid)
            
            results.append({
                "round": round_num,
                "raceName": race_name,
                "circuit": race_name.replace(" Grand Prix", ""),
                "date": race_date,
                "driver": driver,
                "driverCode": driver.split()[-1][:3].upper(),
                "constructor": team,
                "grid": grid,
                "position": actual_pos,
                "points": points,
                "status": "Finished",
                "laps": 50 + np.random.randint(-5, 6),
                "time": f"{1 + actual_pos//10}:{30 + actual_pos%10:02d}:{np.random.randint(0, 60):02d}",
                "fastestLap": "1" if np.random.random() < 0.1 else ""
            })
    
    df = pd.DataFrame(results)
    df.to_csv("2025_race_results.csv", index=False)
    print(f"  ✓ Created {len(df)} race results")
    return df

def create_sample_qualifying_results():
    """Create sample 2025 qualifying results"""
    print("\n🏎️ Creating sample 2025 qualifying results...")
    
    drivers = [
        "Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc",
        "George Russell", "Lewis Hamilton", "Carlos Sainz", "Fernando Alonso",
        "Lance Stroll", "Pierre Gasly", "Esteban Ocon", "Valtteri Bottas",
        "Zhou Guanyu", "Nico Hulkenberg", "Kevin Magnussen", "Yuki Tsunoda",
        "Daniel Ricciardo", "Alexander Albon", "Logan Sargeant", "Oliver Bearman"
    ]
    
    teams = [
        "McLaren", "McLaren", "Red Bull", "Ferrari", "Mercedes", "Ferrari",
        "Kick Sauber", "Aston Martin", "Aston Martin", "Alpine", "Alpine", "Kick Sauber",
        "Kick Sauber", "Haas", "Haas", "Racing Bulls", "Racing Bulls", "Williams",
        "Williams", "Ferrari"
    ]
    
    races = [
        "Bahrain Grand Prix", "Saudi Arabian Grand Prix", "Australian Grand Prix",
        "Japanese Grand Prix", "Chinese Grand Prix", "Miami Grand Prix",
        "Emilia Romagna Grand Prix", "Monaco Grand Prix"
    ]
    
    qualis = []
    
    for round_num, race_name in enumerate(races, 1):
        print(f"  Creating qualifying for {race_name}...")
        
        # Generate qualifying results with McLaren improving over time
        for pos in range(1, 21):
            driver_idx = pos - 1
            driver = drivers[driver_idx]
            team = teams[driver_idx]
            
            # McLaren drivers get better qualifying positions in recent races
            if team == "McLaren" and round_num >= 4:
                quali_pos = max(1, pos - 2)  # Boost McLaren qualifying
            else:
                quali_pos = pos
            
            # Generate realistic Q1, Q2, Q3 times
            base_time = 90.0 + (quali_pos - 1) * 0.5  # Base time increases with position
            
            if quali_pos <= 15:  # Q2 participants
                q1_time = f"{base_time + np.random.uniform(-0.3, 0.3):.3f}"
                q2_time = f"{base_time - 1.0 + np.random.uniform(-0.2, 0.2):.3f}"
                q3_time = f"{base_time - 2.0 + np.random.uniform(-0.1, 0.1):.3f}" if quali_pos <= 10 else None
            else:  # Q1 only
                q1_time = f"{base_time + np.random.uniform(-0.3, 0.3):.3f}"
                q2_time = None
                q3_time = None
            
            qualis.append({
                "round": round_num,
                "raceName": race_name,
                "driver": driver,
                "driverCode": driver.split()[-1][:3].upper(),
                "constructor": team,
                "q1": q1_time,
                "q2": q2_time,
                "q3": q3_time,
                "qualyPosition": quali_pos
            })
    
    df = pd.DataFrame(qualis)
    df.to_csv("2025_qualifying_results.csv", index=False)
    print(f"  ✓ Created {len(df)} qualifying results")
    return df

def create_sample_driver_standings():
    """Create sample 2025 driver standings"""
    print("\n👤 Creating sample 2025 driver standings...")
    
    drivers = [
        "Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc",
        "George Russell", "Lewis Hamilton", "Carlos Sainz", "Fernando Alonso",
        "Lance Stroll", "Pierre Gasly", "Esteban Ocon", "Valtteri Bottas",
        "Zhou Guanyu", "Nico Hulkenberg", "Kevin Magnussen", "Yuki Tsunoda",
        "Daniel Ricciardo", "Alexander Albon", "Logan Sargeant", "Oliver Bearman"
    ]
    
    teams = [
        "McLaren", "McLaren", "Red Bull", "Ferrari", "Mercedes", "Ferrari",
        "Kick Sauber", "Aston Martin", "Aston Martin", "Alpine", "Alpine", "Kick Sauber",
        "Kick Sauber", "Haas", "Haas", "Racing Bulls", "Racing Bulls", "Williams",
        "Williams", "Ferrari"
    ]
    
    standings = []
    
    for i, (driver, team) in enumerate(zip(drivers, teams)):
        # McLaren drivers leading the championship
        if team == "McLaren":
            position = i + 1
            points = 200 - (i * 8)  # High points for McLaren
            wins = 3 if i == 0 else 2 if i == 1 else 0  # Norris and Piastri winning
            podiums = 6 if i <= 1 else 2
        elif team == "Ferrari":  # Hamilton and Leclerc at Ferrari
            position = i + 1
            points = 180 - (i * 7)  # High points for Ferrari
            wins = 2 if i == 2 else 1 if i == 5 else 0  # Hamilton and Leclerc winning
            podiums = 5 if i <= 2 else 2
        else:
            position = i + 1
            points = 150 - (i * 6)  # Lower points for others
            wins = 1 if i == 2 else 0  # Verstappen with 1 win
            podiums = 3 if i <= 4 else 1
        
        standings.append({
            "position": position,
            "driver": driver,
            "driverCode": driver.split()[-1][:3].upper(),
            "constructor": team,
            "points": max(0, points),
            "wins": wins,
            "podiums": podiums
        })
    
    df = pd.DataFrame(standings)
    df.to_csv("2025_driver_standings.csv", index=False)
    print(f"  ✓ Created {len(df)} driver standings")
    return df

def create_sample_constructor_standings():
    """Create sample 2025 constructor standings"""
    print("\n🏭 Creating sample 2025 constructor standings...")
    
    constructors = [
        "McLaren", "Red Bull", "Ferrari", "Mercedes", "Aston Martin",
        "Alpine", "Kick Sauber", "Haas", "Racing Bulls", "Williams"
    ]
    
    standings = []
    
    for i, constructor in enumerate(constructors):
        if constructor == "McLaren":
            position = 1
            points = 380  # Leading constructor
            wins = 5
            podiums = 12
        elif constructor == "Red Bull":
            position = 2
            points = 320
            wins = 2
            podiums = 8
        elif constructor == "Ferrari":
            position = 3
            points = 280
            wins = 1
            podiums = 6
        else:
            position = i + 1
            points = 250 - (i * 20)
            wins = 0
            podiums = max(1, 5 - i)
        
        standings.append({
            "position": position,
            "constructor": constructor,
            "points": max(0, points),
            "wins": wins,
            "podiums": podiums
        })
    
    df = pd.DataFrame(standings)
    df.to_csv("2025_constructor_standings.csv", index=False)
    print(f"  ✓ Created {len(df)} constructor standings")
    return df

def main():
    """Main function to create all sample data"""
    print("🏎️  F1 2025 Sample Data Creator")
    print("=" * 50)
    
    # Create all sample data
    race_results = create_sample_race_results()
    qualifying_results = create_sample_qualifying_results()
    driver_standings = create_sample_driver_standings()
    constructor_standings = create_sample_constructor_standings()
    
    print("\n" + "=" * 50)
    print("📊 Sample Data Summary:")
    print(f"  Race Results: {len(race_results)} records")
    print(f"  Qualifying Results: {len(qualifying_results)} records")
    print(f"  Driver Standings: {len(driver_standings)} drivers")
    print(f"  Constructor Standings: {len(constructor_standings)} teams")
    
    print("\n✅ Sample data creation complete!")
    print("\nFiles created:")
    print("  - 2025_race_results.csv")
    print("  - 2025_qualifying_results.csv")
    print("  - 2025_driver_standings.csv")
    print("  - 2025_constructor_standings.csv")
    
    print("\nNext steps:")
    print("  1. Run prepare_training_data.py")
    print("  2. Run train_model.py")
    print("  3. Run monte_carlo_simulator.py")

if __name__ == "__main__":
    main()
