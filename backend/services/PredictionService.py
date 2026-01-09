import os
import sys
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.drivers import f1_data_service
from main import predict_race_winner_probabilities, load_race_model

# Import the new ML service
try:
    from .MLPredictionService import ml_prediction_service
    ML_SERVICE_AVAILABLE = True
except ImportError:
    ML_SERVICE_AVAILABLE = False
    ml_prediction_service = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridPredictionService:
    """
    Hybrid F1 Prediction Service that combines:
    1. Live F1 data (qualifying, standings, etc.)
    2. ML model predictions
    3. Calibration adjustments (track, driver, team factors)
    """
    
    def __init__(self):
        self.ml_model_loaded = load_race_model()
        if self.ml_model_loaded:
            logger.info("✅ ML model loaded successfully")
        else:
            logger.warning("⚠️ ML model not available - using calibration only")
        
        # Track-specific calibration factors
        self.track_calibration = {
            "Monaco": {
                "Ferrari": 1.15,  # Ferrari typically strong at Monaco
                "Red Bull Racing": 1.1,
                "McLaren": 0.95,
                "Mercedes": 0.9
            },
            "Monza": {
                "Ferrari": 1.2,   # Ferrari home advantage
                "Red Bull Racing": 1.1,
                "McLaren": 1.05,
                "Mercedes": 1.0
            },
            "Silverstone": {
                "McLaren": 1.15,  # McLaren home advantage
                "Red Bull Racing": 1.1,
                "Ferrari": 1.0,
                "Mercedes": 1.05
            },
            "Spa": {
                "Red Bull Racing": 1.15,  # Red Bull strong at Spa
                "Ferrari": 1.05,
                "McLaren": 1.0,
                "Mercedes": 0.95
            }
        }
        
        # Driver-specific calibration factors
        self.driver_calibration = {
            "Max Verstappen": 1.2,      # Current dominant driver
            "Charles Leclerc": 1.1,     # Strong qualifier
            "Lando Norris": 1.05,       # Rising star
            "Lewis Hamilton": 1.0,      # Experienced
            "George Russell": 0.95,     # Good but not peak
            "Oscar Piastri": 0.9,       # Young talent
            "Carlos Sainz": 0.95,       # Consistent
            "Fernando Alonso": 1.0,     # Experienced
            "Lance Stroll": 0.85,       # Inconsistent
            "Pierre Gasly": 0.9,        # Midfield
            "Esteban Ocon": 0.9,        # Midfield
            "Yuki Tsunoda": 0.85,       # Developing
            "Nico Hulkenberg": 0.85,    # Experienced midfield
            "Alex Albon": 0.9,          # Good qualifier
            "Kimi Antonelli": 0.8,      # Rookie
            "Oliver Bearman": 0.8,      # Rookie
            "Franco Colapinto": 0.8,    # Rookie
            "Liam Lawson": 0.85,        # Young
            "Isack Hadjar": 0.8,        # Rookie
            "Gabriel Bortoleto": 0.8    # Rookie
        }
    
    def get_race_predictions(self, circuit: str, season: int = 2025, date: str = None) -> Dict[str, Any]:
        """
        Get comprehensive race predictions using live data + ML + calibration
        
        Args:
            circuit: Circuit name (e.g., "Monza", "Silverstone")
            season: F1 season year
            date: Race date (optional, for historical predictions)
            
        Returns:
            Dictionary with predictions, live data, and metadata
        """
        try:
            # 1. Fetch live entry list (qualifying + standings)
            logger.info(f"Fetching live data for {circuit} {season}")
            entry_list = f1_data_service.get_entry_list_for_gp(circuit, season)
            
            if not entry_list:
                logger.error(f"Failed to fetch entry list for {circuit}")
                return self._get_fallback_predictions(circuit)
            
            # 2. Get ML predictions - try new ML service first, fallback to old system
            ml_predictions = None
            ml_service_used = False
            
            if ML_SERVICE_AVAILABLE and ml_prediction_service and ml_prediction_service.models_loaded:
                # Use new ML service
                try:
                    drivers_for_ml = [
                        {"name": entry["driver"], "team": entry["team"]} 
                        for entry in entry_list
                    ]
                    ml_result = ml_prediction_service.get_race_predictions(circuit, season, date, drivers_for_ml)
                    if ml_result and ml_result.get("status") == "success":
                        ml_predictions = ml_result.get("ml_predictions")
                        ml_service_used = True
                        logger.info("✅ Using new ML service for predictions")
                except Exception as e:
                    logger.warning(f"New ML service failed, falling back to old system: {e}")
            
            # Fallback to old ML system if new service unavailable
            if not ml_service_used and self.ml_model_loaded:
                drivers_for_ml = [
                    {"name": entry["driver"], "team": entry["team"]} 
                    for entry in entry_list
                ]
                ml_predictions = predict_race_winner_probabilities(circuit, date, drivers_for_ml)
                logger.info("✅ Using legacy ML system for predictions")
            
            # 3. Apply calibration adjustments
            calibrated_predictions = self._apply_calibration(
                entry_list, ml_predictions, circuit
            )
            
            # 4. Get next race info for context
            next_race = f1_data_service.get_next_race(season)
            
            return {
                "status": "success",
                "race": {
                    "circuit": circuit,
                    "season": season,
                    "date": date,
                    "next_race": next_race
                },
                "predictions": calibrated_predictions,
                "live_data": {
                    "entry_list": entry_list,
                    "data_source": "Jolpica API" if f1_data_service.jolpica_available else "Ergast API",
                    "fetched_at": datetime.now().isoformat()
                },
                "metadata": {
                    "ml_model_used": ml_service_used or self.ml_model_loaded,
                    "ml_service_version": "v2.0" if ml_service_used else "v1.0",
                    "calibration_applied": True,
                    "total_drivers": len(entry_list)
                }
            }
            
        except Exception as e:
            logger.error(f"Prediction failed for {circuit}: {e}")
            return self._get_fallback_predictions(circuit)
    
    def _apply_calibration(self, entry_list: List[Dict], ml_predictions: Optional[List], circuit: str) -> List[Dict]:
        """
        Apply calibration adjustments to predictions
        """
        calibrated = []
        
        for i, entry in enumerate(entry_list):
            driver = entry["driver"]
            team = entry["team"]
            qualifying_pos = entry["qualifying_position"]
            season_points = entry["season_points"]
            
            # Base probability from qualifying position (inverse relationship)
            base_prob = self._qualifying_to_probability(qualifying_pos)
            
            # Apply ML predictions if available
            if ml_predictions and i < len(ml_predictions):
                ml_prob = ml_predictions[i]["prob"]
                # Blend ML and qualifying-based probability
                base_prob = 0.7 * ml_prob + 0.3 * base_prob
            
            # Apply track-specific calibration
            track_factor = self.track_calibration.get(circuit, {}).get(team, 1.0)
            
            # Apply driver-specific calibration
            driver_factor = self.driver_calibration.get(driver, 1.0)
            
            # Apply qualifying position bonus/penalty
            qualifying_factor = self._get_qualifying_factor(qualifying_pos)
            
            # Apply season points factor (form)
            form_factor = self._get_form_factor(season_points)
            
            # Calculate final probability
            final_prob = base_prob * track_factor * driver_factor * qualifying_factor * form_factor
            
            calibrated.append({
                "driver": driver,
                "team": team,
                "qualifying_position": qualifying_pos,
                "season_points": season_points,
                "win_probability": float(final_prob),
                "podium_probability": float(self._win_to_podium_probability(final_prob)),
                "calibration_factors": {
                    "track_factor": track_factor,
                    "driver_factor": driver_factor,
                    "qualifying_factor": qualifying_factor,
                    "form_factor": form_factor
                }
            })
        
        # Normalize probabilities to sum to 1
        total_prob = sum(p["win_probability"] for p in calibrated)
        if total_prob > 0:
            for p in calibrated:
                p["win_probability"] = p["win_probability"] / total_prob
                p["podium_probability"] = p["podium_probability"] / total_prob
        
        # Sort by win probability (descending)
        calibrated.sort(key=lambda x: x["win_probability"], reverse=True)
        
        return calibrated
    
    def _qualifying_to_probability(self, qualifying_pos: int) -> float:
        """Convert qualifying position to base win probability"""
        # Exponential decay based on qualifying position
        if qualifying_pos == 1:
            return 0.25  # Pole position gets 25% base probability
        elif qualifying_pos <= 3:
            return 0.15
        elif qualifying_pos <= 5:
            return 0.10
        elif qualifying_pos <= 10:
            return 0.05
        else:
            return 0.02
    
    def _get_qualifying_factor(self, qualifying_pos: int) -> float:
        """Get qualifying position adjustment factor"""
        if qualifying_pos == 1:
            return 1.3  # Pole position bonus
        elif qualifying_pos <= 3:
            return 1.2
        elif qualifying_pos <= 5:
            return 1.1
        elif qualifying_pos <= 10:
            return 1.0
        else:
            return 0.9
    
    def _get_form_factor(self, season_points: float) -> float:
        """Get form factor based on season points"""
        if season_points >= 200:
            return 1.2  # Championship contender
        elif season_points >= 100:
            return 1.1  # Strong season
        elif season_points >= 50:
            return 1.0  # Average
        else:
            return 0.9  # Struggling
    
    def _win_to_podium_probability(self, win_prob: float) -> float:
        """Convert win probability to podium probability"""
        # Podium is roughly 3x more likely than winning
        return min(win_prob * 3, 0.95)
    
    def _get_fallback_predictions(self, circuit: str) -> Dict[str, Any]:
        """Fallback predictions when live data is unavailable"""
        fallback_drivers = [
            {"driver": "Max Verstappen", "team": "Red Bull Racing", "qualifying_position": 1, "season_points": 200},
            {"driver": "Charles Leclerc", "team": "Ferrari", "qualifying_position": 2, "season_points": 180},
            {"driver": "Lando Norris", "team": "McLaren", "qualifying_position": 3, "season_points": 160},
            {"driver": "Lewis Hamilton", "team": "Ferrari", "qualifying_position": 4, "season_points": 150},
            {"driver": "George Russell", "team": "Mercedes", "qualifying_position": 5, "season_points": 140}
        ]
        
        return {
            "status": "fallback",
            "race": {"circuit": circuit, "season": 2025},
            "predictions": self._apply_calibration(fallback_drivers, None, circuit),
            "live_data": {"entry_list": fallback_drivers, "data_source": "fallback"},
            "metadata": {"ml_model_used": False, "calibration_applied": True}
        }

    def retrain_ml_models(self) -> Dict[str, Any]:
        """Trigger retraining of ML models"""
        try:
            if ML_SERVICE_AVAILABLE and ml_prediction_service:
                success = ml_prediction_service.retrain_models()
                if success:
                    return {
                        "status": "success",
                        "message": "ML models retrained successfully",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    return {
                        "status": "error",
                        "message": "ML model retraining failed",
                        "timestamp": datetime.now().isoformat()
                    }
            else:
                return {
                    "status": "error",
                    "message": "ML service not available",
                    "timestamp": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error(f"Failed to trigger ML model retraining: {e}")
            return {
                "status": "error",
                "message": f"Retraining failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def generate_odds(self, race_info: Dict[str, Any], track_features: Dict[str, Any], 
                     player_history: Dict[str, Any]) -> Dict[str, Any]:
        """Generate betting odds for a race using predictions, track features, and player history"""
        try:
            logger.info(f"🎯 Generating odds for race: {race_info.get('name', 'Unknown')}")
            
            # Get race predictions
            circuit = race_info.get("circuit", race_info.get("name", "Unknown Circuit"))
            predictions_result = self.get_race_predictions(circuit)
            
            if predictions_result["status"] != "success":
                logger.warning("⚠️ Failed to get predictions, using fallback odds")
                return self._generate_fallback_odds(race_info)
            
            predictions = predictions_result["predictions"]
            
            # Apply player history adjustments to odds
            adjusted_predictions = self._apply_player_history_adjustments(
                predictions, player_history, track_features
            )
            
            # Generate different market types
            odds = {
                "race_info": race_info,
                "track_features": track_features,
                "predictions": adjusted_predictions,
                "markets": {
                    "race_winner": self._generate_race_winner_odds(adjusted_predictions),
                    "podium_finish": self._generate_podium_odds(adjusted_predictions),
                    "fastest_lap": self._generate_fastest_lap_odds(adjusted_predictions),
                    "constructor_points": self._generate_constructor_odds(adjusted_predictions)
                },
                "generated_at": datetime.now().isoformat(),
                "player_history_used": bool(player_history.get("total_players", 0) > 0)
            }
            
            logger.info(f"✅ Generated odds for {len(adjusted_predictions)} drivers")
            return odds
            
        except Exception as e:
            logger.error(f"❌ Failed to generate odds: {e}")
            return self._generate_fallback_odds(race_info)

    def _apply_player_history_adjustments(self, predictions: List[Dict], 
                                        player_history: Dict[str, Any], 
                                        track_features: Dict[str, Any]) -> List[Dict]:
        """Apply player betting history adjustments to predictions"""
        try:
            adjusted_predictions = []
            
            for prediction in predictions:
                driver = prediction["driver"]
                base_prob = prediction["win_probability"]
                
                # Get player popularity for this driver
                driver_popularity = player_history.get("driver_popularity", {}).get(driver, 0)
                total_bets = sum(player_history.get("driver_popularity", {}).values())
                
                if total_bets > 0:
                    popularity_ratio = driver_popularity / total_bets
                    
                    # Adjust odds based on popularity (popular drivers get slightly worse odds)
                    # This helps balance the book and prevent over-betting on favorites
                    if popularity_ratio > 0.3:  # Very popular driver
                        adjustment_factor = 0.95
                    elif popularity_ratio > 0.2:  # Popular driver
                        adjustment_factor = 0.98
                    elif popularity_ratio < 0.05:  # Unpopular driver
                        adjustment_factor = 1.05
                    else:
                        adjustment_factor = 1.0
                    
                    # Apply track-specific adjustments
                    track_type = track_features.get("track_type", "permanent")
                    if track_type == "street" and driver in ["Max Verstappen", "Charles Leclerc"]:
                        # Top drivers typically perform well on street circuits
                        adjustment_factor *= 1.02
                    elif track_type == "high_speed" and driver in ["Max Verstappen", "Lewis Hamilton"]:
                        # High-speed specialists
                        adjustment_factor *= 1.02
                    
                    adjusted_prob = base_prob * adjustment_factor
                else:
                    adjusted_prob = base_prob
                
                # Create adjusted prediction
                adjusted_prediction = prediction.copy()
                adjusted_prediction["win_probability"] = adjusted_prob
                adjusted_prediction["podium_probability"] = self._win_to_podium_probability(adjusted_prob)
                adjusted_prediction["original_probability"] = base_prob
                adjusted_prediction["adjustment_factor"] = adjustment_factor if total_bets > 0 else 1.0
                
                adjusted_predictions.append(adjusted_prediction)
            
            # Renormalize probabilities
            total_prob = sum(p["win_probability"] for p in adjusted_predictions)
            if total_prob > 0:
                for p in adjusted_predictions:
                    p["win_probability"] = p["win_probability"] / total_prob
                    p["podium_probability"] = p["podium_probability"] / total_prob
            
            return adjusted_predictions
            
        except Exception as e:
            logger.error(f"❌ Failed to apply player history adjustments: {e}")
            return predictions

    def _generate_race_winner_odds(self, predictions: List[Dict]) -> List[Dict]:
        """Generate race winner odds"""
        return [
            {
                "driver": p["driver"],
                "team": p["team"],
                "odds": self._probability_to_odds(p["win_probability"]),
                "probability": p["win_probability"]
            }
            for p in predictions[:10]  # Top 10 drivers
        ]

    def _generate_podium_odds(self, predictions: List[Dict]) -> List[Dict]:
        """Generate podium finish odds"""
        return [
            {
                "driver": p["driver"],
                "team": p["team"],
                "odds": self._probability_to_odds(p["podium_probability"]),
                "probability": p["podium_probability"]
            }
            for p in predictions[:15]  # Top 15 drivers
        ]

    def _generate_fastest_lap_odds(self, predictions: List[Dict]) -> List[Dict]:
        """Generate fastest lap odds"""
        return [
            {
                "driver": p["driver"],
                "team": p["team"],
                "odds": self._probability_to_odds(p["win_probability"] * 0.3),  # Lower probability
                "probability": p["win_probability"] * 0.3
            }
            for p in predictions[:8]  # Top 8 drivers
        ]

    def _generate_constructor_odds(self, predictions: List[Dict]) -> List[Dict]:
        """Generate constructor points odds"""
        team_probabilities = {}
        for p in predictions:
            team = p["team"]
            if team not in team_probabilities:
                team_probabilities[team] = 0
            team_probabilities[team] += p["win_probability"] * 0.5  # Weighted for team points
        
        return [
            {
                "team": team,
                "odds": self._probability_to_odds(prob),
                "probability": prob
            }
            for team, prob in sorted(team_probabilities.items(), key=lambda x: x[1], reverse=True)
        ]

    def _probability_to_odds(self, probability: float) -> float:
        """Convert probability to decimal odds"""
        if probability <= 0:
            return 1000.0  # Very high odds for impossible events
        elif probability >= 1:
            return 1.01   # Very low odds for certain events
        else:
            return round(1.0 / probability, 2)

    def _generate_fallback_odds(self, race_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback odds when predictions fail"""
        logger.info("🔄 Generating fallback odds")
        
        fallback_drivers = [
            {"driver": "Max Verstappen", "team": "Red Bull Racing", "win_probability": 0.35, "podium_probability": 0.80},
            {"driver": "Charles Leclerc", "team": "Ferrari", "win_probability": 0.20, "podium_probability": 0.60},
            {"driver": "Lando Norris", "team": "McLaren", "win_probability": 0.15, "podium_probability": 0.55},
            {"driver": "Lewis Hamilton", "team": "Ferrari", "win_probability": 0.12, "podium_probability": 0.50},
            {"driver": "George Russell", "team": "Mercedes", "win_probability": 0.08, "podium_probability": 0.40},
            {"driver": "Oscar Piastri", "team": "McLaren", "win_probability": 0.06, "podium_probability": 0.35},
            {"driver": "Carlos Sainz", "team": "Ferrari", "win_probability": 0.04, "podium_probability": 0.30}
        ]
        
        return {
            "race_info": race_info,
            "track_features": {},
            "predictions": fallback_drivers,
            "markets": {
                "race_winner": self._generate_race_winner_odds(fallback_drivers),
                "podium_finish": self._generate_podium_odds(fallback_drivers),
                "fastest_lap": self._generate_fastest_lap_odds(fallback_drivers),
                "constructor_points": self._generate_constructor_odds(fallback_drivers)
            },
            "generated_at": datetime.now().isoformat(),
            "player_history_used": False,
            "source": "fallback"
        }

# Global instance
prediction_service = HybridPredictionService()

