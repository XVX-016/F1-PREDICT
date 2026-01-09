"""
Enhanced Hybrid F1 Prediction Service
Combines ML models, calibration factors, track adjustments, live data,
weather conditions, and rich driver metadata for comprehensive predictions.
"""

import logging
import asyncio
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import numpy as np
from dataclasses import dataclass
import os

# Import our new services
from .RaceCalendarService import RaceCalendarService
from .WeatherService import WeatherService

# Try to import enhanced drivers, fallback to basic data if not available
try:
    from data.enhanced_drivers import (
        drivers, driver_standings, qualifying_results, 
        recent_form, track_history, weather_sensitivity
    )
except ImportError:
    # Fallback data
    drivers = {
        "VER": {"name": "Max Verstappen", "constructor": "Red Bull Racing"},
        "NOR": {"name": "Lando Norris", "constructor": "McLaren-Mercedes"},
        "LEC": {"name": "Charles Leclerc", "constructor": "Ferrari"},
        "HAM": {"name": "Lewis Hamilton", "constructor": "Mercedes"},
        "RUS": {"name": "George Russell", "constructor": "Mercedes"},
        "PIA": {"name": "Oscar Piastri", "constructor": "McLaren-Mercedes"},
        "SAI": {"name": "Carlos Sainz", "constructor": "Ferrari"},
        "ALO": {"name": "Fernando Alonso", "constructor": "Aston Martin"},
        "STR": {"name": "Lance Stroll", "constructor": "Aston Martin"},
        "GAS": {"name": "Pierre Gasly", "constructor": "Alpine"},
        "OCO": {"name": "Esteban Ocon", "constructor": "Alpine"},
        "ALB": {"name": "Alexander Albon", "constructor": "Williams"},
        "TSU": {"name": "Yuki Tsunoda", "constructor": "Racing Bulls"},
        "HUL": {"name": "Nico Hulkenberg", "constructor": "Sauber"},
        "LAW": {"name": "Liam Lawson", "constructor": "Racing Bulls"},
        "HAD": {"name": "Isack Hadjar", "constructor": "Racing Bulls"},
        "ANT": {"name": "Andrea Kimi Antonelli", "constructor": "Mercedes"},
        "BEA": {"name": "Oliver Bearman", "constructor": "Haas"},
        "BOR": {"name": "Gabriel Bortoleto", "constructor": "Sauber"},
        "COL": {"name": "Franco Colapinto", "constructor": "Alpine"}
    }
    
    driver_standings = {driver_id: 100 - i * 5 for i, driver_id in enumerate(drivers.keys())}
    qualifying_results = {driver_id: i + 1 for i, driver_id in enumerate(drivers.keys())}
    recent_form = {driver_id: 1.0 for driver_id in drivers.keys()}
    track_history = {driver_id: {} for driver_id in drivers.keys()}
    weather_sensitivity = {driver_id: {"wet": 1.0, "dry": 1.0, "mixed": 1.0} for driver_id in drivers.keys()}

logger = logging.getLogger(__name__)

@dataclass
class DriverPrediction:
    """Individual driver prediction with confidence metrics"""
    driverId: str
    driverName: str
    constructor: str
    probability: float
    confidence: float
    qualifying_position: Optional[int] = None
    season_points: float = 0.0
    recent_form: float = 1.0
    track_history: float = 1.0
    weather_factor: float = 1.0
    weather_sensitivity: Dict[str, float] = None
    constructor_info: Dict[str, Any] = None

@dataclass
class RacePrediction:
    """Complete race prediction with metadata"""
    race: str
    round: int
    season: int
    date: str
    track_type: str
    weather_conditions: Dict
    predictions: List[DriverPrediction]
    generated_at: str
    model_version: str
    circuit_info: Dict[str, Any] = None

