"""
Enhanced Monte Carlo Service for F1 Predictions
Integrates Monte Carlo simulations with API endpoints for frontend consumption
"""

import json
import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

class EnhancedMonteCarloService:
    """
    Service that provides Monte Carlo predictions through API endpoints
    """
    
    def __init__(self):
        self.predictions_dir = 'predictions'
        self.cache = {}
        self.last_updated = None
        
    def get_race_predictions(self, race_identifier: str, season: int = 2025) -> Optional[Dict[str, Any]]:
        """
        Get Monte Carlo predictions for a specific race
        
        Args:
            race_identifier: Race name, circuit ID, or round number
            season: F1 season year
            
        Returns:
            Race predictions in API format
        """
        try:
            # Try to find the race by different identifiers
            race_data = self._find_race(race_identifier, season)
            if not race_data:
                logger.warning(f"Race not found: {race_identifier}")
                return None
            
            # Load predictions for this race
            predictions = self._load_race_predictions(race_data['circuit'])
            if not predictions:
                logger.warning(f"No predictions found for race: {race_identifier}")
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
    
    def _find_race(self, race_identifier: str, season: int) -> Optional[Dict[str, Any]]:
        """Find race data by identifier"""
        try:
            # Load calendar
            with open('f1_calendar_2025.json', 'r') as f:
                calendar_data = json.load(f)
                calendar = calendar_data.get('calendar', [])
            
            # Try to find by race name
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
            # Load calendar
            with open('f1_calendar_2025.json', 'r') as f:
                calendar_data = json.load(f)
                calendar = calendar_data.get('calendar', [])
            
            # Find the next race (simplified - could be enhanced with date logic)
            today = datetime.now()
            for race in calendar:
                try:
                    race_date = datetime.fromisoformat(race.get('date', '').replace('Z', '+00:00'))
                    if race_date > today:
                        return race
                except:
                    continue
            
            # If no future races found, return the first race
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
    
    def _convert_to_api_format(self, predictions: Dict[str, Any], race_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert predictions to full API format"""
        try:
            driver_predictions = predictions.get('driver_predictions', [])
            
            # Convert driver predictions to API format
            api_predictions = []
            for driver_pred in driver_predictions:
                monte_carlo = driver_pred.get('monte_carlo_results', {})
                
                api_prediction = {
                    'driver_id': driver_pred.get('driver_id', ''),
                    'driver_name': driver_pred.get('driver_name', ''),
                    'constructor': driver_pred.get('team', ''),
                    'probability': monte_carlo.get('win_probability', 0.0),
                    'confidence': 1.0 - monte_carlo.get('position_std', 0.0) / 20.0,  # Normalize confidence
                    'qualifying_position': int(monte_carlo.get('expected_position', 10)),
                    'season_points': 0,  # Could be loaded from actual data
                    'recent_form': driver_pred.get('calibration_factors', {}).get('form_factor', 1.0),
                    'track_history': 1.0,  # Default value
                    'weather_factor': 1.0,  # Default value
                    'weather_sensitivity': {},
                    'constructor_info': {}
                }
                
                api_predictions.append(api_prediction)
            
            # Create API response
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
            
            # Convert to simple format
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
            
            # Create simple API response
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
    
    def get_available_races(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Get list of available races with predictions"""
        try:
            available_races = []
            
            # Load calendar
            with open('f1_calendar_2025.json', 'r') as f:
                calendar_data = json.load(f)
                calendar = calendar_data.get('calendar', [])
            
            # Check which races have predictions
            for race in calendar:
                circuit_id = race.get('circuit', '').lower()
                
                # Check for Monte Carlo predictions
                monte_carlo_file = f"{self.predictions_dir}/{circuit_id}_monte_carlo_predictions.json"
                regular_file = f"{self.predictions_dir}/{circuit_id}_predictions.json"
                
                has_predictions = os.path.exists(monte_carlo_file) or os.path.exists(regular_file)
                
                if has_predictions:
                    available_races.append({
                        'id': str(race.get('round', '')),
                        'name': race.get('race', ''),
                        'circuit': race.get('circuit', ''),
                        'country': race.get('country', ''),
                        'city': race.get('city', ''),
                        'date': race.get('date', ''),
                        'round': race.get('round', 1),
                        'has_predictions': True,
                        'prediction_type': 'Monte Carlo' if os.path.exists(monte_carlo_file) else 'Standard'
                    })
            
            return available_races
            
        except Exception as e:
            logger.error(f"Error getting available races: {e}")
            return []

# Create global instance
enhanced_monte_carlo_service = EnhancedMonteCarloService()
