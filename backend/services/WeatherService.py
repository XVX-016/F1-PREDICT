"""
Weather Service for F1 Race Predictions
Provides weather forecasts for circuits to adjust prediction factors.
"""

import requests
import random
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

class WeatherService:
    """
    Weather service for F1 circuits.
    Currently provides simulated forecasts, can be extended with OpenWeatherMap API.
    """
    
    def __init__(self):
        self.openweather_api_key = os.getenv("OPENWEATHER_API_KEY", "3d269e8b0e5344a3a8b91712251408")
        self.base_url = "http://api.openweathermap.org/data/2.5"
        
        # Circuit location coordinates (lat, lon) for weather API calls
        self.circuit_coordinates = {
            "monaco": {"lat": 43.7384, "lon": 7.4246, "name": "Monaco"},
            "baku": {"lat": 40.4093, "lon": 49.8671, "name": "Baku"},
            "singapore": {"lat": 1.2917, "lon": 103.8518, "name": "Singapore"},
            "jeddah": {"lat": 21.5433, "lon": 39.1678, "name": "Jeddah"},
            "miami": {"lat": 25.7617, "lon": -80.1918, "name": "Miami"},
            "las_vegas": {"lat": 36.1699, "lon": -115.1398, "name": "Las Vegas"},
            "spa": {"lat": 50.4372, "lon": 5.9710, "name": "Spa"},
            "silverstone": {"lat": 52.0736, "lon": -1.0167, "name": "Silverstone"},
            "monza": {"lat": 45.6206, "lon": 9.2850, "name": "Monza"},
            "red_bull_ring": {"lat": 47.2197, "lon": 14.7647, "name": "Spielberg"},
            "hungaroring": {"lat": 47.5819, "lon": 18.6289, "name": "Budapest"},
            "suzuka": {"lat": 34.8431, "lon": 136.5450, "name": "Suzuka"},
            "interlagos": {"lat": -23.7036, "lon": -46.6997, "name": "São Paulo"},
            "zandvoort": {"lat": 52.3888, "lon": 4.5409, "name": "Zandvoort"},
            "australia": {"lat": -37.8497, "lon": 144.9684, "name": "Melbourne"},
            "china": {"lat": 31.2304, "lon": 121.4737, "name": "Shanghai"},
            "japan": {"lat": 34.8431, "lon": 136.5450, "name": "Suzuka"},
            "canada": {"lat": 45.5017, "lon": -73.5673, "name": "Montreal"},
            "austria": {"lat": 47.2197, "lon": 14.7647, "name": "Spielberg"},
            "great_britain": {"lat": 52.0736, "lon": -1.0167, "name": "Silverstone"},
            "belgium": {"lat": 50.4372, "lon": 5.9710, "name": "Spa"},
            "italy": {"lat": 45.6206, "lon": 9.2850, "name": "Monza"},
            "russia": {"lat": 55.7558, "lon": 37.6176, "name": "Sochi"},
            "turkey": {"lat": 40.9923, "lon": 29.1244, "name": "Istanbul"},
            "mexico": {"lat": 19.4326, "lon": -99.1332, "name": "Mexico City"},
            "brazil": {"lat": -23.7036, "lon": -46.6997, "name": "São Paulo"},
            "abu_dhabi": {"lat": 24.4539, "lon": 54.3773, "name": "Abu Dhabi"}
        }
        
        # Weather condition multipliers for F1 predictions
        self.weather_impact = {
            "dry": {"multiplier": 1.0, "description": "Optimal racing conditions"},
            "light_rain": {"multiplier": 1.1, "description": "Slight advantage for experienced drivers"},
            "wet": {"multiplier": 1.2, "description": "Significant advantage for wet weather specialists"},
            "intermediate": {"multiplier": 1.15, "description": "Mixed conditions favor adaptable drivers"},
            "overcast": {"multiplier": 1.05, "description": "Minimal impact on racing"},
            "foggy": {"multiplier": 1.1, "description": "Visibility challenges favor experienced drivers"}
        }
        
        if self.openweather_api_key:
            logger.info("OpenWeatherMap API configured")
        else:
            logger.info("OpenWeatherMap API key not found - using simulated forecasts")
    
    def get_forecast(self, race_name: str, circuit_id: str = None) -> Dict:
        """
        Get weather forecast for a specific race/circuit.
        
        Args:
            race_name: Name of the race (e.g., "Monaco Grand Prix")
            circuit_id: Circuit identifier (e.g., "monaco", "zandvoort")
            
        Returns:
            Weather forecast data with impact factors
        """
        try:
            # Extract circuit ID from race name if not provided
            if not circuit_id:
                circuit_id = self._extract_circuit_id(race_name)
            
            if self.openweather_api_key and circuit_id in self.circuit_coordinates:
                return self._get_openweather_forecast(circuit_id)
            else:
                return self._get_simulated_forecast(circuit_id, race_name)
                
        except Exception as e:
            logger.error(f"Error getting weather forecast for {race_name}: {e}")
            return self._get_default_forecast()
    
    def _extract_circuit_id(self, race_name: str) -> str:
        """Extract circuit ID from race name"""
        race_lower = race_name.lower()
        
        # Map race names to circuit IDs
        race_to_circuit = {
            "monaco": "monaco",
            "baku": "baku", 
            "singapore": "singapore",
            "saudi arabian": "jeddah",
            "miami": "miami",
            "las vegas": "las_vegas",
            "belgian": "spa",
            "british": "silverstone",
            "italian": "monza",
            "austrian": "red_bull_ring",
            "hungarian": "hungaroring",
            "japanese": "suzuka",
            "brazilian": "interlagos",
            "dutch": "zandvoort",
            "australian": "australia",
            "chinese": "china",
            "canadian": "canada",
            "russian": "russia",
            "turkish": "turkey",
            "mexican": "mexico",
            "emirates": "abu_dhabi"
        }
        
        for race_key, circuit_id in race_to_circuit.items():
            if race_key in race_lower:
                return circuit_id
        
        return "unknown"
    
    def _get_openweather_forecast(self, circuit_id: str) -> Dict:
        """Get real weather forecast from OpenWeatherMap API"""
        try:
            coords = self.circuit_coordinates[circuit_id]
            
            # Get current weather
            current_url = f"{self.base_url}/weather"
            params = {
                "lat": coords["lat"],
                "lon": coords["lon"],
                "appid": self.openweather_api_key,
                "units": "metric"
            }
            
            response = requests.get(current_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Extract weather conditions
            weather_main = data["weather"][0]["main"].lower()
            temp = data["main"]["temp"]
            humidity = data["main"]["humidity"]
            wind_speed = data["wind"]["speed"]
            
            # Determine F1 weather condition
            f1_condition = self._map_weather_to_f1(weather_main, data["weather"][0]["description"])
            
            # Calculate precipitation chance based on weather data
            precip_chance = self._calculate_precipitation_chance(data)
            
            forecast = {
                "condition": f1_condition,
                "temperature": round(temp, 1),
                "humidity": humidity,
                "wind_speed": round(wind_speed, 1),
                "precipitation_chance": precip_chance,
                "description": data["weather"][0]["description"],
                "source": "OpenWeatherMap",
                "fetched_at": datetime.now().isoformat(),
                "circuit": coords["name"]
            }
            
            # Add F1 impact factors
            impact = self.weather_impact.get(f1_condition, {"multiplier": 1.0, "description": "Standard conditions"})
            forecast["f1_impact"] = impact
            
            logger.info(f"Fetched real weather for {circuit_id}: {f1_condition}")
            return forecast
            
        except Exception as e:
            logger.error(f"OpenWeatherMap API error: {e}")
            return self._get_simulated_forecast(circuit_id, "Unknown")
    
    def _get_simulated_forecast(self, circuit_id: str, race_name: str) -> Dict:
        """Generate realistic simulated weather forecast"""
        # Seasonal weather patterns
        current_month = datetime.now().month
        
        # Base conditions by season
        if circuit_id in ["monaco", "spa", "silverstone", "hungaroring"]:
            # European circuits - seasonal variation
            if current_month in [3, 4, 10, 11]:  # Spring/Fall
                conditions = ["light_rain", "overcast", "dry"]
                temps = range(12, 22)
            else:  # Summer
                conditions = ["dry", "overcast", "light_rain"]
                temps = range(18, 28)
        elif circuit_id in ["singapore", "jeddah", "abu_dhabi"]:
            # Hot climates
            conditions = ["dry", "overcast"]
            temps = range(25, 35)
        elif circuit_id in ["miami", "las_vegas"]:
            # Variable US climates
            conditions = ["dry", "light_rain", "overcast"]
            temps = range(20, 30)
        else:
            # Default
            conditions = ["dry", "overcast", "light_rain"]
            temps = range(15, 25)
        
        # Generate realistic forecast
        condition = random.choice(conditions)
        temp = random.choice(temps)
        humidity = random.randint(40, 80) if condition != "dry" else random.randint(30, 60)
        wind_speed = random.randint(2, 15)
        precip_chance = random.randint(0, 30) if condition == "dry" else random.randint(20, 80)
        
        forecast = {
            "condition": condition,
            "temperature": temp,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "precipitation_chance": precip_chance,
            "description": f"Simulated forecast for {race_name}",
            "source": "Simulated",
            "fetched_at": datetime.now().isoformat(),
            "circuit": circuit_id.replace("_", " ").title()
        }
        
        # Add F1 impact factors
        impact = self.weather_impact.get(condition, {"multiplier": 1.0, "description": "Standard conditions"})
        forecast["f1_impact"] = impact
        
        logger.info(f"Generated simulated weather for {circuit_id}: {condition}")
        return forecast
    
    def _map_weather_to_f1(self, weather_main: str, description: str) -> str:
        """Map OpenWeatherMap conditions to F1 weather categories"""
        desc_lower = description.lower()
        
        if "rain" in desc_lower or "drizzle" in desc_lower:
            if "light" in desc_lower or "drizzle" in desc_lower:
                return "light_rain"
            else:
                return "wet"
        elif "snow" in desc_lower:
            return "wet"  # Snow treated as wet conditions
        elif "fog" in desc_lower or "mist" in desc_lower:
            return "foggy"
        elif "cloud" in desc_lower or "overcast" in desc_lower:
            return "overcast"
        else:
            return "dry"
    
    def _calculate_precipitation_chance(self, weather_data: Dict) -> int:
        """Calculate precipitation chance from weather data"""
        # OpenWeatherMap doesn't always provide pop (probability of precipitation)
        # So we estimate based on weather conditions
        weather_main = weather_data["weather"][0]["main"].lower()
        
        if "rain" in weather_main or "snow" in weather_main:
            return random.randint(60, 100)
        elif "drizzle" in weather_main:
            return random.randint(40, 70)
        else:
            return random.randint(0, 30)
    
    def _get_default_forecast(self) -> Dict:
        """Return default weather forecast when all else fails"""
        return {
            "condition": "dry",
            "temperature": 22,
            "humidity": 60,
            "wind_speed": 5,
            "precipitation_chance": 10,
            "description": "Default weather conditions",
            "source": "Default",
            "fetched_at": datetime.now().isoformat(),
            "circuit": "Unknown",
            "f1_impact": {"multiplier": 1.0, "description": "Standard conditions"}
        }
    
    def get_weather_multiplier(self, condition: str) -> float:
        """Get F1 prediction multiplier for weather condition"""
        impact = self.weather_impact.get(condition, {"multiplier": 1.0})
        return impact["multiplier"]
    
    def get_circuit_weather_history(self, circuit_id: str, days: int = 30) -> Dict:
        """Get historical weather data for a circuit (placeholder for future implementation)"""
        # This could integrate with historical weather APIs
        return {
            "circuit": circuit_id,
            "period_days": days,
            "avg_temperature": 22.5,
            "avg_humidity": 65,
            "rainy_days": 8,
            "dry_days": 22,
            "note": "Historical weather data not yet implemented"
        }
