"""
Enhanced Hybrid Monte Carlo Prediction Service
Integrates Monte Carlo simulations with hybrid prediction model for robust F1 predictions
"""

import json
import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

class EnhancedHybridMonteCarloService:
    """
    Enhanced hybrid prediction service that combines:
    1. Monte Carlo simulations (30,000 per race)
    2. Calibration data integration
    3. Track-specific factors
    4. Driver and team performance metrics
    """
    
    def __init__(self):
        self.predictions_dir = 'predictions'
        self.cache = {}
        self.last_updated = None
        self.monte_carlo_simulations = 30000
        
    def generate_monte_carlo_predictions(self, race_identifier: str, season: int = 2025) -> Optional[Dict[str, Any]]:
        """
        Generate Monte Carlo predictions for a specific race using hybrid approach
        
        Args:
            race_identifier: Race name, circuit ID, or round number
            season: F1 season year
            
        Returns:
            Enhanced hybrid predictions with Monte Carlo results
        """
        try:
            # Find race data
            race_data = self._find_race(race_identifier, season)
            if not race_data:
                logger.warning(f"Race not found: {race_identifier}")
                return None
            
            # Generate Monte Carlo predictions
            predictions = self._run_monte_carlo_simulation(race_data)
            if not predictions:
                logger.warning(f"Failed to generate predictions for race: {race_identifier}")
                return None
            
            # Save predictions to file
            self._save_predictions(predictions, race_data)
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error generating Monte Carlo predictions: {e}")
            return None
    
    def get_race_predictions(self, race_identifier: str, season: int = 2025) -> Optional[Dict[str, Any]]:
        """
        Get predictions for a specific race (load existing or generate new)
        
        Args:
            race_identifier: Race name, circuit ID, or round number
            season: F1 season year
            
        Returns:
            Race predictions in API format
        """
        try:
            # Try to find the race
            race_data = self._find_race(race_identifier, season)
            if not race_data:
                logger.warning(f"Race not found: {race_identifier}")
                return None
            
            # Try to load existing predictions
            predictions = self._load_race_predictions(race_data['circuit'])
            if not predictions:
                # Generate new predictions if none exist
                logger.info(f"Generating new Monte Carlo predictions for {race_identifier}")
                predictions = self.generate_monte_carlo_predictions(race_identifier, season)
            
            if not predictions:
                return None
            
            # Convert to API format
            api_format = self._convert_to_api_format(predictions, race_data)
            return api_format
            
        except Exception as e:
            logger.error(f"Error getting race predictions: {e}")
            return None
    
    def get_next_race_predictions(self, season: int = 2025) -> Optional[Dict[str, Any]]:
        """
        Get predictions for the next upcoming race
        
        Args:
            season: F1 season year
            
        Returns:
            Next race predictions in API format
        """
        try:
            # Find the next race
            next_race = self._find_next_race(season)
            if not next_race:
                logger.warning("No upcoming races found")
                return None
            
            # Get predictions for the next race
            return self.get_race_predictions(next_race['race'], season)
            
        except Exception as e:
            logger.error(f"Error getting next race predictions: {e}")
            return None
    
    def get_simple_predictions(self, race_identifier: str, season: int = 2025) -> Optional[Dict[str, Any]]:
        """
        Get simplified predictions for API consumption
        
        Args:
            race_identifier: Race name, circuit ID, or round number
            season: F1 season year
            
        Returns:
            Simplified predictions in API format
        """
        try:
            race_data = self._find_race(race_identifier, season)
            if not race_data:
                return None
            
            predictions = self._load_race_predictions(race_data['circuit'])
            if not predictions:
                return None
            
            # Convert to simple API format
            simple_format = self._convert_to_simple_api_format(predictions, race_data)
            return simple_format
            
        except Exception as e:
            logger.error(f"Error getting simple predictions: {e}")
            return None
    
    def _run_monte_carlo_simulation(self, race_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Run Monte Carlo simulation for a race using hybrid approach
        
        Args:
            race_data: Race information
            
        Returns:
            Monte Carlo simulation results
        """
        try:
            circuit_id = race_data.get('circuit', '').lower()
            race_name = race_data.get('race', '')
            
            logger.info(f"🏎️ Running {self.monte_carlo_simulations:,} Monte Carlo simulations for {race_name}")
            
            # Load required data
            drivers = self._load_drivers()
            track_features = self._load_track_features()
            driver_calibration = self._load_driver_calibration()
            team_calibration = self._load_team_calibration()
            
            # Get track-specific factors
            track_data = track_features.get(circuit_id, {})
            track_factors = self._calculate_track_factors(track_data)
            
            # Generate predictions for each driver
            driver_predictions = []
            
            for driver in drivers:
                # Calculate calibrated performance using Monte Carlo
                performance = self._calculate_driver_performance_monte_carlo(
                    driver, track_factors, driver_calibration, team_calibration
                )
                
                driver_prediction = {
                    'driver_id': driver.get('driverId', ''),
                    'driver_name': driver.get('name', ''),
                    'team': driver.get('team', ''),
                    'driver_number': driver.get('number', 0),
                    'nationality': driver.get('nationality', ''),
                    
                    # Monte Carlo results
                    'monte_carlo_results': performance['simulation_results'],
                    
                    # Calibration factors
                    'calibration_factors': performance['calibration_factors'],
                    
                    # Track factors
                    'track_factors': track_factors
                }
                
                driver_predictions.append(driver_prediction)
            
            # Sort by win probability
            driver_predictions.sort(
                key=lambda x: x['monte_carlo_results']['win_probability'], 
                reverse=True
            )
            
            # Create race summary
            race_summary = {
                'race_name': race_name,
                'circuit': circuit_id,
                'round': race_data.get('round', 1),
                'date': race_data.get('date', ''),
                'country': race_data.get('country', ''),
                'city': race_data.get('city', ''),
                
                'track_characteristics': track_factors,
                
                'monte_carlo_metadata': {
                    'num_simulations': self.monte_carlo_simulations,
                    'model_version': '2025-Hybrid-MonteCarlo-v1.0'
                },
                
                'prediction_metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'model_version': '2025-Hybrid-MonteCarlo-v1.0',
                    'total_drivers': len(driver_predictions),
                    'track_type': track_factors.get('type', 'permanent')
                },
                
                'top_predictions': {
                    'favorite': driver_predictions[0] if driver_predictions else None,
                    'dark_horse': driver_predictions[3] if len(driver_predictions) > 3 else None,
                    'qualifying_favorite': min(driver_predictions, key=lambda x: x['monte_carlo_results']['expected_position']) if driver_predictions else None
                },
                
                'driver_predictions': driver_predictions
            }
            
            logger.info(f"✅ Monte Carlo predictions completed for {race_name}")
            return race_summary
            
        except Exception as e:
            logger.error(f"Error running Monte Carlo simulation: {e}")
            return None
    
    def _calculate_driver_performance_monte_carlo(
        self, 
        driver: Dict[str, Any], 
        track_factors: Dict[str, Any],
        driver_calibration: Dict[str, Any],
        team_calibration: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate driver performance using Monte Carlo simulation with calibration
        """
        driver_id = driver.get('driverId', '')
        team = driver.get('team', '')
        
        # Get calibration factors
        driver_cal = driver_calibration.get(driver_id, {})
        team_cal = team_calibration.get(team, {})
        
        # Base weights
        driver_weight = driver_cal.get('weight', 1.0)
        team_weight = team_cal.get('weight', 1.0)
        
        # Driver factors
        tier = driver_cal.get('tier', 3)
        form_factor = driver_cal.get('form_factor', 1.0)
        consistency = driver_cal.get('consistency', 0.8)
        
        # Team factors
        team_aero = team_cal.get('aero_efficiency', 1.0)
        team_power = team_cal.get('power_unit', 1.0)
        team_reliability = team_cal.get('reliability', 1.0)
        
        # Track adjustments
        track_type = track_factors.get('type', 'permanent')
        weather_sensitivity = track_factors.get('weather_sensitivity', 1.0)
        overtaking_factor = track_factors.get('overtaking_factor', 1.0)
        
        # Base performance calculation
        base_performance = driver_weight * team_weight * form_factor
        
        # Run Monte Carlo simulation
        simulation_results = self._run_single_driver_simulation(
            base_performance, tier, consistency, team_aero, team_power,
            team_reliability, track_type, weather_sensitivity, overtaking_factor
        )
        
        return {
            'base_performance': base_performance,
            'simulation_results': simulation_results,
            'calibration_factors': {
                'driver_weight': driver_weight,
                'team_weight': team_weight,
                'tier': tier,
                'form_factor': form_factor,
                'consistency': consistency,
                'team_aero': team_aero,
                'team_power': team_power,
                'team_reliability': team_reliability
            }
        }
    
    def _run_single_driver_simulation(
        self,
        base_performance: float,
        tier: int,
        consistency: float,
        team_aero: float,
        team_power: float,
        team_reliability: float,
        track_type: str,
        weather_sensitivity: float,
        overtaking_factor: float
    ) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation for a single driver
        """
        # Generate random samples
        np.random.seed(int(datetime.now().timestamp() * 1000) % 2**32)
        
        # Performance variations
        form_variation = np.random.normal(0, 0.1, self.monte_carlo_simulations)
        consistency_variation = np.random.normal(0, 1 - consistency, self.monte_carlo_simulations)
        weather_variation = np.random.normal(0, weather_sensitivity * 0.15, self.monte_carlo_simulations)
        track_variation = np.random.normal(0, 0.1, self.monte_carlo_simulations)
        reliability_variation = np.random.normal(0, (1 - team_reliability) * 0.2, self.monte_carlo_simulations)
        
        # Calculate final scores
        final_scores = (
            base_performance + 
            form_variation + 
            consistency_variation + 
            weather_variation + 
            track_variation + 
            reliability_variation
        )
        
        # Ensure positive scores
        final_scores = np.maximum(final_scores, 0.1)
        
        # Calculate statistics
        mean_score = np.mean(final_scores)
        std_score = np.std(final_scores)
        
        # Calculate position probabilities
        positions = self._calculate_positions(final_scores)
        win_prob = np.sum(positions == 1) / self.monte_carlo_simulations
        podium_prob = np.sum(positions <= 3) / self.monte_carlo_simulations
        points_prob = np.sum(positions <= 10) / self.monte_carlo_simulations
        
        # Confidence intervals
        percentile_95 = np.percentile(final_scores, [2.5, 97.5])
        percentile_99 = np.percentile(final_scores, [0.5, 99.5])
        
        return {
            'mean_score': float(mean_score),
            'std_score': float(std_score),
            'win_probability': float(win_prob),
            'podium_probability': float(podium_prob),
            'points_probability': float(points_prob),
            'confidence_interval_95': [float(percentile_95[0]), float(percentile_95[1])],
            'confidence_interval_99': [float(percentile_99[0]), float(percentile_99[1])],
            'expected_position': float(np.mean(positions)),
            'position_std': float(np.std(positions)),
            'position_range': [int(np.min(positions)), int(np.max(positions))]
        }
    
    def _calculate_positions(self, scores: np.ndarray) -> np.ndarray:
        """Calculate finishing positions based on performance scores"""
        sorted_indices = np.argsort(scores)[::-1]
        positions = np.zeros_like(scores)
        
        for i, idx in enumerate(sorted_indices):
            positions[idx] = i + 1
            
        return positions
    
    def _calculate_track_factors(self, track_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate track-specific performance factors"""
        factors = {
            'type': track_data.get('type', 'permanent'),
            'length': track_data.get('length', 0),
            'corners': track_data.get('corners', 0),
            'overtaking_opportunities': track_data.get('overtaking_opportunities', 2),
            'weather_sensitivity': track_data.get('weather_sensitivity', 'medium'),
            'overtaking_factor': 0.8 + (track_data.get('overtaking_opportunities', 2) * 0.1)
        }
        
        return factors
    
    def _find_race(self, race_identifier: str, season: int) -> Optional[Dict[str, Any]]:
        """Find race data by identifier"""
        try:
            with open('f1_calendar_2025.json', 'r') as f:
                calendar_data = json.load(f)
                calendar = calendar_data.get('calendar', [])
            
            for race in calendar:
                if (race.get('race', '').lower() == race_identifier.lower() or
                    race.get('circuit', '').lower() == race_identifier.lower() or
                    str(race.get('round', '')) == str(race_identifier)):
                    return race
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding race: {e}")
            return None
    
    def _find_next_race(self, season: int) -> Optional[Dict[str, Any]]:
        """Find the next upcoming race"""
        try:
            with open('f1_calendar_2025.json', 'r') as f:
                calendar_data = json.load(f)
                calendar = calendar_data.get('calendar', [])
            
            today = datetime.now()
            for race in calendar:
                try:
                    race_date = datetime.fromisoformat(race.get('date', '').replace('Z', '+00:00'))
                    if race_date > today:
                        return race
                except:
                    continue
            
            return calendar[0] if calendar else None
            
        except Exception as e:
            logger.error(f"Error finding next race: {e}")
            return None
    
    def _load_race_predictions(self, circuit_id: str) -> Optional[Dict[str, Any]]:
        """Load predictions for a specific circuit"""
        try:
            # Try Monte Carlo predictions first
            monte_carlo_file = f"{self.predictions_dir}/{circuit_id}_monte_carlo_predictions.json"
            if os.path.exists(monte_carlo_file):
                with open(monte_carlo_file, 'r') as f:
                    return json.load(f)
            
            # Fallback to regular predictions
            regular_file = f"{self.predictions_dir}/{circuit_id}_predictions.json"
            if os.path.exists(regular_file):
                with open(regular_file, 'r') as f:
                    return json.load(f)
            
            return None
            
        except Exception as e:
            logger.error(f"Error loading race predictions: {e}")
            return None
    
    def _save_predictions(self, predictions: Dict[str, Any], race_data: Dict[str, Any]):
        """Save predictions to file"""
        try:
            circuit_id = race_data.get('circuit', '').lower()
            filename = f"{self.predictions_dir}/{circuit_id}_monte_carlo_predictions.json"
            
            with open(filename, 'w') as f:
                json.dump(predictions, f, indent=2)
            
            logger.info(f"✅ Saved Monte Carlo predictions to {filename}")
            
        except Exception as e:
            logger.error(f"Error saving predictions: {e}")
    
    def _load_drivers(self) -> List[Dict[str, Any]]:
        """Load driver data"""
        try:
            with open('drivers_2025.json', 'r') as f:
                data = json.load(f)
                return data.get('drivers', [])
        except Exception as e:
            logger.error(f"Error loading drivers: {e}")
            return []
    
    def _load_track_features(self) -> Dict[str, Any]:
        """Load track features"""
        try:
            with open('track_features_database.json', 'r') as f:
                data = json.load(f)
                return data.get('track_features', {})
        except Exception as e:
            logger.error(f"Error loading track features: {e}")
            return {}
    
    def _load_driver_calibration(self) -> Dict[str, Any]:
        """Load driver calibration data"""
        try:
            with open('driver_calibration.json', 'r') as f:
                data = json.load(f)
                return data.get('driver_calibration', {})
        except Exception as e:
            logger.error(f"Error loading driver calibration: {e}")
            return {}
    
    def _load_team_calibration(self) -> Dict[str, Any]:
        """Load team calibration data"""
        try:
            with open('driver_calibration.json', 'r') as f:
                data = json.load(f)
                return data.get('team_calibration', {})
        except Exception as e:
            logger.error(f"Error loading team calibration: {e}")
            return {}
    
    def _convert_to_api_format(self, predictions: Dict[str, Any], race_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert predictions to full API format"""
        try:
            driver_predictions = predictions.get('driver_predictions', [])
            
            api_predictions = []
            for driver_pred in driver_predictions:
                monte_carlo = driver_pred.get('monte_carlo_results', {})
                
                api_prediction = {
                    'driver_id': driver_pred.get('driver_id', ''),
                    'driver_name': driver_pred.get('driver_name', ''),
                    'constructor': driver_pred.get('team', ''),
                    'probability': monte_carlo.get('win_probability', 0.0),
                    'confidence': 1.0 - monte_carlo.get('position_std', 0.0) / 20.0,
                    'qualifying_position': int(monte_carlo.get('expected_position', 10)),
                    'season_points': 0,
                    'recent_form': driver_pred.get('calibration_factors', {}).get('form_factor', 1.0),
                    'track_history': 1.0,
                    'weather_factor': 1.0,
                    'weather_sensitivity': {},
                    'constructor_info': {}
                }
                
                api_predictions.append(api_prediction)
            
            api_response = {
                'race': race_data.get('race', ''),
                'round': race_data.get('round', 1),
                'season': race_data.get('season', 2025),
                'date': race_data.get('date', ''),
                'track_type': predictions.get('track_characteristics', {}).get('type', 'permanent'),
                'weather_conditions': {},
                'predictions': api_predictions,
                'generated_at': predictions.get('prediction_metadata', {}).get('generated_at', ''),
                'model_version': predictions.get('prediction_metadata', {}).get('model_version', ''),
                'circuit_info': {
                    'name': race_data.get('circuit', ''),
                    'country': race_data.get('country', ''),
                    'city': race_data.get('city', '')
                },
                'monte_carlo_metadata': predictions.get('monte_carlo_metadata', {})
            }
            
            return api_response
            
        except Exception as e:
            logger.error(f"Error converting to API format: {e}")
            return {}
    
    def _convert_to_simple_api_format(self, predictions: Dict[str, Any], race_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert predictions to simple API format"""
        try:
            driver_predictions = predictions.get('driver_predictions', [])
            
            simple_predictions = []
            for driver_pred in driver_predictions:
                monte_carlo = driver_pred.get('monte_carlo_results', {})
                
                simple_prediction = {
                    'position': int(monte_carlo.get('expected_position', 10)),
                    'driverId': driver_pred.get('driver_id', ''),
                    'driverName': driver_pred.get('driver_name', ''),
                    'constructor': driver_pred.get('team', ''),
                    'probability': monte_carlo.get('win_probability', 0.0),
                    'confidence': 1.0 - monte_carlo.get('position_std', 0.0) / 20.0,
                    'winProbPct': monte_carlo.get('win_probability', 0.0) * 100,
                    'podiumProbPct': monte_carlo.get('podium_probability', 0.0) * 100,
                    'pointsProbPct': monte_carlo.get('points_probability', 0.0) * 100
                }
                
                simple_predictions.append(simple_prediction)
            
            # Sort by position
            simple_predictions.sort(key=lambda x: x['position'])
            
            simple_response = {
                'race': race_data.get('race', ''),
                'round': race_data.get('round', 1),
                'season': race_data.get('season', 2025),
                'date': race_data.get('date', ''),
                'track_type': predictions.get('track_characteristics', {}).get('type', 'permanent'),
                'predictions': simple_predictions,
                'generated_at': predictions.get('prediction_metadata', {}).get('generated_at', ''),
                'model_version': predictions.get('prediction_metadata', {}).get('model_version', ''),
                'monte_carlo_metadata': predictions.get('monte_carlo_metadata', {})
            }
            
            return simple_response
            
        except Exception as e:
            logger.error(f"Error converting to simple API format: {e}")
            return {}

# Create global instance
enhanced_hybrid_monte_carlo_service = EnhancedHybridMonteCarloService()
