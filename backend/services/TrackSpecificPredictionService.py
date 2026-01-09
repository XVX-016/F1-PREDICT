"""
Track-Specific F1 Prediction Service
Generates comprehensive predictions for each Grand Prix with track-specific characteristics,
weather conditions, tire degradation, and driver-specific weights including McLaren dominance.
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import json
import os
import time
import random

logger = logging.getLogger(__name__)

@dataclass
class TrackSpecificPrediction:
    """Track-specific prediction with comprehensive factors"""
    driver_id: str
    driver_name: str
    constructor: str
    constructor_id: str
    nationality: str
    
    # Core predictions
    win_probability: float
    podium_probability: float
    points_probability: float
    expected_position: float
    
    # Track-specific adjustments
    track_performance_multiplier: float
    weather_adjustment: float
    tire_degradation_factor: float
    fuel_efficiency_bonus: float
    brake_wear_impact: float
    downforce_advantage: float
    power_sensitivity_bonus: float
    
    # Driver-specific factors
    driver_weight: float
    team_weight: float
    season_form: float
    track_history: float
    
    # Confidence and uncertainty
    confidence_score: float
    uncertainty_factor: float
    
    # Additional metadata
    qualifying_potential: float
    race_pace_advantage: float
    tire_management_skill: float
    wet_weather_advantage: float

@dataclass
class GrandPrixPrediction:
    """Complete Grand Prix prediction with all factors"""
    race_name: str
    circuit: str
    round: int
    date: str
    country: str
    city: str
    
    # Track characteristics
    track_type: str
    track_length: float
    corners: int
    straights: int
    high_speed_corners: int
    medium_speed_corners: int
    low_speed_corners: int
    overtaking_opportunities: int
    
    # Environmental factors
    weather_condition: str
    temperature_range: Tuple[float, float]
    humidity_range: Tuple[float, float]
    wind_conditions: str
    
    # Tire strategy
    tire_compounds: List[str]
    expected_degradation: str
    pit_stop_strategy: str
    
    # Driver predictions (all 20 drivers)
    driver_predictions: List[TrackSpecificPrediction]
    
    # Race analysis
    expected_race_pace: str
    key_factors: List[str]
    surprise_potential: List[str]
    
    # Model metadata
    generated_at: str
    model_version: str
    simulation_count: int

class TrackSpecificPredictionService:
    """
    Advanced track-specific prediction service that considers all factors
    including McLaren dominance, track characteristics, weather, and tires.
    """
    
    def __init__(self):
        self.model_version = "TrackSpecific_v2.0"
        self.simulation_count = 50000
        
        # Load all required data
        self._load_driver_weights()
        self._load_team_weights()
        self._load_track_features()
        self._load_f1_calendar()
        self._load_enhanced_drivers()
        
        logger.info("🚀 Track-Specific Prediction Service initialized")
    
    def _load_driver_weights(self):
        """Load driver-specific weights from JSON"""
        try:
            with open("driver_weights.json", "r") as f:
                self.driver_weights = json.load(f)
            logger.info("✅ Driver weights loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load driver weights: {e}")
            self.driver_weights = {}
    
    def _load_team_weights(self):
        """Load team-specific weights from JSON"""
        try:
            with open("team_weights.json", "r") as f:
                self.team_weights = json.load(f)
            logger.info("✅ Team weights loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load team weights: {e}")
            self.team_weights = {}
    
    def _load_track_features(self):
        """Load comprehensive track features database"""
        try:
            with open("track_features_database.json", "r") as f:
                self.track_features = json.load(f)["track_features"]
            logger.info("✅ Track features loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load track features: {e}")
            self.track_features = {}
    
    def _load_f1_calendar(self):
        """Load 2025 F1 calendar"""
        try:
            with open("f1_calendar_2025.json", "r") as f:
                self.f1_calendar = json.load(f)["calendar"]
            logger.info("✅ F1 calendar loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load F1 calendar: {e}")
            self.f1_calendar = []
    
    def _load_enhanced_drivers(self):
        """Load enhanced driver profiles"""
        try:
            from data.enhanced_drivers_2025 import DRIVERS_2025
            self.drivers = DRIVERS_2025
            logger.info("✅ Enhanced drivers loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load enhanced drivers: {e}")
            self.drivers = {}
    
    async def predict_grand_prix(
        self,
        race_identifier: str,
        weather_condition: str = "dry",
        temperature: float = 25.0,
        humidity: float = 60.0,
        wind_speed: float = 5.0
    ) -> GrandPrixPrediction:
        """
        Generate comprehensive predictions for a specific Grand Prix
        
        Args:
            race_identifier: Race name, circuit, or round number
            weather_condition: Weather condition (dry, wet, intermediate, mixed)
            temperature: Temperature in Celsius
            humidity: Humidity percentage
            wind_speed: Wind speed in km/h
        
        Returns:
            Complete Grand Prix prediction with all factors
        """
        start_time = time.time()
        
        try:
            logger.info(f"🎯 Generating track-specific predictions for: {race_identifier}")
            
            # Get race information
            race_info = self._get_race_info(race_identifier)
            if not race_info:
                raise ValueError(f"Race not found: {race_identifier}")
            
            # Get track characteristics
            circuit_id = race_info["circuit"]
            track_data = self.track_features.get(circuit_id, {})
            
            # Generate driver predictions with all factors
            driver_predictions = self._generate_track_specific_predictions(
                race_info, track_data, weather_condition, temperature, humidity, wind_speed
            )
            
            # Normalize probabilities
            self._normalize_probabilities(driver_predictions)
            
            # Calculate race-level analysis
            race_analysis = self._analyze_race_characteristics(
                track_data, weather_condition, driver_predictions
            )
            
            # Create Grand Prix prediction
            grand_prix_prediction = GrandPrixPrediction(
                race_name=race_info["race"],
                circuit=race_info["circuit"],
                round=race_info["round"],
                date=race_info["date"],
                country=race_info["country"],
                city=race_info["city"],
                
                # Track characteristics
                track_type=track_data.get("type", "permanent"),
                track_length=track_data.get("length", 5.0),
                corners=track_data.get("corners", 16),
                straights=track_data.get("straights", 2),
                high_speed_corners=track_data.get("high_speed_corners", 4),
                medium_speed_corners=track_data.get("medium_speed_corners", 8),
                low_speed_corners=track_data.get("low_speed_corners", 4),
                overtaking_opportunities=track_data.get("overtaking_opportunities", 2),
                
                # Environmental factors
                weather_condition=weather_condition,
                temperature_range=(temperature - 5, temperature + 5),
                humidity_range=(humidity - 10, humidity + 10),
                wind_conditions=f"{wind_speed} km/h",
                
                # Tire strategy
                tire_compounds=self._get_tire_strategy(track_data, weather_condition),
                expected_degradation=track_data.get("tire_degradation", "medium"),
                pit_stop_strategy=self._get_pit_stop_strategy(track_data, weather_condition),
                
                # Driver predictions
                driver_predictions=driver_predictions,
                
                # Race analysis
                expected_race_pace=race_analysis["expected_pace"],
                key_factors=race_analysis["key_factors"],
                surprise_potential=race_analysis["surprise_potential"],
                
                # Model metadata
                generated_at=datetime.now().isoformat(),
                model_version=self.model_version,
                simulation_count=self.simulation_count
            )
            
            generation_time = time.time() - start_time
            logger.info(f"✅ Track-specific predictions generated in {generation_time:.2f}s")
            
            return grand_prix_prediction
            
        except Exception as e:
            logger.error(f"❌ Error generating Grand Prix predictions: {e}")
            raise
    
    def _get_race_info(self, race_identifier: str) -> Optional[Dict[str, Any]]:
        """Get race information from calendar"""
        # Try to match by round number
        if race_identifier.isdigit():
            round_num = int(race_identifier)
            for race in self.f1_calendar:
                if race["round"] == round_num:
                    return race
        
        # Try to match by race name or circuit
        race_identifier_lower = race_identifier.lower()
        for race in self.f1_calendar:
            if (race_identifier_lower in race["race"].lower() or 
                race_identifier_lower in race["circuit"].lower()):
                return race
        
        return None
    
    def _generate_track_specific_predictions(
        self,
        race_info: Dict[str, Any],
        track_data: Dict[str, Any],
        weather_condition: str,
        temperature: float,
        humidity: float,
        wind_speed: float
    ) -> List[TrackSpecificPrediction]:
        """Generate predictions with all track-specific factors"""
        predictions = []
        
        for driver_id, driver_profile in self.drivers.items():
            # Base driver performance
            base_performance = self._calculate_base_performance(driver_profile)
            
            # Track-specific adjustments
            track_multiplier = self._calculate_track_performance(
                driver_profile, track_data
            )
            
            # Weather adjustments
            weather_adjustment = self._calculate_weather_impact(
                driver_profile, weather_condition, temperature, humidity, wind_speed
            )
            
            # Tire and technical factors
            tire_factor = self._calculate_tire_degradation_impact(
                driver_profile, track_data, weather_condition
            )
            
            fuel_factor = self._calculate_fuel_efficiency_impact(
                driver_profile, track_data
            )
            
            brake_factor = self._calculate_brake_wear_impact(
                driver_profile, track_data
            )
            
            downforce_factor = self._calculate_downforce_impact(
                driver_profile, track_data
            )
            
            power_factor = self._calculate_power_sensitivity_impact(
                driver_profile, track_data
            )
            
            # Driver and team weights
            driver_weight = self.driver_weights.get(driver_id, 1.0)
            team_weight = self.team_weights.get(driver_profile.constructor, 1.0)
            
            # Combine all factors
            final_performance = (
                base_performance *
                track_multiplier *
                weather_adjustment *
                tire_factor *
                fuel_factor *
                brake_factor *
                downforce_factor *
                power_factor *
                driver_weight *
                team_weight
            )
            
            # Generate prediction object
            prediction = TrackSpecificPrediction(
                driver_id=driver_id,
                driver_name=driver_profile.name,
                constructor=driver_profile.constructor,
                constructor_id=driver_profile.constructor_id,
                nationality=driver_profile.nationality,
                
                # Core predictions (will be normalized later)
                win_probability=final_performance,
                podium_probability=final_performance * 0.8,
                points_probability=final_performance * 0.9,
                expected_position=20 - (final_performance * 10),
                
                # Track-specific adjustments
                track_performance_multiplier=track_multiplier,
                weather_adjustment=weather_adjustment,
                tire_degradation_factor=tire_factor,
                fuel_efficiency_bonus=fuel_factor,
                brake_wear_impact=brake_factor,
                downforce_advantage=downforce_factor,
                power_sensitivity_bonus=power_factor,
                
                # Driver-specific factors
                driver_weight=driver_weight,
                team_weight=team_weight,
                season_form=driver_profile.recent_form,
                track_history=driver_profile.track_performance.get(
                    track_data.get("type", "permanent"), 1.0
                ),
                
                # Confidence and uncertainty
                confidence_score=min(final_performance * 0.8, 0.95),
                uncertainty_factor=1.0 - (final_performance * 0.3),
                
                # Additional metadata
                qualifying_potential=driver_profile.qualifying_strength,
                race_pace_advantage=driver_profile.race_pace,
                tire_management_skill=driver_profile.tire_management,
                wet_weather_advantage=driver_profile.wet_weather_skill
            )
            
            predictions.append(prediction)
        
        return predictions
    
    def _calculate_base_performance(self, driver_profile) -> float:
        """Calculate base driver performance"""
        base = (
            driver_profile.season_points / 100.0 +  # Normalize points
            driver_profile.recent_form * 0.3 +
            driver_profile.team_strength * 0.2 +
            driver_profile.car_reliability * 0.15 +
            driver_profile.qualifying_strength * 0.15 +
            driver_profile.race_pace * 0.2
        )
        return max(0.1, min(2.0, base))  # Clamp between 0.1 and 2.0
    
    def _calculate_track_performance(self, driver_profile, track_data) -> float:
        """Calculate track-specific performance multiplier"""
        track_type = track_data.get("type", "permanent")
        base_multiplier = driver_profile.track_performance.get(track_type, 1.0)
        
        # Additional track-specific adjustments
        if track_type == "street":
            # Street circuits favor precision and qualifying
            multiplier = base_multiplier * (driver_profile.qualifying_strength * 0.3 + 0.7)
        elif track_type == "high_speed":
            # High-speed tracks favor power and downforce
            multiplier = base_multiplier * (driver_profile.race_pace * 0.3 + 0.7)
        elif track_type == "technical":
            # Technical tracks favor skill and tire management
            multiplier = base_multiplier * (driver_profile.tire_management * 0.3 + 0.7)
        else:
            # Permanent tracks are balanced
            multiplier = base_multiplier
        
        return max(0.7, min(1.3, multiplier))
    
    def _calculate_weather_impact(
        self, driver_profile, weather_condition: str, 
        temperature: float, humidity: float, wind_speed: float
    ) -> float:
        """Calculate weather impact on driver performance"""
        base_weather = driver_profile.weather_sensitivity.get(weather_condition, 1.0)
        
        # Temperature adjustments
        if temperature < 15:
            temp_factor = 0.9  # Cold conditions
        elif temperature > 35:
            temp_factor = 0.95  # Hot conditions
        else:
            temp_factor = 1.0  # Optimal conditions
        
        # Humidity adjustments
        if humidity > 80:
            humidity_factor = 0.95  # High humidity
        elif humidity < 30:
            humidity_factor = 0.98  # Low humidity
        else:
            humidity_factor = 1.0  # Normal humidity
        
        # Wind adjustments
        if wind_speed > 20:
            wind_factor = 0.9  # High winds
        elif wind_speed > 10:
            wind_factor = 0.95  # Moderate winds
        else:
            wind_factor = 1.0  # Low winds
        
        # Wet weather special handling
        if weather_condition == "wet":
            wet_bonus = driver_profile.wet_weather_skill * 0.2
            base_weather += wet_bonus
        
        final_multiplier = base_weather * temp_factor * humidity_factor * wind_factor
        return max(0.7, min(1.3, final_multiplier))
    
    def _calculate_tire_degradation_impact(self, driver_profile, track_data, weather_condition: str) -> float:
        """Calculate tire degradation impact"""
        track_degradation = track_data.get("tire_degradation", "medium")
        driver_skill = driver_profile.tire_management
        
        # Base tire factor
        if track_degradation == "high":
            base_factor = 0.85  # High degradation tracks
        elif track_degradation == "low":
            base_factor = 1.05  # Low degradation tracks
        else:
            base_factor = 1.0  # Medium degradation tracks
        
        # Driver skill adjustment
        skill_bonus = (driver_skill - 1.0) * 0.2
        
        # Weather adjustment
        if weather_condition == "wet":
            weather_bonus = 0.05  # Wet conditions reduce degradation
        else:
            weather_bonus = 0.0
        
        final_factor = base_factor + skill_bonus + weather_bonus
        return max(0.7, min(1.3, final_factor))
    
    def _calculate_fuel_efficiency_impact(self, driver_profile, track_data) -> float:
        """Calculate fuel efficiency impact"""
        fuel_consumption = track_data.get("fuel_consumption", "medium")
        
        if fuel_consumption == "high":
            base_factor = 0.95  # High fuel consumption tracks
        elif fuel_consumption == "low":
            base_factor = 1.05  # Low fuel consumption tracks
        else:
            base_factor = 1.0  # Medium fuel consumption tracks
        
        # Driver skill adjustment (race pace affects fuel efficiency)
        driver_bonus = (driver_profile.race_pace - 1.0) * 0.1
        
        final_factor = base_factor + driver_bonus
        return max(0.9, min(1.1, final_factor))
    
    def _calculate_brake_wear_impact(self, driver_profile, track_data) -> float:
        """Calculate brake wear impact"""
        brake_wear = track_data.get("brake_wear", "medium")
        
        if brake_wear == "high":
            base_factor = 0.9  # High brake wear tracks
        elif brake_wear == "low":
            base_factor = 1.05  # Low brake wear tracks
        else:
            base_factor = 1.0  # Medium brake wear tracks
        
        # Driver skill adjustment
        driver_bonus = (driver_profile.qualifying_strength - 1.0) * 0.1
        
        final_factor = base_factor + driver_bonus
        return max(0.85, min(1.15, final_factor))
    
    def _calculate_downforce_impact(self, driver_profile, track_data) -> float:
        """Calculate downforce impact"""
        downforce_level = track_data.get("downforce_level", "medium")
        
        if downforce_level == "high":
            base_factor = 1.05  # High downforce tracks
        elif downforce_level == "low":
            base_factor = 0.95  # Low downforce tracks
        else:
            base_factor = 1.0  # Medium downforce tracks
        
        # Driver skill adjustment
        driver_bonus = (driver_profile.qualifying_strength - 1.0) * 0.1
        
        final_factor = base_factor + driver_bonus
        return max(0.9, min(1.1, final_factor))
    
    def _calculate_power_sensitivity_impact(self, driver_profile, track_data) -> float:
        """Calculate power sensitivity impact"""
        power_sensitivity = track_data.get("power_sensitivity", "medium")
        
        if power_sensitivity == "high":
            base_factor = 1.05  # High power sensitivity tracks
        elif power_sensitivity == "low":
            base_factor = 0.95  # Low power sensitivity tracks
        else:
            base_factor = 1.0  # Medium power sensitivity tracks
        
        # Driver skill adjustment
        driver_bonus = (driver_profile.race_pace - 1.0) * 0.1
        
        final_factor = base_factor + driver_bonus
        return max(0.9, min(1.1, final_factor))
    
    def _get_tire_strategy(self, track_data: Dict[str, Any], weather_condition: str) -> List[str]:
        """Get recommended tire strategy for the track and conditions"""
        degradation = track_data.get("tire_degradation", "medium")
        
        if weather_condition == "wet":
            return ["Wet", "Intermediate"]
        elif weather_condition == "intermediate":
            return ["Intermediate", "Soft", "Medium"]
        else:
            if degradation == "high":
                return ["Medium", "Hard", "Soft"]
            elif degradation == "low":
                return ["Soft", "Medium"]
            else:
                return ["Soft", "Medium", "Hard"]
    
    def _get_pit_stop_strategy(self, track_data: Dict[str, Any], weather_condition: str) -> str:
        """Get recommended pit stop strategy"""
        degradation = track_data.get("tire_degradation", "medium")
        overtaking = track_data.get("overtaking_opportunities", 2)
        
        if weather_condition == "wet":
            return "2-3 stops (weather dependent)"
        elif degradation == "high":
            return "2-3 stops (high degradation)"
        elif degradation == "low":
            return "1-2 stops (low degradation)"
        elif overtaking <= 2:
            return "1-2 stops (overtaking difficult)"
        else:
            return "2 stops (balanced strategy)"
    
    def _analyze_race_characteristics(
        self, track_data: Dict[str, Any], weather_condition: str, 
        driver_predictions: List[TrackSpecificPrediction]
    ) -> Dict[str, Any]:
        """Analyze overall race characteristics and key factors"""
        
        # Expected race pace
        avg_performance = np.mean([p.win_probability for p in driver_predictions])
        if avg_performance > 0.08:
            expected_pace = "High intensity"
        elif avg_performance > 0.06:
            expected_pace = "Moderate intensity"
        else:
            expected_pace = "Strategic race"
        
        # Key factors
        key_factors = []
        if track_data.get("tire_degradation") == "high":
            key_factors.append("Tire management critical")
        if track_data.get("overtaking_opportunities") <= 2:
            key_factors.append("Qualifying position crucial")
        if weather_condition == "wet":
            key_factors.append("Weather conditions unpredictable")
        if track_data.get("brake_wear") == "high":
            key_factors.append("Brake management important")
        
        # Surprise potential
        surprise_potential = []
        midfield_drivers = [p for p in driver_predictions if 0.03 < p.win_probability < 0.08]
        if len(midfield_drivers) > 5:
            surprise_potential.append("Midfield drivers could surprise")
        if weather_condition in ["wet", "mixed"]:
            surprise_potential.append("Weather could create surprises")
        
        return {
            "expected_pace": expected_pace,
            "key_factors": key_factors,
            "surprise_potential": surprise_potential
        }
    
    def _normalize_probabilities(self, predictions: List[TrackSpecificPrediction]):
        """Normalize win probabilities to sum to 1.0"""
        total_prob = sum(p.win_probability for p in predictions)
        
        for prediction in predictions:
            prediction.win_probability /= total_prob
            prediction.podium_probability = min(prediction.podium_probability, 0.95)
            prediction.points_probability = min(prediction.points_probability, 0.98)
    
    async def predict_all_grand_prix(self, weather_condition: str = "dry") -> List[GrandPrixPrediction]:
        """Generate predictions for all Grand Prix in the season"""
        all_predictions = []
        
        for race in self.f1_calendar:
            try:
                prediction = await self.predict_grand_prix(
                    race["race"], weather_condition
                )
                all_predictions.append(prediction)
                logger.info(f"✅ Generated predictions for {race['race']}")
            except Exception as e:
                logger.error(f"❌ Failed to generate predictions for {race['race']}: {e}")
        
        return all_predictions
    
    async def predict_next_race(self) -> GrandPrixPrediction:
        """Generate predictions for the next upcoming race"""
        # Find the next race (simplified - you can enhance this with date logic)
        if self.f1_calendar:
            next_race = self.f1_calendar[0]  # First race in calendar
            return await self.predict_grand_prix(next_race["race"])
        else:
            raise ValueError("No races found in calendar")
