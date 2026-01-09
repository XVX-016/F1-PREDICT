import requests
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configuration
JOLPICA_API_KEY = os.getenv("JOLPICA_API_KEY", "")  # Set via environment variable
JOLPICA_BASE_URL = "https://api.jolpica.com/f1"
ERGAST_BASE_URL = "http://ergast.com/api/f1"

class F1DataService:
    """Service for fetching live F1 data from multiple APIs"""
    
    def __init__(self):
        self.jolpica_available = bool(JOLPICA_API_KEY)
        if self.jolpica_available:
            logger.info(" Jolpica API configured - using live 2024/2025 data")
        else:
            logger.info(" Jolpica API key not found - using Ergast API (historical data only)")
    
    def get_entry_list_for_gp(self, circuit: str, season: int = 2025) -> List[Dict[str, Any]]:
        """
        Fetch official entry list (grid) for a GP using live F1 APIs.
        Includes drivers, teams, qualifying positions, season points.
        
        Args:
            circuit: Circuit name (e.g., "Monza", "Silverstone")
            season: F1 season year (default: 2025)
            
        Returns:
            List of driver entries with qualifying positions and season points
        """
        try:
            if self.jolpica_available and season >= 2024:
                return self._get_jolpica_entry_list(circuit, season)
            else:
                return self._get_ergast_entry_list(circuit, season)
        except Exception as e:
            logger.error(f"Failed to fetch entry list for {circuit} {season}: {e}")
            return self._get_fallback_entry_list()
    
    def _get_jolpica_entry_list(self, circuit: str, season: int) -> List[Dict[str, Any]]:
        """Fetch entry list from Jolpica API (current season)"""
        headers = {"Authorization": f"Bearer {JOLPICA_API_KEY}"}
        
        # 1. Get race info (round id)
        race_url = f"{JOLPICA_BASE_URL}/races"
        race_params = {"season": season, "name": circuit}
        race_resp = requests.get(race_url, headers=headers, params=race_params, timeout=10)
        race_resp.raise_for_status()
        
        race_data = race_resp.json()
        if not race_data.get("data"):
            raise ValueError(f"No race found for {circuit} in {season}")
        
        race = race_data["data"][0]
        round_id = race["round"]
        
        # 2. Get qualifying results for this round
        qual_url = f"{JOLPICA_BASE_URL}/qualifying"
        qual_params = {"season": season, "round": round_id}
        qual_resp = requests.get(qual_url, headers=headers, params=qual_params, timeout=10)
        qual_resp.raise_for_status()
        
        qualifying = qual_resp.json()["data"]
        
        # 3. Get season driver standings (points)
        standings_url = f"{JOLPICA_BASE_URL}/driverStandings"
        standings_params = {"season": season}
        standings_resp = requests.get(standings_url, headers=headers, params=standings_params, timeout=10)
        standings_resp.raise_for_status()
        
        standings_data = standings_resp.json()["data"]
        standings = {row["driver"]["name"]: float(row["points"]) for row in standings_data}
        
        # 4. Merge into entry list
        entry_list = []
        for q in qualifying:
            driver = q["driver"]["name"]
            team = q["constructor"]["name"]
            pos = int(q["position"]) if q["position"] else 20  # Default to last if no position
            points = standings.get(driver, 0.0)
            
            entry_list.append({
                "driver": driver,
                "team": team,
                "qualifying_position": pos,
                "season_points": points,
                "driver_code": q["driver"].get("code", ""),
                "constructor_id": q["constructor"].get("constructorId", "")
            })
        
        # Sort by qualifying position
        entry_list.sort(key=lambda x: x["qualifying_position"])
        logger.info(f" Fetched {len(entry_list)} drivers from Jolpica API for {circuit}")
        return entry_list
    
    def _get_ergast_entry_list(self, circuit: str, season: int) -> List[Dict[str, Any]]:
        """Fetch entry list from local data or Ergast API (historical data)"""
        try:
            # Try to load from local drivers file first
            drivers_file = "drivers_2025.json"
            if os.path.exists(drivers_file):
                with open(drivers_file, 'r') as f:
                    import json
                    data = json.load(f)
                    drivers = data.get("drivers", [])
                
                # Convert to entry list format
                entry_list = []
                for i, driver in enumerate(drivers):
                    entry_list.append({
                        "driver": driver["name"],
                        "team": driver["team"],
                        "qualifying_position": i + 1,  # Default positions
                        "season_points": 0.0,  # Default points
                        "driver_code": driver["driverId"],
                        "constructor_id": driver["team"].replace(" ", "_").lower()
                    })
                
                logger.info(f" Loaded {len(entry_list)} drivers from local file for {circuit}")
                return entry_list
            
            # Fallback to API call
            url = f"{ERGAST_BASE_URL}/{season}/drivers.json"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if "MRData" not in data or "DriverTable" not in data["MRData"]:
                raise ValueError("Invalid API response format")
            
            drivers = data["MRData"]["DriverTable"]["Drivers"]
            entry_list = []
            
            for i, driver in enumerate(drivers):
                entry_list.append({
                    "driver": f"{driver['givenName']} {driver['familyName']}",
                    "team": driver.get("constructorId", "Unknown"),
                    "qualifying_position": i + 1,
                    "season_points": 0.0,
                    "driver_code": driver.get("code", ""),
                    "constructor_id": driver.get("constructorId", "")
                })
            
            logger.info(f" Fetched {len(entry_list)} drivers from Ergast API for {circuit}")
            return entry_list
            
        except Exception as e:
            logger.error(f"Failed to fetch from Ergast API: {e}")
            return self._get_fallback_entry_list()
    
    def _get_fallback_entry_list(self) -> List[Dict[str, Any]]:
        """Fallback entry list with current 2025 drivers when API fails"""
        fallback_drivers = [
            {"driver": "Max Verstappen", "team": "Red Bull Racing", "qualifying_position": 1, "season_points": 0.0},
            {"driver": "Charles Leclerc", "team": "Ferrari", "qualifying_position": 2, "season_points": 0.0},
            {"driver": "Lando Norris", "team": "McLaren", "qualifying_position": 3, "season_points": 0.0},
            {"driver": "Lewis Hamilton", "team": "Ferrari", "qualifying_position": 4, "season_points": 0.0},
            {"driver": "George Russell", "team": "Mercedes", "qualifying_position": 5, "season_points": 0.0},
            {"driver": "Oscar Piastri", "team": "McLaren", "qualifying_position": 6, "season_points": 0.0},
            {"driver": "Carlos Sainz", "team": "Williams", "qualifying_position": 7, "season_points": 0.0},
            {"driver": "Fernando Alonso", "team": "Aston Martin", "qualifying_position": 8, "season_points": 0.0},
            {"driver": "Lance Stroll", "team": "Aston Martin", "qualifying_position": 9, "season_points": 0.0},
            {"driver": "Pierre Gasly", "team": "Alpine", "qualifying_position": 10, "season_points": 0.0},
            {"driver": "Esteban Ocon", "team": "Haas", "qualifying_position": 11, "season_points": 0.0},
            {"driver": "Yuki Tsunoda", "team": "Red Bull Racing", "qualifying_position": 12, "season_points": 0.0},
            {"driver": "Nico Hulkenberg", "team": "Sauber", "qualifying_position": 13, "season_points": 0.0},
            {"driver": "Alex Albon", "team": "Williams", "qualifying_position": 14, "season_points": 0.0},
            {"driver": "Andrea Kimi Antonelli", "team": "Mercedes", "qualifying_position": 15, "season_points": 0.0},
            {"driver": "Oliver Bearman", "team": "Haas", "qualifying_position": 16, "season_points": 0.0},
            {"driver": "Franco Colapinto", "team": "Alpine", "qualifying_position": 17, "season_points": 0.0},
            {"driver": "Liam Lawson", "team": "Racing Bulls", "qualifying_position": 18, "season_points": 0.0},
            {"driver": "Isack Hadjar", "team": "Racing Bulls", "qualifying_position": 19, "season_points": 0.0},
            {"driver": "Gabriel Bortoleto", "team": "Sauber", "qualifying_position": 20, "season_points": 0.0}
        ]
        logger.warning(" Using fallback driver list - API data unavailable")
        return fallback_drivers
    
    def get_next_race(self, season: int = 2025) -> Optional[Dict[str, Any]]:
        """
        Get information about the next upcoming race
        
        Args:
            season: F1 season year (default: 2025)
            
        Returns:
            Race information or None if no upcoming race found
        """
        try:
            if self.jolpica_available and season >= 2024:
                return self._get_jolpica_next_race(season)
            else:
                return self._get_ergast_next_race(season)
        except Exception as e:
            logger.error(f"Failed to fetch next race for {season}: {e}")
            return None
    
    def _get_jolpica_next_race(self, season: int) -> Optional[Dict[str, Any]]:
        """Get next race from Jolpica API"""
        headers = {"Authorization": f"Bearer {JOLPICA_API_KEY}"}
        
        # Get all races for the season
        races_url = f"{JOLPICA_BASE_URL}/races"
        races_params = {"season": season}
        races_resp = requests.get(races_url, headers=headers, params=races_params, timeout=10)
        races_resp.raise_for_status()
        
        races = races_resp.json()["data"]
        current_date = datetime.now()
        
        # Find the next race
        for race in races:
            race_date = datetime.fromisoformat(race["date"].replace('Z', '+00:00'))
            if race_date > current_date:
                return {
                    "name": race["raceName"],
                    "circuit": race["Circuit"]["circuitName"],
                    "date": race["date"],
                    "round": race["round"],
                    "country": race["Circuit"]["Location"]["country"]
                }
        
        return None
    
    def _get_ergast_next_race(self, season: int) -> Optional[Dict[str, Any]]:
        """Get next race from Ergast API"""
        races_url = f"{ERGAST_BASE_URL}/{season}.json"
        races_resp = requests.get(races_url, timeout=10)
        races_resp.raise_for_status()
        
        races = races_resp.json()["MRData"]["RaceTable"]["Races"]
        current_date = datetime.now()
        
        for race in races:
            race_date = datetime.fromisoformat(race["date"])
            if race_date > current_date:
                return {
                    "name": race["raceName"],
                    "circuit": race["Circuit"]["circuitName"],
                    "date": race["date"],
                    "round": race["round"],
                    "country": race["Circuit"]["Location"]["country"]
                }
        
        return None

# Global instance
f1_data_service = F1DataService()

