"""
Jolpica API client for structured F1 data
Provides: calendar, drivers, qualifying results, race results
Never preprocesses for ML - raw structured data only
"""
import requests
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

JOLPICA_API_KEY = os.getenv("JOLPICA_API_KEY", "")
JOLPICA_BASE_URL = "https://api.jolpica.com/f1"

class JolpicaClient:
    """Client for Jolpica F1 API - structured data only"""
    
    def __init__(self):
        self.api_key = JOLPICA_API_KEY
        self.base_url = JOLPICA_BASE_URL
        self.available = bool(self.api_key)
        
        if self.available:
            logger.info("Jolpica API configured")
        else:
            logger.warning("Jolpica API key not found")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        if not self.api_key:
            raise ValueError("Jolpica API key not configured")
        return {"Authorization": f"Bearer {self.api_key}"}
    
    def get_calendar(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Get race calendar for a season"""
        try:
            url = f"{self.base_url}/races"
            params = {"season": season}
            headers = self._get_headers() if self.available else {}
            
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            resp.raise_for_status()
            
            data = resp.json().get("data", [])
            logger.info(f"Fetched {len(data)} races from calendar")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch calendar: {e}")
            return []
    
    def get_drivers(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Get driver list for a season"""
        try:
            url = f"{self.base_url}/drivers"
            params = {"season": season}
            headers = self._get_headers() if self.available else {}
            
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            resp.raise_for_status()
            
            data = resp.json().get("data", [])
            logger.info(f"Fetched {len(data)} drivers")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch drivers: {e}")
            return []
    
    def get_qualifying_results(
        self, 
        season: int, 
        round_num: int
    ) -> List[Dict[str, Any]]:
        """Get qualifying results for a specific race"""
        try:
            url = f"{self.base_url}/qualifying"
            params = {"season": season, "round": round_num}
            headers = self._get_headers() if self.available else {}
            
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            resp.raise_for_status()
            
            data = resp.json().get("data", [])
            logger.info(f"Fetched qualifying results for round {round_num}")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch qualifying results: {e}")
            return []
    
    def get_race_results(
        self,
        season: int,
        round_num: int
    ) -> List[Dict[str, Any]]:
        """Get race results for a specific race"""
        try:
            url = f"{self.base_url}/results"
            params = {"season": season, "round": round_num}
            headers = self._get_headers() if self.available else {}
            
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            resp.raise_for_status()
            
            data = resp.json().get("data", [])
            logger.info(f"Fetched race results for round {round_num}")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch race results: {e}")
            return []
    
    def get_driver_standings(self, season: int = 2025) -> List[Dict[str, Any]]:
        """Get driver championship standings"""
        try:
            url = f"{self.base_url}/driverStandings"
            params = {"season": season}
            headers = self._get_headers() if self.available else {}
            
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            resp.raise_for_status()
            
            data = resp.json().get("data", [])
            logger.info(f"Fetched driver standings")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch driver standings: {e}")
            return []

# Global instance
jolpica_client = JolpicaClient()





