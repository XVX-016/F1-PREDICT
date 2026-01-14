"""
Result Service for F1 Intelligence
Manages race results - fetching, storing, and providing results for strategy analysis
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json
import os
import sys
import requests

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

class ResultService:
    """
    Service for managing F1 race results.
    Handles fetching, storing, and providing results for strategy analysis.
    """
    
    def __init__(self):
        self.results_file = "backend/data/results.json"
        self.results = self._load_results()
        self.ergast_base_url = "http://ergast.com/api/f1"
        logger.info("ResultService initialized")

    def _load_results(self) -> Dict[str, Any]:
        """Load results from persistent storage"""
        try:
            if os.path.exists(self.results_file):
                with open(self.results_file, 'r') as f:
                    return json.load(f)
            else:
                # Create initial results structure
                initial_results = {
                    "race_results": {},
                    "metadata": {
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "total_races_processed": 0
                    }
                }
                self._save_results(initial_results)
                return initial_results
        except Exception as e:
            logger.error(f"Failed to load results: {e}")
            return {"race_results": {}, "metadata": {}}

    def _save_results(self, results_data: Dict[str, Any]):
        """Save results to persistent storage"""
        try:
            os.makedirs(os.path.dirname(self.results_file), exist_ok=True)
            results_data["metadata"]["last_updated"] = datetime.now(timezone.utc).isoformat()
            with open(self.results_file, 'w') as f:
                json.dump(results_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save results: {e}")

    def get_results(self, race_id: str) -> Optional[Dict[str, Any]]:
        """Get race results for a specific race"""
        try:
            logger.info(f"Getting results for race: {race_id}")
            
            # Check if we have cached results
            if race_id in self.results["race_results"]:
                cached_result = self.results["race_results"][race_id]
                logger.info(f"Found cached results for race: {race_id}")
                return cached_result
            
            # Try to fetch from API
            api_result = self._fetch_results_from_api(race_id)
            if api_result:
                # Cache the results
                self.results["race_results"][race_id] = api_result
                self.results["metadata"]["total_races_processed"] += 1
                self._save_results(self.results)
                logger.info(f"Fetched and cached results for race: {race_id}")
                return api_result
            
            logger.warning(f"No results available for race: {race_id}")
            return None
        except Exception as e:
            logger.error(f"Failed to get results for {race_id}: {e}")
            return None

    def _fetch_results_from_api(self, race_id: str) -> Optional[Dict[str, Any]]:
        """Fetch race results from Ergast API"""
        try:
            # Try different API endpoints based on race_id format
            endpoints_to_try = [
                f"{self.ergast_base_url}/current/last/results.json",
                f"{self.ergast_base_url}/2025/last/results.json",
                f"{self.ergast_base_url}/current/results.json"
            ]
            
            for endpoint in endpoints_to_try:
                try:
                    logger.info(f"Fetching results from: {endpoint}")
                    response = requests.get(endpoint, timeout=10)
                    response.raise_for_status()
                    
                    data = response.json()
                    results = self._parse_ergast_results(data, race_id)
                    if results:
                        return results
                except Exception as e:
                    logger.warning(f"Failed to fetch from {endpoint}: {e}")
                    continue
            
            # If API fails, try to create mock results for testing
            logger.info("API failed, creating mock results for testing")
            return self._create_mock_results(race_id)
            
        except Exception as e:
            logger.error(f"Failed to fetch results from API: {e}")
            return None

    def _parse_ergast_results(self, api_data: Dict[str, Any], race_id: str) -> Optional[Dict[str, Any]]:
        """Parse results from Ergast API response"""
        try:
            if "MRData" not in api_data or "RaceTable" not in api_data["MRData"]:
                return None
            
            races = api_data["MRData"]["RaceTable"]["Races"]
            if not races:
                return None
            
            race = races[0]  # Get the most recent race
            results = race.get("Results", [])
            
            if not results:
                return None
            
            # Parse race results
            race_results = {
                "race_id": race_id,
                "race_name": race.get("raceName", "Unknown Race"),
                "circuit": race.get("Circuit", {}).get("circuitName", "Unknown Circuit"),
                "date": race.get("date", ""),
                "season": race.get("season", ""),
                "race_winner": None,
                "podium": [],
                "fastest_lap": None,
                "constructor_winner": None,
                "full_results": [],
                "fetched_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Process each result
            for i, result in enumerate(results):
                driver = result.get("Driver", {})
                constructor = result.get("Constructor", {})
                position = int(result.get("position", 0))
                
                driver_result = {
                    "position": position,
                    "driver": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "constructor": constructor.get("name", "Unknown"),
                    "points": float(result.get("points", 0)),
                    "time": result.get("Time", {}).get("time", ""),
                    "fastest_lap": result.get("FastestLap", {}).get("rank") == "1"
                }
                
                race_results["full_results"].append(driver_result)
                
                # Set race winner (position 1)
                if position == 1:
                    race_results["race_winner"] = driver_result["driver"]
                
                # Set podium (positions 1-3)
                if position <= 3:
                    race_results["podium"].append(driver_result["driver"])
                
                # Set fastest lap
                if driver_result["fastest_lap"]:
                    race_results["fastest_lap"] = driver_result["driver"]
            
            # Determine constructor winner (most points from top 2 drivers)
            constructor_points = {}
            for result in race_results["full_results"][:10]:  # Top 10 drivers
                constructor = result["constructor"]
                if constructor not in constructor_points:
                    constructor_points[constructor] = 0
                constructor_points[constructor] += result["points"]
            
            if constructor_points:
                race_results["constructor_winner"] = max(constructor_points, key=constructor_points.get)
            
            return race_results
            
        except Exception as e:
            logger.error(f"❌ Failed to parse Ergast results: {e}")
            return None

    def _create_mock_results(self, race_id: str) -> Dict[str, Any]:
        """Create mock results for testing when API is unavailable"""
        try:
            logger.info(f"🎭 Creating mock results for race: {race_id}")
            
            # Mock race results with realistic F1 data
            mock_results = {
                "race_id": race_id,
                "race_name": f"Mock Race for {race_id}",
                "circuit": "Mock Circuit",
                "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "season": "2025",
                "race_winner": "Max Verstappen",
                "podium": ["Max Verstappen", "Charles Leclerc", "Lando Norris"],
                "fastest_lap": "Max Verstappen",
                "constructor_winner": "Red Bull Racing",
                "full_results": [
                    {"position": 1, "driver": "Max Verstappen", "constructor": "Red Bull Racing", "points": 25, "time": "1:23:45.123", "fastest_lap": True},
                    {"position": 2, "driver": "Charles Leclerc", "constructor": "Ferrari", "points": 18, "time": "+2.456", "fastest_lap": False},
                    {"position": 3, "driver": "Lando Norris", "constructor": "McLaren", "points": 15, "time": "+5.789", "fastest_lap": False},
                    {"position": 4, "driver": "Lewis Hamilton", "constructor": "Ferrari", "points": 12, "time": "+8.123", "fastest_lap": False},
                    {"position": 5, "driver": "George Russell", "constructor": "Mercedes", "points": 10, "time": "+12.456", "fastest_lap": False},
                    {"position": 6, "driver": "Oscar Piastri", "constructor": "McLaren", "points": 8, "time": "+15.789", "fastest_lap": False},
                    {"position": 7, "driver": "Carlos Sainz", "constructor": "Ferrari", "points": 6, "time": "+18.123", "fastest_lap": False},
                    {"position": 8, "driver": "Fernando Alonso", "constructor": "Aston Martin", "points": 4, "time": "+22.456", "fastest_lap": False},
                    {"position": 9, "driver": "Lance Stroll", "constructor": "Aston Martin", "points": 2, "time": "+25.789", "fastest_lap": False},
                    {"position": 10, "driver": "Pierre Gasly", "constructor": "Alpine", "points": 1, "time": "+28.123", "fastest_lap": False}
                ],
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "source": "mock_data"
            }
            
            return mock_results
            
        except Exception as e:
            logger.error(f"❌ Failed to create mock results: {e}")
            return None

    def store_results(self, race_id: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """Store race results manually (for testing or manual entry)"""
        try:
            logger.info(f"💾 Storing results for race: {race_id}")
            
            # Add metadata
            results["race_id"] = race_id
            results["stored_at"] = datetime.now(timezone.utc).isoformat()
            results["source"] = "manual_entry"
            
            # Store in cache
            self.results["race_results"][race_id] = results
            self.results["metadata"]["total_races_processed"] += 1
            
            # Save to storage
            self._save_results(self.results)
            
            logger.info(f"Results stored for race: {race_id}")
            return {
                "status": "success",
                "message": f"Results stored for race {race_id}",
                "race_id": race_id
            }
        except Exception as e:
            logger.error(f"Failed to store results for {race_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to store results: {str(e)}",
                "race_id": race_id
            }

    def get_all_results(self) -> Dict[str, Any]:
        """Get all stored race results"""
        return self.results["race_results"]

    def get_results_status(self) -> Dict[str, Any]:
        """Get results service status"""
        try:
            total_races = len(self.results["race_results"])
            
            return {
                "total_races": total_races,
                "last_updated": self.results["metadata"].get("last_updated"),
                "total_processed": self.results["metadata"].get("total_races_processed", 0)
            }
        except Exception as e:
            logger.error(f"Failed to get results status: {e}")
            return {
                "total_races": 0,
                "error": str(e)
            }

    def clear_results(self, race_id: str = None) -> Dict[str, Any]:
        """Clear results (for testing or data management)"""
        try:
            if race_id:
                # Clear specific race
                if race_id in self.results["race_results"]:
                    del self.results["race_results"][race_id]
                    logger.info(f"Cleared results for race: {race_id}")
                else:
                    logger.warning(f"No results found for race: {race_id}")
            else:
                # Clear all results
                self.results["race_results"] = {}
                logger.info("Cleared all results")
            
            self._save_results(self.results)
            
            return {
                "status": "success",
                "message": f"Results cleared for {race_id if race_id else 'all races'}"
            }
        except Exception as e:
            logger.error(f"Failed to clear results: {e}")
            return {
                "status": "error",
                "message": f"Failed to clear results: {str(e)}"
            }


# Global instance
result_service = ResultService()

