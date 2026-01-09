"""
Race Calendar Service for F1 Predictions
Fetches live F1 calendar data from Ergast API and provides race context.
"""

import requests
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json
import os

logger = logging.getLogger(__name__)

class RaceCalendarService:
    """
    Service for fetching live F1 calendar data.
    Uses Ergast API (free, stable) for race schedules and information.
    """
    
    def __init__(self, season: int = 2025):
        self.season = season
        self.base_url = f"http://ergast.com/api/f1/{season}.json"
        self.races = {}
        self.next_race = None
        self._fetch_calendar()
    
    def _fetch_calendar(self):
        """Fetch the complete F1 calendar for the season"""
        try:
            logger.info(f"📅 Fetching F1 {self.season} calendar from local data...")
            
            # Try to load from local calendar file
            calendar_file = "f1_calendar_2025.json"
            if os.path.exists(calendar_file):
                with open(calendar_file, 'r') as f:
                    data = json.load(f)
                
                races_data = data.get("calendar", [])
                self.races = {}
                
                for race in races_data:
                    race_name = race["race"]
                    circuit_name = race["circuit"]
                    circuit_id = race["circuit"]
                    
                    # Parse race date
                    race_date = datetime.strptime(race["date"], "%Y-%m-%d")
                    
                    # Determine track type
                    track_type = self._classify_track_type(circuit_name, circuit_id)
                    
                    race_info = {
                        "name": race_name,
                        "round": race["round"],
                        "season": self.season,
                        "date": race["date"],
                        "circuit": circuit_name,
                        "circuit_id": circuit_id,
                        "location": {
                            "locality": race["city"],
                            "country": race["country"],
                            "lat": 0,
                            "long": 0
                        },
                        "track_type": track_type,
                        "weather": None,  # Will be populated by WeatherService
                        "status": "scheduled"  # scheduled, completed, cancelled
                    }
                    
                    # Store by both name and circuit ID for flexible lookup
                    self.races[race_name.lower()] = race_info
                    self.races[circuit_id.lower()] = race_info
                    
                    # Also store by round number
                    self.races[str(race["round"])] = race_info
                
                # Find next race
                self._update_next_race()
                
                logger.info(f"✅ Loaded {len(races_data)} races from local calendar for F1 {self.season}")
                return
                
        except Exception as e:
            logger.error(f"❌ Failed to load local calendar: {e}")
        
        # Fallback to basic calendar
        logger.warning("⚠️ Using fallback F1 2025 calendar")
        self._create_fallback_calendar()
    # Add this method to the RaceCalendarService class:

    def refresh_calendar(self):
        """Refresh calendar data from API"""
        try:
            self.races = self._fetch_calendar()
            self._update_next_race()
            logger.info("✅ Calendar refreshed successfully")
        except Exception as e:
            logger.error(f"❌ Error refreshing calendar: {e}")

            
    def _classify_track_type(self, circuit_name: str, circuit_id: str) -> str:
        """Classify track type based on circuit characteristics"""
        circuit_lower = circuit_name.lower()
        circuit_id_lower = circuit_id.lower()
        
        # Street circuits
        street_circuits = ["monaco", "baku", "singapore", "miami", "las vegas", "jeddah"]
        if any(street in circuit_lower for street in street_circuits) or circuit_id_lower in street_circuits:
            return "street"
        
        # High-speed circuits
        high_speed = ["spa", "silverstone", "monza", "red bull ring", "spielberg"]
        if any(speed in circuit_lower for speed in high_speed) or circuit_id_lower in high_speed:
            return "high_speed"
        
        # Technical circuits
        technical = ["hungaroring", "suzuka", "interlagos", "hungaroring", "budapest"]
        if any(tech in circuit_lower for tech in technical) or circuit_id_lower in technical:
            return "technical"
        
        # Default to permanent
        return "permanent"
    
    def _update_next_race(self):
        """Find the next upcoming race"""
        current_time = datetime.now(timezone.utc)
        upcoming_races = []
        
        for race_info in self.races.values():
            if isinstance(race_info, dict) and "date" in race_info:
                try:
                    race_date = datetime.fromisoformat(race_info["date"])
                    if race_date.date() > current_time.date():
                        upcoming_races.append((race_date, race_info))
                except (ValueError, TypeError):
                    continue
        
        if upcoming_races:
            # Sort by date and take the earliest
            upcoming_races.sort(key=lambda x: x[0])
            self.next_race = upcoming_races[0][1]
            logger.info(f"🎯 Next race: {self.next_race['name']} on {self.next_race['date']}")
        else:
            self.next_race = None
            logger.info("⚠️ No upcoming races found")
    
    def _create_fallback_calendar(self):
        """Create fallback calendar when API fails"""
        logger.warning("⚠️ Using fallback F1 2025 calendar")
        
        fallback_races = [
            {
                "name": "Australian Grand Prix",
                "round": 1,
                "season": 2025,
                "date": "2025-03-16",
                "circuit": "Albert Park Circuit",
                "circuit_id": "albert_park",
                "location": {"locality": "Melbourne", "country": "Australia"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Japanese Grand Prix",
                "round": 2,
                "season": 2025,
                "date": "2025-03-30",
                "circuit": "Suzuka International Racing Course",
                "circuit_id": "suzuka",
                "location": {"locality": "Suzuka", "country": "Japan"},
                "track_type": "technical",
                "status": "scheduled"
            },
            {
                "name": "Chinese Grand Prix",
                "round": 3,
                "season": 2025,
                "date": "2025-04-13",
                "circuit": "Shanghai International Circuit",
                "circuit_id": "shanghai",
                "location": {"locality": "Shanghai", "country": "China"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Miami Grand Prix",
                "round": 4,
                "season": 2025,
                "date": "2025-04-27",
                "circuit": "Miami International Autodrome",
                "circuit_id": "miami",
                "location": {"locality": "Miami", "country": "United States"},
                "track_type": "street",
                "status": "scheduled"
            },
            {
                "name": "Emilia Romagna Grand Prix",
                "round": 5,
                "season": 2025,
                "date": "2025-05-11",
                "circuit": "Autodromo Enzo e Dino Ferrari",
                "circuit_id": "imola",
                "location": {"locality": "Imola", "country": "Italy"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Monaco Grand Prix",
                "round": 6,
                "season": 2025,
                "date": "2025-05-25",
                "circuit": "Circuit de Monaco",
                "circuit_id": "monaco",
                "location": {"locality": "Monte Carlo", "country": "Monaco"},
                "track_type": "street",
                "status": "scheduled"
            },
            {
                "name": "Spanish Grand Prix",
                "round": 7,
                "season": 2025,
                "date": "2025-06-08",
                "circuit": "Circuit de Barcelona-Catalunya",
                "circuit_id": "catalunya",
                "location": {"locality": "Montmeló", "country": "Spain"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Canadian Grand Prix",
                "round": 8,
                "season": 2025,
                "date": "2025-06-22",
                "circuit": "Circuit Gilles Villeneuve",
                "circuit_id": "villeneuve",
                "location": {"locality": "Montreal", "country": "Canada"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Austrian Grand Prix",
                "round": 9,
                "season": 2025,
                "date": "2025-07-06",
                "circuit": "Red Bull Ring",
                "circuit_id": "red_bull_ring",
                "location": {"locality": "Spielberg", "country": "Austria"},
                "track_type": "high_speed",
                "status": "scheduled"
            },
            {
                "name": "British Grand Prix",
                "round": 10,
                "season": 2025,
                "date": "2025-07-20",
                "circuit": "Silverstone Circuit",
                "circuit_id": "silverstone",
                "location": {"locality": "Silverstone", "country": "United Kingdom"},
                "track_type": "high_speed",
                "status": "scheduled"
            },
            {
                "name": "Belgian Grand Prix",
                "round": 11,
                "season": 2025,
                "date": "2025-08-03",
                "circuit": "Circuit de Spa-Francorchamps",
                "circuit_id": "spa",
                "location": {"locality": "Stavelot", "country": "Belgium"},
                "track_type": "high_speed",
                "status": "scheduled"
            },
            {
                "name": "Dutch Grand Prix",
                "round": 12,
                "season": 2025,
                "date": "2025-08-31",
                "circuit": "Circuit Zandvoort",
                "circuit_id": "zandvoort",
                "location": {"locality": "Zandvoort", "country": "Netherlands"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Italian Grand Prix",
                "round": 13,
                "season": 2025,
                "date": "2025-09-14",
                "circuit": "Monza Circuit",
                "circuit_id": "monza",
                "location": {"locality": "Monza", "country": "Italy"},
                "track_type": "high_speed",
                "status": "scheduled"
            },
            {
                "name": "Azerbaijan Grand Prix",
                "round": 14,
                "season": 2025,
                "date": "2025-09-28",
                "circuit": "Baku City Circuit",
                "circuit_id": "baku",
                "location": {"locality": "Baku", "country": "Azerbaijan"},
                "track_type": "street",
                "status": "scheduled"
            },
            {
                "name": "Singapore Grand Prix",
                "round": 15,
                "season": 2025,
                "date": "2025-10-12",
                "circuit": "Marina Bay Street Circuit",
                "circuit_id": "marina_bay",
                "location": {"locality": "Singapore", "country": "Singapore"},
                "track_type": "street",
                "status": "scheduled"
            },
            {
                "name": "United States Grand Prix",
                "round": 16,
                "season": 2025,
                "date": "2025-10-26",
                "circuit": "Circuit of the Americas",
                "circuit_id": "cota",
                "location": {"locality": "Austin", "country": "United States"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Mexican Grand Prix",
                "round": 17,
                "season": 2025,
                "date": "2025-11-09",
                "circuit": "Autódromo Hermanos Rodríguez",
                "circuit_id": "rodriguez",
                "location": {"locality": "Mexico City", "country": "Mexico"},
                "track_type": "permanent",
                "status": "scheduled"
            },
            {
                "name": "Brazilian Grand Prix",
                "round": 18,
                "season": 2025,
                "date": "2025-11-23",
                "circuit": "Autódromo José Carlos Pace",
                "circuit_id": "interlagos",
                "location": {"locality": "São Paulo", "country": "Brazil"},
                "track_type": "technical",
                "status": "scheduled"
            },
            {
                "name": "Las Vegas Grand Prix",
                "round": 19,
                "season": 2025,
                "date": "2025-12-07",
                "circuit": "Las Vegas Strip Circuit",
                "circuit_id": "las_vegas",
                "location": {"locality": "Las Vegas", "country": "United States"},
                "track_type": "street",
                "status": "scheduled"
            },
            {
                "name": "Abu Dhabi Grand Prix",
                "round": 20,
                "season": 2025,
                "date": "2025-12-21",
                "circuit": "Yas Marina Circuit",
                "circuit_id": "yas_marina",
                "location": {"locality": "Abu Dhabi", "country": "UAE"},
                "track_type": "permanent",
                "status": "scheduled"
            }
        ]
        
        # Populate races dict
        for race in fallback_races:
            race_name_lower = race["name"].lower()
            circuit_id_lower = race["circuit_id"].lower()
            round_str = str(race["round"])
            
            self.races[race_name_lower] = race
            self.races[circuit_id_lower] = race
            self.races[round_str] = race
        
        # Find next race
        self._update_next_race()
    
    def get_next_race(self) -> Optional[Dict[str, Any]]:
        """Get information about the next upcoming race"""
        return self.next_race
    
    def get_race(self, race_identifier: str) -> Optional[Dict[str, Any]]:
        """
        Get race information by name, circuit ID, or round number
        
        Args:
            race_identifier: Race name, circuit ID, or round number
            
        Returns:
            Race information or None if not found
        """
        # Try exact match first
        if race_identifier.lower() in self.races:
            race_info = self.races[race_identifier.lower()]
            if isinstance(race_info, dict):
                return race_info
        
        # Try partial matches for race names
        race_identifier_lower = race_identifier.lower()
        for key, race_info in self.races.items():
            if isinstance(race_info, dict) and "name" in race_info:
                if race_identifier_lower in race_info["name"].lower():
                    return race_info
        
        return None
    
    def get_all_races(self) -> List[Dict[str, Any]]:
        """Get all races in the calendar"""
        races = []
        seen_rounds = set()
        
        for key, race_info in self.races.items():
            if isinstance(race_info, dict) and "round" in race_info:
                if race_info["round"] not in seen_rounds:
                    races.append(race_info)
                    seen_rounds.add(race_info["round"])
        
        # Sort by round
        races.sort(key=lambda x: x["round"])
        return races
    
    def get_races_by_track_type(self, track_type: str) -> List[Dict[str, Any]]:
        """Get all races of a specific track type"""
        return [
            race for race in self.get_all_races()
            if race.get("track_type") == track_type
        ]
    
    def get_race_by_round(self, round_num: int) -> Optional[Dict[str, Any]]:
        """Get race information by round number"""
        return self.races.get(str(round_num))
    
    def refresh_calendar(self):
        """Refresh the calendar data from the API"""
        logger.info("🔄 Refreshing F1 calendar...")
        self._fetch_calendar()
    
    def get_season_info(self) -> Dict[str, Any]:
        """Get overall season information"""
        all_races = self.get_all_races()
        
        if not all_races:
            return {"error": "No races found"}
        
        return {
            "season": self.season,
            "total_races": len(all_races),
            "first_race": all_races[0] if all_races else None,
            "last_race": all_races[-1] if all_races else None,
            "next_race": self.next_race,
            "track_types": {
                "street": len(self.get_races_by_track_type("street")),
                "permanent": len(self.get_races_by_track_type("permanent")),
                "high_speed": len(self.get_races_by_track_type("high_speed")),
                "technical": len(self.get_races_by_track_type("technical"))
            },
            "last_updated": datetime.now().isoformat()
        }

    def get_current_race(self) -> Optional[Dict[str, Any]]:
        """Get the current race (race happening today or most recent)"""
        try:
            current_time = datetime.now(timezone.utc)
            current_date = current_time.date()
            
            # Find race for today or most recent race
            for race_info in self.races.values():
                if isinstance(race_info, dict) and "date" in race_info:
                    try:
                        race_date = datetime.fromisoformat(race_info["date"]).date()
                        if race_date == current_date:
                            return race_info
                    except (ValueError, TypeError):
                        continue
            
            # If no race today, return the most recent race
            all_races = self.get_all_races()
            if all_races:
                # Sort by date and return the most recent
                sorted_races = sorted(all_races, key=lambda x: x.get("date", ""), reverse=True)
                return sorted_races[0]
            
            return None
        except Exception as e:
            logger.error(f"❌ Failed to get current race: {e}")
            return None

    def get_track_features(self, circuit_id: str) -> Dict[str, Any]:
        """Get track features for a specific circuit"""
        try:
            race_info = self.get_race(circuit_id)
            if not race_info:
                return {}
            
            # Basic track features based on track type
            track_type = race_info.get("track_type", "permanent")
            
            features = {
                "circuit_id": circuit_id,
                "circuit_name": race_info.get("circuit", ""),
                "track_type": track_type,
                "location": race_info.get("location", {}),
                "characteristics": self._get_track_characteristics(track_type)
            }
            
            return features
        except Exception as e:
            logger.error(f"❌ Failed to get track features for {circuit_id}: {e}")
            return {}

    def _get_track_characteristics(self, track_type: str) -> Dict[str, Any]:
        """Get track characteristics based on track type"""
        characteristics = {
            "street": {
                "description": "Street circuit with tight corners and barriers",
                "overtaking_difficulty": "high",
                "safety_car_probability": "high",
                "tire_wear": "medium",
                "fuel_consumption": "medium",
                "weather_sensitivity": "high"
            },
            "high_speed": {
                "description": "High-speed circuit with long straights",
                "overtaking_difficulty": "low",
                "safety_car_probability": "low",
                "tire_wear": "low",
                "fuel_consumption": "high",
                "weather_sensitivity": "low"
            },
            "technical": {
                "description": "Technical circuit with complex corners",
                "overtaking_difficulty": "medium",
                "safety_car_probability": "medium",
                "tire_wear": "high",
                "fuel_consumption": "medium",
                "weather_sensitivity": "medium"
            },
            "permanent": {
                "description": "Permanent racing circuit",
                "overtaking_difficulty": "medium",
                "safety_car_probability": "medium",
                "tire_wear": "medium",
                "fuel_consumption": "medium",
                "weather_sensitivity": "medium"
            }
        }
        
        return characteristics.get(track_type, characteristics["permanent"])