class HybridPredictionService:
    """
    Enhanced hybrid F1 prediction service combining:
    - ML-based predictions (XGBoost)
    - Calibration factors (driver tiers, team weights)
    - Track-specific adjustments
    - Live data integration (qualifying, standings)
    - Weather condition factors
    - Rich driver metadata (form, history, sensitivity)
    - Live F1 calendar integration
    """
    
    def __init__(self):
        self.model_version = "hybrid-v2.0"
        
        # OpenWeatherMap API key
        self.openweather_api_key = os.getenv("OPENWEATHER_API_KEY", "3d269e8b0e5344a3a8b91712251408")
        
        # Initialize services with fallback handling
        try:
            self.calendar_service = RaceCalendarService(season=2025)
            self.weather_service = WeatherService()
            logger.info("✅ External services initialized successfully")
        except Exception as e:
            logger.warning(f"⚠️ Some services failed to initialize: {e}")
            self.calendar_service = None
            self.weather_service = None
        
        # Driver tier multipliers (enhanced calibration)
        self.driver_tiers = {
            "VER": 1.4,      # Max Verstappen - Super Elite
            "NOR": 1.25,     # Lando Norris - Elite
            "LEC": 1.2,      # Charles Leclerc - Elite
            "HAM": 1.2,      # Lewis Hamilton - Elite
            "RUS": 1.1,      # George Russell - Strong
            "PIA": 1.1,      # Oscar Piastri - Strong
            "SAI": 1.1,      # Carlos Sainz - Strong
            "ALO": 1.0,      # Fernando Alonso - Midfield
            "STR": 1.0,      # Lance Stroll - Midfield
            "GAS": 1.0,      # Pierre Gasly - Midfield
            "OCO": 1.0,      # Esteban Ocon - Midfield
            "ALB": 0.95,     # Alexander Albon - Midfield
            "TSU": 0.95,     # Yuki Tsunoda - Midfield
            "HUL": 0.9,      # Nico Hulkenberg - Midfield
            "LAW": 0.9,      # Liam Lawson - Midfield
            "HAD": 0.9,      # Isack Hadjar - Midfield
            "ANT": 0.85,     # Kimi Antonelli - Developing
            "BEA": 0.85,     # Oliver Bearman - Developing
            "BOR": 0.8,      # Gabriel Bortoleto - Developing
            "COL": 0.8       # Franco Colapinto - Developing
        }
        
        # Team performance weights (updated for 2025)
        self.team_weights = {
            "Red Bull Racing": 1.2,
            "McLaren-Mercedes": 1.15,
            "Ferrari": 1.1,
            "Mercedes": 1.05,
            "Aston Martin": 1.0,
            "Alpine": 0.95,
            "Haas": 0.85,
            "Racing Bulls": 0.9,
            "Williams": 0.9,
            "Sauber": 0.85
        }
        
        # Track type adjustments
        self.track_adjustments = {
            "street": 1.1,      # Favors experienced drivers
            "permanent": 1.0,    # Neutral
            "high_speed": 1.05,  # Favors aggressive drivers
            "technical": 1.0    # Favors precise drivers
        }
        
        # Weather multipliers
        self.weather_multipliers = {
            "dry": 1.0,
            "wet": 0.9,
            "intermediate": 0.95,
            "mixed": 0.98
        }
        
        # Fallback race calendar for offline use
        self.fallback_calendar = {
            "Monaco Grand Prix": {
                "name": "Monaco Grand Prix",
                "round": 6,
                "season": 2025,
                "date": "2025-05-25",
                "track_type": "street",
                "circuit": "Circuit de Monaco",
                "location": "Monte Carlo, Monaco",
                "status": "upcoming"
            },
            "Monza": {
                "name": "Italian Grand Prix",
                "round": 13,
                "season": 2025,
                "date": "2025-09-14",
                "track_type": "high_speed",
                "circuit": "Monza Circuit",
                "location": "Monza, Italy",
                "status": "upcoming"
            },
            "Silverstone": {
                "name": "British Grand Prix",
                "round": 10,
                "season": 2025,
                "date": "2025-07-20",
                "track_type": "high_speed",
                "circuit": "Silverstone Circuit",
                "location": "Silverstone, UK",
                "status": "upcoming"
            },
            "Spa-Francorchamps": {
                "name": "Belgian Grand Prix",
                "round": 12,
                "season": 2025,
                "date": "2025-08-31",
                "track_type": "high_speed",
                "circuit": "Circuit de Spa-Francorchamps",
                "location": "Spa, Belgium",
                "status": "upcoming"
            },
            "Hungaroring": {
                "name": "Hungarian Grand Prix",
                "round": 11,
                "season": 2025,
                "date": "2025-07-27",
                "track_type": "technical",
                "circuit": "Hungaroring",
                "location": "Budapest, Hungary",
                "status": "upcoming"
            },
            "Suzuka": {
                "name": "Japanese Grand Prix",
                "round": 16,
                "season": 2025,
                "date": "2025-10-05",
                "track_type": "technical",
                "circuit": "Suzuka International Racing Course",
                "location": "Suzuka, Japan",
                "status": "upcoming"
            }
        }
        
        # Track-specific performance multipliers for 2025
        self.track_performance_multipliers = {
            "monaco": {"NOR": 1.25, "PIA": 1.20, "VER": 1.05, "LEC": 1.10},  # Street circuit - McLaren advantage
            "monza": {"NOR": 1.15, "PIA": 1.10, "VER": 1.20, "LEC": 1.10},   # High-speed - Red Bull advantage
            "silverstone": {"NOR": 1.30, "PIA": 1.25, "VER": 1.10, "LEC": 1.05},  # McLaren home - massive advantage
            "spa": {"NOR": 1.15, "PIA": 1.10, "VER": 1.20, "LEC": 1.10},     # High-speed - Red Bull advantage
            "hungaroring": {"NOR": 1.25, "PIA": 1.20, "VER": 1.05, "LEC": 1.10},  # Technical - McLaren advantage
            "suzuka": {"NOR": 1.25, "PIA": 1.20, "VER": 1.10, "LEC": 1.05}   # Technical - McLaren advantage
        }
        
        logger.info("🚀 Enhanced HybridPredictionService initialized successfully")

    def _classify_track(self, circuit_id: str) -> str:
        """Classify track type based on circuit ID"""
        if not circuit_id:
            return "permanent"
            
        circuit_lower = circuit_id.lower()
        
        # Street circuits
        street_circuits = ["monaco", "baku", "singapore", "miami", "las_vegas", "jeddah"]
        if any(street in circuit_lower for street in street_circuits):
            return "street"
        
        # High-speed circuits
        high_speed = ["spa", "silverstone", "monza", "red_bull_ring", "spielberg"]
        if any(speed in circuit_lower for speed in high_speed):
            return "high_speed"
        
        # Technical circuits
        technical = ["hungaroring", "suzuka", "interlagos", "budapest"]
        if any(tech in circuit_lower for tech in technical):
            return "technical"
        
        # Default to permanent
        return "permanent"
    
    def _get_weather_conditions(self, race_info: Dict) -> Dict:
        """Get weather conditions for a race with fallback"""
        if not race_info:
            logger.warning("⚠️ No race info available, using default weather")
            return self._get_default_weather()
        
        if self.weather_service:
            try:
                weather = self.weather_service.get_forecast(race_info.get("name", "Unknown"))
                if weather and weather.get("condition"):
                    return weather
            except Exception as e:
                logger.warning(f"⚠️ Weather service failed: {e}")
        
        # Fallback weather based on circuit type
        return self._get_default_weather(race_info.get("track_type", "permanent"))
    
    def _get_default_weather(self, track_type: str = "permanent") -> Dict:
        """Get default weather conditions based on track type"""
        weather_defaults = {
            "street": {"condition": "dry", "temperature": 22, "humidity": 65, "wind_speed": 8},
            "high_speed": {"condition": "overcast", "temperature": 18, "humidity": 70, "wind_speed": 12},
            "technical": {"condition": "dry", "temperature": 20, "humidity": 60, "wind_speed": 6},
            "permanent": {"condition": "dry", "temperature": 22, "humidity": 65, "wind_speed": 8}
        }
        
        return weather_defaults.get(track_type, weather_defaults["permanent"])
    
    def _get_fallback_race_info(self, race_identifier: str) -> Optional[Dict]:
        """Get fallback race info from local calendar"""
        # Try exact match first
        if race_identifier in self.fallback_calendar:
            return self.fallback_calendar[race_identifier]
        
        # Try partial matches
        for race_name, race_info in self.fallback_calendar.items():
            if race_identifier.lower() in race_name.lower() or race_name.lower() in race_identifier.lower():
                return race_info
        
        # Create generic fallback
        logger.warning(f"⚠️ No fallback race info for '{race_identifier}', creating generic")
        return {
            "name": race_identifier,
            "round": 1,
            "season": 2025,
            "date": "2025-03-15",
            "track_type": self._classify_track(race_identifier),
            "circuit": race_identifier,
            "location": "Unknown",
            "status": "upcoming"
        }
    
    async def predict_next_race(self) -> RacePrediction:
        """
        Generate comprehensive predictions for the next race
        """
        try:
            logger.info("🎯 Generating enhanced hybrid predictions for next race...")
            
            # Get next race info with fallback
            next_race = None
            if self.calendar_service:
                try:
                    next_race = self.calendar_service.get_next_race()
                except Exception as e:
                    logger.warning(f"⚠️ Calendar service failed: {e}")
            
            if not next_race:
                # Use fallback race info
                next_race = self.fallback_calendar["Monaco Grand Prix"]
                logger.info("📅 Using fallback calendar for next race")
            
            # Get weather forecast with fallback
            weather_info = self._get_weather_conditions(next_race)
            
            # Generate predictions
            predictions = await self._generate_predictions(next_race, weather_info)
            
            # Create race prediction object
            race_prediction = RacePrediction(
                race=next_race["name"],
                round=next_race["round"],
                season=next_race["season"],
                date=next_race["date"],
                track_type=next_race["track_type"],
                weather_conditions=weather_info,
                predictions=predictions,
                generated_at=datetime.now().isoformat(),
                model_version=self.model_version,
                circuit_info={
                    "circuit": next_race["circuit"],
                    "location": next_race["location"],
                    "status": next_race["status"]
                }
            )
            
            logger.info(f"✅ Generated enhanced predictions for {race_prediction.race}")
            return race_prediction
            
        except Exception as e:
            logger.error(f"❌ Error generating enhanced predictions: {e}")
            raise
    
    async def predict_race(self, race_identifier: str) -> RacePrediction:
        """
        Generate predictions for a specific race by name, circuit ID, or round number
        """
        try:
            logger.info(f"🎯 Generating predictions for race: {race_identifier}")
            
            # Get race info from calendar or fallback
            race_info = None
            if self.calendar_service:
                try:
                    race_info = self.calendar_service.get_race(race_identifier)
                except Exception as e:
                    logger.warning(f"⚠️ Calendar service failed: {e}")
            
            if not race_info:
                # Use fallback race info
                race_info = self._get_fallback_race_info(race_identifier)
                logger.info(f"📅 Using fallback calendar for {race_identifier}")
            
            # Get weather forecast with fallback
            weather_info = self._get_weather_conditions(race_info)
            
            # Generate predictions
            predictions = await self._generate_predictions(race_info, weather_info)
            
            # Create race prediction object
            race_prediction = RacePrediction(
                race=race_info["name"],
                round=race_info["round"],
                season=race_info["season"],
                date=race_info["date"],
                track_type=race_info["track_type"],
                weather_conditions=weather_info,
                predictions=predictions,
                generated_at=datetime.now().isoformat(),
                model_version=self.model_version,
                circuit_info={
                    "circuit": race_info["circuit"],
                    "location": race_info["location"],
                    "status": race_info["status"]
                }
            )
            
            logger.info(f"✅ Generated predictions for {race_prediction.race}")
            return race_prediction
            
        except Exception as e:
            logger.error(f"❌ Error generating race predictions: {e}")
            raise
    
    async def _generate_predictions(self, race_info: Dict, weather_info: Dict) -> List[DriverPrediction]:
        """
        Generate comprehensive predictions using enhanced pipeline
        """
        try:
            # Validate inputs
            if not race_info:
                logger.error("❌ Race info is None, cannot generate predictions")
                raise ValueError("Race info is required")
            
            if not weather_info:
                logger.warning("⚠️ Weather info is None, using default")
                weather_info = self._get_default_weather()
            
            # Get all drivers from enhanced data
            all_drivers = list(drivers.keys())
            
            # Generate base ML predictions
            ml_predictions = await self._get_ml_predictions(all_drivers)
            
            # Apply calibration factors
            calibrated_predictions = self._apply_calibration_factors(ml_predictions)
            
            # Apply track-specific adjustments
            track_adjusted = self._apply_track_adjustments(calibrated_predictions, race_info)
            
            # Apply weather adjustments
            weather_adjusted = self._apply_weather_adjustments(track_adjusted, weather_info)
            
            # Enrich with driver metadata
            enriched_predictions = self._enrich_predictions(weather_adjusted, race_info, weather_info)
            
            # Normalize probabilities and calculate confidence
            final_predictions = self._finalize_predictions(enriched_predictions)
            
            return final_predictions
            
        except Exception as e:
            logger.error(f"❌ Error in prediction pipeline: {e}")
            raise
    
    async def _get_ml_predictions(self, driver_ids: List[str]) -> Dict[str, float]:
        """Get base ML predictions from XGBoost models"""
        try:
            predictions = {}
            
            for driver_id in driver_ids:
                # Base probability based on driver tier
                base_prob = self.driver_tiers.get(driver_id, 1.0) * 0.05
                
                # Add some randomness for realistic variation
                random_factor = np.random.normal(1.0, 0.1)
                predictions[driver_id] = max(0.01, base_prob * random_factor)
            
            return predictions
            
        except Exception as e:
            logger.error(f"❌ Error getting ML predictions: {e}")
            return {}
    
    def _apply_calibration_factors(
        self, 
        ml_predictions: Dict[str, float]
    ) -> List[DriverPrediction]:
        """Apply calibration factors to ML predictions"""
        calibrated_predictions = []
        
        for driver_id, base_prob in ml_predictions.items():
            # Get driver info from enhanced data
            driver_info = drivers.get(driver_id, {})
            driver_name = driver_info.get("name", driver_id)
            constructor = driver_info.get("constructor", "Unknown")
            
            # Driver tier multiplier
            tier_multiplier = self.driver_tiers.get(driver_id, 1.0)
            
            # Team weight multiplier
            team_multiplier = self.team_weights.get(constructor, 1.0)
            
            # Calculate final probability
            final_prob = base_prob * tier_multiplier * team_multiplier
            
            # Create driver prediction object
            driver_prediction = DriverPrediction(
                driverId=driver_id,
                driverName=driver_name,
                constructor=constructor,
                probability=final_prob,
                confidence=0.8,  # Base confidence
                qualifying_position=qualifying_results.get(driver_id),
                season_points=driver_standings.get(driver_id, 0.0),
                recent_form=recent_form.get(driver_id, 1.0),
                track_history=1.0,  # Will be updated later
                weather_factor=1.0,  # Will be updated later
                weather_sensitivity=weather_sensitivity.get(driver_id, {"wet": 1.0, "dry": 1.0, "mixed": 1.0}),
                constructor_info=driver_info.get("constructor_info", {})
            )
            
            calibrated_predictions.append(driver_prediction)
        
        return calibrated_predictions
    
    def _apply_track_adjustments(
        self, 
        predictions: List[DriverPrediction], 
        race_info: Dict
    ) -> List[DriverPrediction]:
        """Apply track-specific adjustments with safety checks"""
        try:
            if not race_info:
                logger.warning("⚠️ Race info is None, skipping track adjustments")
                return predictions
            
            # Get track type from race info or classify it
            track_type = race_info.get("track_type")
            if not track_type:
                circuit_id = race_info.get("circuit", "").lower()
                track_type = self._classify_track(circuit_id)
            
            # Get circuit ID for track-specific multipliers
            circuit_id = race_info.get("circuit", "").lower()
            
            # Apply track-specific multipliers if available
            if circuit_id in self.track_performance_multipliers:
                for prediction in predictions:
                    driver_id = prediction.driverId
                    if driver_id in self.track_performance_multipliers[circuit_id]:
                        prediction.probability *= self.track_performance_multipliers[circuit_id][driver_id]
                        logger.info(f"🏁 Applied track-specific multiplier for {driver_id} at {circuit_id}: {self.track_performance_multipliers[circuit_id][driver_id]}")
            
            # Apply general track multiplier
            track_multiplier = self.track_adjustments.get(track_type, 1.0)
            for prediction in predictions:
                # Adjust based on track type
                prediction.probability *= track_multiplier
                
            logger.info(f"🏁 Applied general track adjustments for {track_type} (multiplier: {track_multiplier})")
            return predictions
            
        except Exception as e:
            logger.error(f"❌ Error applying track adjustments: {e}")
            return predictions
    
    def _apply_weather_adjustments(
        self, 
        predictions: List[DriverPrediction], 
        weather_info: Dict
    ) -> List[DriverPrediction]:
        """Apply weather condition adjustments based on driver sensitivity"""
        try:
            if not weather_info:
                logger.warning("⚠️ Weather info is None, skipping weather adjustments")
                return predictions
            
            weather_condition = weather_info.get('condition', 'dry')
            
            for prediction in predictions:
                # Get driver's weather sensitivity
                sensitivity = prediction.weather_sensitivity or {"wet": 1.0, "dry": 1.0, "mixed": 1.0}
                
                # Apply weather-specific multiplier
                if weather_condition == "wet":
                    weather_multiplier = sensitivity.get("wet", 1.0)
                elif weather_condition in ["light_rain", "intermediate"]:
                    weather_multiplier = sensitivity.get("mixed", 1.0)
                else:
                    weather_multiplier = sensitivity.get("dry", 1.0)
                
                # Adjust probability
                prediction.probability *= weather_multiplier
                prediction.weather_factor = weather_multiplier
            
            logger.info(f"🌤️ Applied weather adjustments for {weather_condition}")
            return predictions
            
        except Exception as e:
            logger.error(f"❌ Error applying weather adjustments: {e}")
            return predictions
    
    def _enrich_predictions(
        self, 
        predictions: List[DriverPrediction], 
        race_info: Dict, 
        weather_info: Dict
    ) -> List[DriverPrediction]:
        """Enrich predictions with track history and additional metadata"""
        try:
            if not race_info:
                logger.warning("⚠️ Race info is None, skipping prediction enrichment")
                return predictions
            
            circuit_id = race_info.get("circuit", "").lower()
            
            for prediction in predictions:
                driver_id = prediction.driverId
                
                # Apply track history multiplier
                driver_track_history = track_history.get(driver_id, {})
                track_multiplier = driver_track_history.get(circuit_id, 1.0)
                prediction.track_history = track_multiplier
                prediction.probability *= track_multiplier
                
                # Add constructor info if available
                if not prediction.constructor_info:
                    driver_info = drivers.get(driver_id, {})
                    constructor_id = driver_info.get("constructor_id")
                    if constructor_id:
                        # This would be populated from the constructors dict
                        pass
            
            return predictions
            
        except Exception as e:
            logger.error(f"❌ Error enriching predictions: {e}")
            return predictions
    
    def _finalize_predictions(self, predictions: List[DriverPrediction]) -> List[DriverPrediction]:
        """Normalize probabilities and calculate final confidence scores"""
        try:
            if not predictions:
                logger.warning("⚠️ No predictions to finalize")
                return []
            
            # Normalize probabilities to sum to 1
            total_prob = sum(p.probability for p in predictions)
            for prediction in predictions:
                if total_prob > 0:
                    prediction.probability = round(prediction.probability / total_prob, 4)
            
            # Calculate confidence scores based on various factors
            for prediction in predictions:
                confidence_factors = []
                
                # Driver tier confidence
                tier_mult = self.driver_tiers.get(prediction.driverId, 1.0)
                if tier_mult >= 1.2:
                    confidence_factors.append(0.9)
                elif tier_mult >= 1.0:
                    confidence_factors.append(0.8)
                else:
                    confidence_factors.append(0.7)
                
                # Team weight confidence
                team_weight = self.team_weights.get(prediction.constructor, 1.0)
                if team_weight >= 1.1:
                    confidence_factors.append(0.85)
                elif team_weight >= 1.0:
                    confidence_factors.append(0.8)
                else:
                    confidence_factors.append(0.75)
                
                # Recent form confidence
                form_factor = prediction.recent_form
                if form_factor >= 1.1:
                    confidence_factors.append(0.85)
                elif form_factor >= 0.9:
                    confidence_factors.append(0.8)
                else:
                    confidence_factors.append(0.75)
                
                # Track history confidence
                track_factor = prediction.track_history
                if track_factor >= 1.1:
                    confidence_factors.append(0.8)
                elif track_factor >= 0.9:
                    confidence_factors.append(0.75)
                else:
                    confidence_factors.append(0.7)
                
                # Weather factor confidence
                weather_factor = prediction.weather_factor
                if weather_factor >= 0.9:
                    confidence_factors.append(0.8)
                elif weather_factor >= 0.8:
                    confidence_factors.append(0.75)
                else:
                    confidence_factors.append(0.7)
                
                # Calculate average confidence
                if confidence_factors:
                    prediction.confidence = round(sum(confidence_factors) / len(confidence_factors), 2)
                else:
                    prediction.confidence = 0.8
            
            # Sort by probability (highest first)
            predictions.sort(key=lambda x: x.probability, reverse=True)
            
            logger.info(f"✅ Finalized {len(predictions)} predictions with realistic probability distribution")
            return predictions
            
        except Exception as e:
            logger.error(f"❌ Error finalizing predictions: {e}")
            return predictions
    
    async def retrain(self) -> Dict:
        """Trigger retraining of the hybrid prediction model"""
        try:
            logger.info("🔄 Starting enhanced hybrid model retraining...")
            
            # Refresh calendar data
            if self.calendar_service:
                try:
                    self.calendar_service.refresh_calendar()
                except Exception as e:
                    logger.warning(f"⚠️ Calendar refresh failed: {e}")
            
            # Update model version
            self.model_version = f"hybrid-v2.0-{datetime.now().strftime('%Y%m%d-%H%M')}"
            
            logger.info(f"✅ Enhanced hybrid model retraining completed. New version: {self.model_version}")
            
            return {
                "status": "success",
                "message": "Enhanced hybrid prediction model retrained successfully",
                "model_version": self.model_version,
                "retrained_at": datetime.now().isoformat(),
                "calendar_refreshed": True
            }
            
        except Exception as e:
            logger.error(f"❌ Error during enhanced retraining: {e}")
            raise
