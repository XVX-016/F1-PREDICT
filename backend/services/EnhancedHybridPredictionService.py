"""
Enhanced Hybrid F1 Prediction Service
Integrates all 20 drivers with Monte Carlo simulations, Bayesian inference,
advanced calibration, and comprehensive fallback systems.
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

# Import our enhanced components
from data.enhanced_drivers_2025 import (
    get_all_drivers, get_team_performance, get_track_performance, get_weather_impact
)
from services.MonteCarloEngine import MonteCarloEngine
from services.BayesianProbabilisticLayer import BayesianProbabilisticLayer

logger = logging.getLogger(__name__)

@dataclass
class EnhancedDriverPrediction:
    """Enhanced driver prediction with comprehensive metrics"""
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
    
    # Uncertainty quantification
    uncertainty_score: float
    confidence_score: float
    
    # Monte Carlo results
    mc_win_probability: float
    mc_avg_position: float
    mc_std_position: float
    mc_podium_probability: float
    
    # Bayesian results
    bayesian_win_probability: float
    bayesian_expected_position: float
    bayesian_uncertainty: float
    bayesian_evidence_strength: float
    
    # Credible intervals
    win_ci_95: Tuple[float, float]
    win_ci_99: Tuple[float, float]
    position_ci_95: Tuple[float, float]
    position_ci_99: Tuple[float, float]
    
    # Performance factors
    track_adjustment: float
    weather_adjustment: float
    reliability_factor: float
    season_form: float
    
    # Model diagnostics
    convergence_metric: float
    effective_sample_size: float

@dataclass
class EnhancedRacePrediction:
    """Enhanced race prediction with comprehensive analysis"""
    race_name: str
    circuit: str
    track_type: str
    weather_condition: str
    season: int
    round: int
    date: str
    
    # Driver predictions (all 20 drivers)
    driver_predictions: List[EnhancedDriverPrediction]
    
    # Race-level statistics
    total_simulations: int
    simulation_time: float
    model_version: str
    generated_at: str
    
    # Uncertainty summary
    overall_uncertainty: float
    high_uncertainty_drivers: List[str]
    low_confidence_drivers: List[str]
    
    # Track and weather analysis
    track_characteristics: Dict[str, Any]
    weather_impact: Dict[str, Any]
    
    # Model performance metrics
    convergence_metrics: Dict[str, float]
    evidence_strength: Dict[str, float]

class EnhancedHybridPredictionService:
    """
    Enhanced hybrid prediction service with all 20 drivers,
    Monte Carlo simulations, and Bayesian inference
    """
    
    def __init__(
        self,
        num_simulations: int = 1000,
        prior_strength: float = 1.0,
        enable_parallel: bool = True
    ):
        self.model_version = "enhanced-hybrid-v3.0"
        self.num_simulations = num_simulations
        self.enable_parallel = enable_parallel
        
        # Initialize components
        self.monte_carlo_engine = MonteCarloEngine(num_simulations=num_simulations)
        self.bayesian_layer = BayesianProbabilisticLayer(prior_strength=prior_strength)
        
        # Load enhanced driver database
        self.driver_profiles = get_all_drivers()
        self.team_performance = get_team_performance
        self.track_performance = get_track_performance
        self.weather_impact = get_weather_impact
        
        # Initialize Bayesian priors
        self._initialize_bayesian_priors()
        
        # Fallback systems
        self.fallback_calendar = self._create_fallback_calendar()
        
        logger.info(f"🚀 Enhanced Hybrid Prediction Service initialized with {len(self.driver_profiles)} drivers")
    
    def _initialize_bayesian_priors(self):
        """Initialize Bayesian priors for all drivers"""
        try:
            # Create historical data structure (placeholder for now)
            historical_data = {}
            
            # Initialize priors
            self.bayesian_layer.initialize_priors(self.driver_profiles, historical_data)
            logger.info("✅ Bayesian priors initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Bayesian priors: {e}")
            # Continue without Bayesian layer if it fails
    
    def _create_fallback_calendar(self) -> Dict[str, Dict[str, Any]]:
        """Create comprehensive fallback calendar for 2025 season"""
        return {
            "Monaco Grand Prix": {
                "name": "Monaco Grand Prix",
                "circuit": "Circuit de Monaco",
                "track_type": "street",
                "season": 2025,
                "round": 6,
                "date": "2025-05-25",
                "location": "Monte Carlo, Monaco",
                "coordinates": {"lat": 43.7384, "lon": 7.4246}
            },
            "Monza": {
                "name": "Italian Grand Prix",
                "circuit": "Monza Circuit",
                "track_type": "high_speed",
                "season": 2025,
                "round": 13,
                "date": "2025-09-14",
                "location": "Monza, Italy",
                "coordinates": {"lat": 45.6206, "lon": 9.285}
            },
            "Silverstone": {
                "name": "British Grand Prix",
                "circuit": "Silverstone Circuit",
                "track_type": "high_speed",
                "season": 2025,
                "round": 10,
                "date": "2025-07-20",
                "location": "Silverstone, UK",
                "coordinates": {"lat": 52.0736, "lon": -1.0167}
            },
            "Spa-Francorchamps": {
                "name": "Belgian Grand Prix",
                "circuit": "Circuit de Spa-Francorchamps",
                "track_type": "high_speed",
                "season": 2025,
                "round": 12,
                "date": "2025-08-31",
                "location": "Spa, Belgium",
                "coordinates": {"lat": 50.4372, "lon": 5.971}
            },
            "Hungaroring": {
                "name": "Hungarian Grand Prix",
                "circuit": "Hungaroring",
                "track_type": "technical",
                "season": 2025,
                "round": 11,
                "date": "2025-07-27",
                "location": "Budapest, Hungary",
                "coordinates": {"lat": 47.5819, "lon": 18.6289}
            },
            "Suzuka": {
                "name": "Japanese Grand Prix",
                "circuit": "Suzuka International Racing Course",
                "track_type": "technical",
                "season": 2025,
                "round": 16,
                "date": "2025-10-05",
                "location": "Suzuka, Japan",
                "coordinates": {"lat": 34.8431, "lon": 136.545}
            }
        }
    
    async def predict_race_enhanced(
        self,
        race_name: str,
        weather_condition: str = "dry",
        num_simulations: int = None
    ) -> EnhancedRacePrediction:
        """
        Generate enhanced race predictions using Monte Carlo and Bayesian methods
        
        Args:
            race_name: Name of the race
            weather_condition: Weather condition (dry, wet, intermediate, mixed)
            num_simulations: Number of Monte Carlo simulations
        
        Returns:
            Enhanced race prediction with all 20 drivers
        """
        start_time = time.time()
        
        try:
            logger.info(f"🎯 Generating enhanced predictions for {race_name}")
            
            # Get race information
            race_info = await self._get_race_info(race_name)
            if not race_info:
                logger.warning(f"⚠️ No race info found for {race_name}, using fallback")
                race_info = self._get_fallback_race_info(race_name)
            
            # Get track characteristics
            track_type = race_info.get("track_type", "permanent")
            track_characteristics = self.track_performance(track_type)
            weather_impact_data = self.weather_impact(weather_condition)
            
            # Run Monte Carlo simulations
            logger.info(f"🎲 Running Monte Carlo simulations for {race_name}")
            if num_simulations is None:
                num_simulations = self.num_simulations
            
            if self.enable_parallel:
                mc_results = self.monte_carlo_engine.run_parallel_simulations(
                    self.driver_profiles, track_type, weather_condition,
                    track_characteristics, weather_impact_data, num_simulations
                )
            else:
                mc_results = self.monte_carlo_engine.run_multiple_simulations(
                    self.driver_profiles, track_type, weather_condition,
                    track_characteristics, weather_impact_data, num_simulations
                )
            
            # Combine with Bayesian layer
            logger.info("🔗 Combining Monte Carlo with Bayesian inference")
            combined_predictions = self.bayesian_layer.combine_with_monte_carlo(
                mc_results, track_type, weather_condition
            )
            
            # Create enhanced driver predictions
            enhanced_predictions = self._create_enhanced_predictions(combined_predictions)
            
            # Normalize probabilities
            self._normalize_probabilities(enhanced_predictions)
            
            # Calculate race-level statistics
            simulation_time = time.time() - start_time
            overall_uncertainty = self._calculate_overall_uncertainty(enhanced_predictions)
            high_uncertainty_drivers = self._identify_high_uncertainty_drivers(enhanced_predictions)
            low_confidence_drivers = self._identify_low_confidence_drivers(enhanced_predictions)
            
            # Create enhanced race prediction
            race_prediction = EnhancedRacePrediction(
                race_name=race_info.get("name", race_name),
                circuit=race_info.get("circuit", race_name),
                track_type=track_type,
                weather_condition=weather_condition,
                season=race_info.get("season", 2025),
                round=race_info.get("round", 1),
                date=race_info.get("date", "2025-01-01"),
                driver_predictions=enhanced_predictions,
                total_simulations=num_simulations,
                simulation_time=simulation_time,
                model_version=self.model_version,
                generated_at=datetime.now().isoformat(),
                overall_uncertainty=overall_uncertainty,
                high_uncertainty_drivers=high_uncertainty_drivers,
                low_confidence_drivers=low_confidence_drivers,
                track_characteristics=track_characteristics,
                weather_impact=weather_impact_data,
                convergence_metrics=self.bayesian_layer.get_uncertainty_summary(),
                evidence_strength=self._calculate_evidence_strength(enhanced_predictions)
            )
            
            logger.info(f"✅ Enhanced predictions generated for {race_name} in {simulation_time:.2f}s")
            return race_prediction
            
        except Exception as e:
            logger.error(f"❌ Error generating enhanced predictions for {race_name}: {e}")
            # Return fallback prediction
            return await self._generate_fallback_prediction(race_name, weather_condition)
    
    async def _get_race_info(self, race_name: str) -> Optional[Dict[str, Any]]:
        """Get race information from external service or fallback"""
        try:
            # Try to get from external service (placeholder for now)
            # In production, this would call the calendar service
            return None
        except Exception as e:
            logger.warning(f"⚠️ Failed to get race info: {e}")
            return None
    
    def _get_fallback_race_info(self, race_name: str) -> Dict[str, Any]:
        """Get fallback race information"""
        # Try to match race name with fallback calendar
        for key, info in self.fallback_calendar.items():
            if race_name.lower() in key.lower() or key.lower() in race_name.lower():
                return info
        
        # Return generic fallback
        return {
            "name": race_name,
            "circuit": race_name,
            "track_type": "permanent",
            "season": 2025,
            "round": 1,
            "date": "2025-01-01",
            "location": "Unknown",
            "coordinates": {"lat": 0.0, "lon": 0.0}
        }
    
    def _create_enhanced_predictions(
        self,
        combined_predictions: Dict[str, Dict[str, Any]]
    ) -> List[EnhancedDriverPrediction]:
        """Create enhanced driver predictions from combined results"""
        enhanced_predictions = []
        
        for driver_id, prediction_data in combined_predictions.items():
            # Get driver profile
            driver_profile = self.driver_profiles.get(driver_id)
            if not driver_profile:
                continue
            
            # Create enhanced prediction
            enhanced_prediction = EnhancedDriverPrediction(
                driver_id=driver_id,
                driver_name=driver_profile.name,
                constructor=driver_profile.constructor,
                constructor_id=driver_profile.constructor_id,
                nationality=driver_profile.nationality,
                
                # Core predictions
                win_probability=prediction_data.get('win_probability', 0.0),
                podium_probability=prediction_data.get('mc_podium_probability', 0.0),
                points_probability=prediction_data.get('mc_points_probability', 0.0),
                expected_position=prediction_data.get('expected_position', 10.0),
                
                # Uncertainty quantification
                uncertainty_score=prediction_data.get('uncertainty_score', 0.5),
                confidence_score=1.0 - prediction_data.get('uncertainty_score', 0.5),
                
                # Monte Carlo results
                mc_win_probability=prediction_data.get('mc_win_probability', 0.0),
                mc_avg_position=prediction_data.get('mc_avg_position', 10.0),
                mc_std_position=prediction_data.get('mc_std_position', 5.0),
                mc_podium_probability=prediction_data.get('mc_podium_probability', 0.0),
                
                # Bayesian results
                bayesian_win_probability=prediction_data.get('bayesian_win_probability', 0.0),
                bayesian_expected_position=prediction_data.get('bayesian_expected_position', 10.0),
                bayesian_uncertainty=prediction_data.get('bayesian_uncertainty', 0.5),
                bayesian_evidence_strength=prediction_data.get('bayesian_evidence_strength', 0.5),
                
                # Credible intervals
                win_ci_95=prediction_data.get('win_ci_95', (0.0, 1.0)),
                win_ci_99=prediction_data.get('win_ci_99', (0.0, 1.0)),
                position_ci_95=prediction_data.get('position_ci_95', (1.0, 20.0)),
                position_ci_99=prediction_data.get('position_ci_99', (1.0, 20.0)),
                
                # Performance factors
                track_adjustment=prediction_data.get('track_adjustment', 1.0),
                weather_adjustment=prediction_data.get('weather_adjustment', 1.0),
                reliability_factor=prediction_data.get('reliability_factor', 1.0),
                season_form=driver_profile.recent_form,
                
                # Model diagnostics
                convergence_metric=prediction_data.get('convergence_metric', 0.5),
                effective_sample_size=prediction_data.get('effective_sample_size', 10.0)
            )
            
            enhanced_predictions.append(enhanced_prediction)
        
        # Sort by win probability (descending)
        enhanced_predictions.sort(key=lambda x: x.win_probability, reverse=True)
        
        return enhanced_predictions
    
    def _normalize_probabilities(self, predictions: List[EnhancedDriverPrediction]):
        """Normalize win probabilities to sum to 1.0"""
        total_prob = sum(p.win_probability for p in predictions)
        
        if total_prob > 0:
            for prediction in predictions:
                prediction.win_probability = prediction.win_probability / total_prob
    
    def _calculate_overall_uncertainty(self, predictions: List[EnhancedDriverPrediction]) -> float:
        """Calculate overall uncertainty across all drivers"""
        if not predictions:
            return 1.0
        
        uncertainty_scores = [p.uncertainty_score for p in predictions]
        return np.mean(uncertainty_scores)
    
    def _identify_high_uncertainty_drivers(self, predictions: List[EnhancedDriverPrediction]) -> List[str]:
        """Identify drivers with high uncertainty scores"""
        return [p.driver_name for p in predictions if p.uncertainty_score > 0.7]
    
    def _identify_low_confidence_drivers(self, predictions: List[EnhancedDriverPrediction]) -> List[str]:
        """Identify drivers with low confidence scores"""
        return [p.driver_name for p in predictions if p.confidence_score < 0.3]
    
    def _calculate_evidence_strength(self, predictions: List[EnhancedDriverPrediction]) -> Dict[str, float]:
        """Calculate evidence strength metrics"""
        if not predictions:
            return {}
        
        evidence_scores = [p.bayesian_evidence_strength for p in predictions]
        
        return {
            'average': np.mean(evidence_scores),
            'median': np.median(evidence_scores),
            'std': np.std(evidence_scores),
            'min': np.min(evidence_scores),
            'max': np.max(evidence_scores)
        }
    
    async def _generate_fallback_prediction(
        self,
        race_name: str,
        weather_condition: str
    ) -> EnhancedRacePrediction:
        """Generate fallback prediction when main system fails"""
        logger.info(f"🔄 Generating fallback prediction for {race_name}")
        
        # Create basic predictions for all drivers
        fallback_predictions = []
        
        for driver_id, profile in self.driver_profiles.items():
            # Simple fallback prediction
            fallback_prediction = EnhancedDriverPrediction(
                driver_id=driver_id,
                driver_name=profile.name,
                constructor=profile.constructor,
                constructor_id=profile.constructor_id,
                nationality=profile.nationality,
                
                # Basic predictions
                win_probability=0.05,  # Equal probability
                podium_probability=0.15,
                points_probability=0.5,
                expected_position=10.0,
                
                # High uncertainty for fallback
                uncertainty_score=0.8,
                confidence_score=0.2,
                
                # Placeholder values
                mc_win_probability=0.05,
                mc_avg_position=10.0,
                mc_std_position=5.0,
                mc_podium_probability=0.15,
                
                bayesian_win_probability=0.05,
                bayesian_expected_position=10.0,
                bayesian_uncertainty=0.8,
                bayesian_evidence_strength=0.2,
                
                win_ci_95=(0.01, 0.20),
                win_ci_99=(0.005, 0.30),
                position_ci_95=(5.0, 15.0),
                position_ci_99=(3.0, 18.0),
                
                track_adjustment=1.0,
                weather_adjustment=1.0,
                reliability_factor=1.0,
                season_form=profile.recent_form,
                
                convergence_metric=0.3,
                effective_sample_size=5.0
            )
            
            fallback_predictions.append(fallback_prediction)
        
        # Normalize probabilities
        self._normalize_probabilities(fallback_predictions)
        
        # Create fallback race prediction
        fallback_race = EnhancedRacePrediction(
            race_name=race_name,
            circuit=race_name,
            track_type="permanent",
            weather_condition=weather_condition,
            season=2025,
            round=1,
            date="2025-01-01",
            driver_predictions=fallback_predictions,
            total_simulations=0,
            simulation_time=0.0,
            model_version=f"{self.model_version}-fallback",
            generated_at=datetime.now().isoformat(),
            overall_uncertainty=0.8,
            high_uncertainty_drivers=[p.driver_name for p in fallback_predictions],
            low_confidence_drivers=[p.driver_name for p in fallback_predictions],
            track_characteristics={},
            weather_impact={},
            convergence_metrics={},
            evidence_strength={}
        )
        
        return fallback_race
    
    def export_predictions_json(
        self,
        race_prediction: EnhancedRacePrediction,
        filename: str = None
    ) -> str:
        """Export race predictions to detailed JSON format"""
        if filename is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"enhanced_predictions_{race_prediction.race_name.replace(' ', '_')}_{timestamp}.json"
        
        # Convert to dictionary
        export_data = {
            'race_info': {
                'name': race_prediction.race_name,
                'circuit': race_prediction.circuit,
                'track_type': race_prediction.track_type,
                'weather_condition': race_prediction.weather_condition,
                'season': race_prediction.season,
                'round': race_prediction.round,
                'date': race_prediction.date
            },
            'model_info': {
                'version': race_prediction.model_version,
                'total_simulations': race_prediction.total_simulations,
                'simulation_time': race_prediction.simulation_time,
                'generated_at': race_prediction.generated_at
            },
            'uncertainty_summary': {
                'overall_uncertainty': race_prediction.overall_uncertainty,
                'high_uncertainty_drivers': race_prediction.high_uncertainty_drivers,
                'low_confidence_drivers': race_prediction.low_confidence_drivers
            },
            'track_analysis': race_prediction.track_characteristics,
            'weather_analysis': race_prediction.weather_impact,
            'model_metrics': {
                'convergence': race_prediction.convergence_metrics,
                'evidence_strength': race_prediction.evidence_strength
            },
            'driver_predictions': []
        }
        
        # Add driver predictions
        for prediction in race_prediction.driver_predictions:
            driver_data = {
                'driver_id': prediction.driver_id,
                'driver_name': prediction.driver_name,
                'constructor': prediction.constructor,
                'nationality': prediction.nationality,
                
                'predictions': {
                    'win_probability': prediction.win_probability,
                    'podium_probability': prediction.podium_probability,
                    'points_probability': prediction.points_probability,
                    'expected_position': prediction.expected_position
                },
                
                'uncertainty': {
                    'uncertainty_score': prediction.uncertainty_score,
                    'confidence_score': prediction.confidence_score
                },
                
                'monte_carlo': {
                    'win_probability': prediction.mc_win_probability,
                    'avg_position': prediction.mc_avg_position,
                    'std_position': prediction.mc_std_position,
                    'podium_probability': prediction.mc_podium_probability
                },
                
                'bayesian': {
                    'win_probability': prediction.bayesian_win_probability,
                    'expected_position': prediction.bayesian_expected_position,
                    'uncertainty': prediction.bayesian_uncertainty,
                    'evidence_strength': prediction.bayesian_evidence_strength
                },
                
                'credible_intervals': {
                    'win_95': prediction.win_ci_95,
                    'win_99': prediction.win_ci_99,
                    'position_95': prediction.position_ci_95,
                    'position_99': prediction.position_ci_99
                },
                
                'performance_factors': {
                    'track_adjustment': prediction.track_adjustment,
                    'weather_adjustment': prediction.weather_adjustment,
                    'reliability_factor': prediction.reliability_factor,
                    'season_form': prediction.season_form
                },
                
                'model_diagnostics': {
                    'convergence_metric': prediction.convergence_metric,
                    'effective_sample_size': prediction.effective_sample_size
                }
            }
            
            export_data['driver_predictions'].append(driver_data)
        
        # Write to file
        with open(filename, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        logger.info(f"💾 Enhanced predictions exported to {filename}")
        return filename
    
    async def generate_season_predictions(
        self,
        races: List[str],
        weather_conditions: Dict[str, str] = None
    ) -> Dict[str, EnhancedRacePrediction]:
        """Generate predictions for multiple races"""
        if weather_conditions is None:
            weather_conditions = {race: "dry" for race in races}
        
        season_predictions = {}
        
        for race in races:
            weather = weather_conditions.get(race, "dry")
            try:
                prediction = await self.predict_race_enhanced(race, weather)
                season_predictions[race] = prediction
                logger.info(f"✅ Generated predictions for {race}")
            except Exception as e:
                logger.error(f"❌ Failed to generate predictions for {race}: {e}")
                # Generate fallback
                fallback = await self._generate_fallback_prediction(race, weather)
                season_predictions[race] = fallback
        
        return season_predictions
    
    def export_season_dataset(
        self,
        season_predictions: Dict[str, EnhancedRacePrediction],
        filename: str = None
    ) -> str:
        """Export full season dataset to JSON"""
        if filename is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"f1_2025_season_predictions_{timestamp}.json"
        
        season_data = {
            'season_info': {
                'year': 2025,
                'total_races': len(season_predictions),
                'model_version': self.model_version,
                'export_timestamp': datetime.now().isoformat()
            },
            'races': {}
        }
        
        for race_name, prediction in season_predictions.items():
            # Export individual race predictions
            race_filename = self.export_predictions_json(prediction)
            
            season_data['races'][race_name] = {
                'race_info': {
                    'name': prediction.race_name,
                    'circuit': prediction.circuit,
                    'track_type': prediction.track_type,
                    'weather_condition': prediction.weather_condition,
                    'date': prediction.date
                },
                'predictions_file': race_filename,
                'top_3_drivers': [
                    {
                        'position': i + 1,
                        'driver_name': prediction.driver_predictions[i].driver_name,
                        'win_probability': prediction.driver_predictions[i].win_probability,
                        'constructor': prediction.driver_predictions[i].constructor
                    }
                    for i in range(min(3, len(prediction.driver_predictions)))
                ],
                'uncertainty_summary': {
                    'overall_uncertainty': prediction.overall_uncertainty,
                    'high_uncertainty_drivers': prediction.high_uncertainty_drivers
                }
            }
        
        # Write season data
        with open(filename, 'w') as f:
            json.dump(season_data, f, indent=2)
        
        logger.info(f"💾 Season dataset exported to {filename}")
        return filename
