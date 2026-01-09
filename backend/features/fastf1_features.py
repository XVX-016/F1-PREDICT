"""
FastF1 Feature Extractor - Inference Only
Extracts aggregated features from FastF1 sessions for ML inference.
No training logic - feature extraction only.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class FastF1FeatureExtractor:
    """
    Extracts aggregated features from FastF1 sessions.
    Returns pandas DataFrame for inference.
    No training logic included.
    """
    
    def __init__(self, cache_dir: str = "./cache"):
        """
        Initialize feature extractor
        
        Args:
            cache_dir: FastF1 cache directory
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def extract_session_features(
        self,
        season: int,
        round_num: int,
        session_type: str = "FP2"
    ) -> Optional[pd.DataFrame]:
        """
        Extract aggregated features from FastF1 session
        
        Args:
            season: F1 season year
            round_num: Race round number
            session_type: Session type (FP2, FP3, Qualifying, Race)
            
        Returns:
            DataFrame with aggregated features per driver, or None if session unavailable
        """
        try:
            import fastf1
            
            # Enable cache
            fastf1.Cache.enable_cache(str(self.cache_dir))
            
            # Load session (FP2 preferred, FP3 fallback)
            if session_type == "FP2":
                try:
                    session = fastf1.get_session(season, round_num, "FP2")
                    session.load()
                except Exception as e:
                    logger.warning(f"FP2 not available, trying FP3: {e}")
                    session = fastf1.get_session(season, round_num, "FP3")
                    session.load()
            else:
                session = fastf1.get_session(season, round_num, session_type)
                session.load()
            
            # Extract features
            features_list = []
            
            # Get weather data
            weather_data = self._extract_weather(session)
            
            # Extract features per driver
            for driver in session.drivers:
                driver_data = self._extract_driver_features(session, driver, weather_data)
                if driver_data:
                    features_list.append(driver_data)
            
            if not features_list:
                logger.warning(f"No features extracted for {season} round {round_num}")
                return None
            
            df = pd.DataFrame(features_list)
            logger.info(f"Extracted features for {len(df)} drivers from {session_type}")
            
            return df
            
        except Exception as e:
            logger.error(f"Error extracting FastF1 features: {e}")
            return None
    
    def _extract_weather(self, session) -> Dict[str, float]:
        """Extract weather features from session"""
        try:
            weather = session.weather_data
            if weather is None or len(weather) == 0:
                return {
                    "air_temp_mean": 25.0,
                    "track_temp_mean": 35.0,
                    "humidity_mean": 60.0,
                    "rainfall": 0.0
                }
            
            return {
                "air_temp_mean": float(weather["AirTemp"].mean()) if "AirTemp" in weather.columns else 25.0,
                "track_temp_mean": float(weather["TrackTemp"].mean()) if "TrackTemp" in weather.columns else 35.0,
                "humidity_mean": float(weather["Humidity"].mean()) if "Humidity" in weather.columns else 60.0,
                "rainfall": float(weather["Rainfall"].sum()) if "Rainfall" in weather.columns else 0.0
            }
        except Exception:
            return {
                "air_temp_mean": 25.0,
                "track_temp_mean": 35.0,
                "humidity_mean": 60.0,
                "rainfall": 0.0
            }
    
    def _extract_driver_features(
        self,
        session,
        driver: str,
        weather_data: Dict[str, float]
    ) -> Optional[Dict]:
        """Extract features for a single driver"""
        try:
            # Get driver laps
            laps = session.laps.pick_driver(driver)
            if laps is None or len(laps) == 0:
                return None
            
            # Filter out invalid laps
            valid_laps = laps[laps["IsPersonalBest"] == True]
            if len(valid_laps) == 0:
                valid_laps = laps[laps["LapTime"].notna()]
            
            if len(valid_laps) == 0:
                return None
            
            # Calculate aggregated features
            lap_times = valid_laps["LapTime"].dt.total_seconds()
            
            # Driver lap pace (mean lap time in seconds)
            avg_lap_time = float(lap_times.mean())
            
            # Lap consistency (std of lap times)
            lap_consistency = float(lap_times.std())
            
            # Best lap time
            best_lap_time = float(lap_times.min())
            
            # Number of valid laps
            num_laps = len(valid_laps)
            
            # Tyre compounds used
            compounds = valid_laps["Compound"].value_counts()
            primary_compound = compounds.index[0] if len(compounds) > 0 else "UNKNOWN"
            
            # Sector times (if available)
            sector_times = self._extract_sector_times(valid_laps)
            
            # Grid position (if qualifying/race)
            grid_position = self._get_grid_position(session, driver)
            
            # Team performance (rolling mean from session)
            team_name = self._get_team_name(session, driver)
            team_performance = self._get_team_performance(session, team_name)
            
            return {
                "driver_code": driver,
                "season": session.event["EventDate"].year,
                "round": session.event["RoundNumber"],
                "session_type": session.session_info["Name"],
                "avg_lap_time_ms": avg_lap_time * 1000,  # Convert to milliseconds
                "best_lap_time_ms": best_lap_time * 1000,
                "lap_consistency_ms": lap_consistency * 1000,
                "num_laps": num_laps,
                "primary_compound": primary_compound,
                "grid_position": grid_position,
                "team_name": team_name,
                "team_performance_index": team_performance,
                "sector1_mean_ms": sector_times.get("sector1_mean_ms", 0.0),
                "sector2_mean_ms": sector_times.get("sector2_mean_ms", 0.0),
                "sector3_mean_ms": sector_times.get("sector3_mean_ms", 0.0),
                "air_temp_mean": weather_data["air_temp_mean"],
                "track_temp_mean": weather_data["track_temp_mean"],
                "humidity_mean": weather_data["humidity_mean"],
                "rainfall": weather_data["rainfall"]
            }
            
        except Exception as e:
            logger.error(f"Error extracting features for driver {driver}: {e}")
            return None
    
    def _extract_sector_times(self, laps) -> Dict[str, float]:
        """Extract sector time features"""
        try:
            sector_times = {}
            
            if "Sector1Time" in laps.columns:
                s1 = laps["Sector1Time"].dropna().dt.total_seconds()
                if len(s1) > 0:
                    sector_times["sector1_mean_ms"] = float(s1.mean() * 1000)
            
            if "Sector2Time" in laps.columns:
                s2 = laps["Sector2Time"].dropna().dt.total_seconds()
                if len(s2) > 0:
                    sector_times["sector2_mean_ms"] = float(s2.mean() * 1000)
            
            if "Sector3Time" in laps.columns:
                s3 = laps["Sector3Time"].dropna().dt.total_seconds()
                if len(s3) > 0:
                    sector_times["sector3_mean_ms"] = float(s3.mean() * 1000)
            
            return sector_times
        except Exception:
            return {}
    
    def _get_grid_position(self, session, driver: str) -> int:
        """Get grid position if available"""
        try:
            if hasattr(session, "results") and session.results is not None:
                results = session.results
                driver_result = results[results["Abbreviation"] == driver]
                if len(driver_result) > 0:
                    position = driver_result.iloc[0].get("GridPosition", 20)
                    return int(position) if pd.notna(position) else 20
            return 20
        except Exception:
            return 20
    
    def _get_team_name(self, session, driver: str) -> str:
        """Get team name for driver"""
        try:
            if hasattr(session, "results") and session.results is not None:
                results = session.results
                driver_result = results[results["Abbreviation"] == driver]
                if len(driver_result) > 0:
                    team = driver_result.iloc[0].get("TeamName", "UNKNOWN")
                    return str(team) if pd.notna(team) else "UNKNOWN"
            return "UNKNOWN"
        except Exception:
            return "UNKNOWN"
    
    def _get_team_performance(self, session, team_name: str) -> float:
        """Calculate team performance index (rolling mean of team lap times)"""
        try:
            if hasattr(session, "results") and session.results is not None:
                results = session.results
                team_results = results[results["TeamName"] == team_name]
                if len(team_results) > 0:
                    # Calculate mean lap time for team
                    team_laps = session.laps[
                        session.laps["Team"].isin(team_results["Abbreviation"].values)
                    ]
                    if len(team_laps) > 0:
                        valid_laps = team_laps[team_laps["LapTime"].notna()]
                        if len(valid_laps) > 0:
                            lap_times = valid_laps["LapTime"].dt.total_seconds()
                            mean_lap = float(lap_times.mean())
                            # Normalize to performance index (inverse of lap time)
                            return 1.0 / (mean_lap / 90.0)  # Normalize to ~90s lap
            return 1.0
        except Exception:
            return 1.0

# Global instance
fastf1_feature_extractor = FastF1FeatureExtractor()

