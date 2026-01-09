"""
FastF1 client for telemetry data
FP2 only by default (race fuel loads, representative)
FP3 only as fallback if FP2 is missing
Extracts lap-by-lap data but does NOT pass raw telemetry forward
"""
import fastf1
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Enable FastF1 cache
CACHE_DIR = os.getenv("FASTF1_CACHE_DIR", "cache")
fastf1.Cache.enable_cache(CACHE_DIR)

class FastF1Client:
    """Client for FastF1 telemetry - aggregated features only"""
    
    def __init__(self):
        self.cache_dir = CACHE_DIR
        logger.info(f"FastF1 client initialized with cache: {self.cache_dir}")
    
    def get_session_laps(
        self,
        season: int,
        round_num: int,
        session_type: str = "FP2"
    ) -> Optional[Any]:
        """
        Get session laps - FP2 only by default (race-representative)
        FP3 only as fallback if FP2 is missing
        
        Args:
            season: F1 season year
            round_num: Race round number
            session_type: Session type (FP2, FP3, Q, R)
        
        Returns:
            FastF1 session object with loaded laps
        """
        try:
            # Try FP2 first (race fuel loads, representative)
            if session_type == "FP2":
                session = fastf1.get_session(season, round_num, "FP2")
                session.load()
                
                if len(session.laps) > 0:
                    logger.info(f"Loaded FP2 session for {season} round {round_num}")
                    return session
                else:
                    # Fallback to FP3 if FP2 has no data
                    logger.warning(f"FP2 has no data, trying FP3 as fallback")
                    session = fastf1.get_session(season, round_num, "FP3")
                    session.load()
                    
                    if len(session.laps) > 0:
                        logger.info(f"Loaded FP3 session (fallback) for {season} round {round_num}")
                        return session
                    else:
                        logger.warning(f"No telemetry data available for {season} round {round_num}")
                        return None
            else:
                session = fastf1.get_session(season, round_num, session_type)
                session.load()
                return session
                
        except Exception as e:
            logger.error(f"Failed to load FastF1 session: {e}")
            return None
    
    def get_driver_laps(
        self,
        session: Any,
        driver_code: str
    ) -> Optional[Any]:
        """Get laps for a specific driver from session"""
        try:
            if session is None:
                return None
            
            driver_laps = session.laps.pick_driver(driver_code)
            if len(driver_laps) == 0:
                return None
            
            return driver_laps
        except Exception as e:
            logger.error(f"Failed to get driver laps: {e}")
            return None

# Global instance
fastf1_client = FastF1Client()





