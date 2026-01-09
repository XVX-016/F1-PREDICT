"""
Fantasy Scoring Engine
Calculates fantasy points based on race performance.
Config-driven points system.
"""
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# Default points configuration
DEFAULT_POINTS_CONFIG = {
    "qualifying": {
        "pole": 10,
        "position": {i: max(0, 11 - i) for i in range(1, 21)}  # 10 for P1, 9 for P2, ..., 0 for P20+
    },
    "race": {
        "win": 25,
        "podium": 15,
        "points_finish": 10,  # Top 10
        "finish": 5,  # Any finish
        "fastest_lap": 5,
        "overtake": 2,  # Per position gained
        "dnf_penalty": -10,  # Did not finish
        "position": {i: max(0, 26 - i) for i in range(1, 21)}  # 25 for P1, 24 for P2, ...
    },
    "bonuses": {
        "hat_trick": 10,  # Pole + Win + Fastest Lap
        "grand_slam": 15,  # Pole + Win + Fastest Lap + Led every lap
        "perfect_weekend": 5  # Perfect qualifying + perfect race
    }
}

class FantasyScoringEngine:
    """
    Calculates fantasy points for drivers based on race performance.
    Config-driven points system.
    """
    
    def __init__(self, points_config: Optional[Dict] = None):
        """
        Initialize scoring engine
        
        Args:
            points_config: Points configuration dictionary. Uses default if not provided.
        """
        self.config = points_config or DEFAULT_POINTS_CONFIG.copy()
    
    def calculate_qualifying_points(
        self,
        grid_position: int
    ) -> int:
        """
        Calculate points for qualifying position
        
        Args:
            grid_position: Grid position (1 = pole, 20+ = back of grid)
            
        Returns:
            Points earned from qualifying
        """
        if grid_position == 1:
            return self.config["qualifying"]["pole"]
        
        position_config = self.config["qualifying"]["position"]
        return position_config.get(grid_position, 0)
    
    def calculate_race_points(
        self,
        finish_position: int,
        grid_position: int,
        fastest_lap: bool = False,
        dnf: bool = False,
        led_every_lap: bool = False
    ) -> Dict[str, int]:
        """
        Calculate points for race performance
        
        Args:
            finish_position: Final finishing position (1-20)
            grid_position: Starting grid position (1-20)
            fastest_lap: Whether driver set fastest lap
            dnf: Whether driver did not finish
            led_every_lap: Whether driver led every lap
            
        Returns:
            Dictionary with breakdown of points earned
        """
        points_breakdown = {
            "finish_position": 0,
            "win": 0,
            "podium": 0,
            "points_finish": 0,
            "fastest_lap": 0,
            "overtakes": 0,
            "dnf_penalty": 0,
            "bonuses": 0,
            "total": 0
        }
        
        if dnf:
            points_breakdown["dnf_penalty"] = self.config["race"]["dnf_penalty"]
            points_breakdown["total"] = points_breakdown["dnf_penalty"]
            return points_breakdown
        
        # Position points
        position_config = self.config["race"]["position"]
        points_breakdown["finish_position"] = position_config.get(finish_position, 0)
        
        # Win bonus
        if finish_position == 1:
            points_breakdown["win"] = self.config["race"]["win"]
        
        # Podium bonus
        if finish_position <= 3:
            points_breakdown["podium"] = self.config["race"]["podium"]
        
        # Points finish bonus
        if finish_position <= 10:
            points_breakdown["points_finish"] = self.config["race"]["points_finish"]
        
        # Finishing bonus
        if finish_position <= 20:
            points_breakdown["finish"] = self.config["race"]["finish"]
        
        # Fastest lap
        if fastest_lap:
            points_breakdown["fastest_lap"] = self.config["race"]["fastest_lap"]
        
        # Overtakes (positions gained)
        positions_gained = max(0, grid_position - finish_position)
        if positions_gained > 0:
            points_breakdown["overtakes"] = positions_gained * self.config["race"]["overtake"]
        
        # Bonuses
        if grid_position == 1 and finish_position == 1 and fastest_lap:
            if led_every_lap:
                points_breakdown["bonuses"] = self.config["bonuses"]["grand_slam"]
            else:
                points_breakdown["bonuses"] = self.config["bonuses"]["hat_trick"]
        
        # Calculate total
        points_breakdown["total"] = sum([
            points_breakdown["finish_position"],
            points_breakdown["win"],
            points_breakdown["podium"],
            points_breakdown.get("points_finish", 0),
            points_breakdown.get("finish", 0),
            points_breakdown["fastest_lap"],
            points_breakdown["overtakes"],
            points_breakdown["dnf_penalty"],
            points_breakdown["bonuses"]
        ])
        
        return points_breakdown
    
    def calculate_weekend_points(
        self,
        grid_position: int,
        finish_position: int,
        fastest_lap: bool = False,
        dnf: bool = False,
        led_every_lap: bool = False
    ) -> Dict[str, int]:
        """
        Calculate total weekend points (qualifying + race)
        
        Args:
            grid_position: Starting grid position
            finish_position: Final finishing position
            fastest_lap: Whether driver set fastest lap
            dnf: Whether driver did not finish
            led_every_lap: Whether driver led every lap
            
        Returns:
            Dictionary with qualifying, race, and total points
        """
        qualifying_points = self.calculate_qualifying_points(grid_position)
        race_points_breakdown = self.calculate_race_points(
            finish_position,
            grid_position,
            fastest_lap,
            dnf,
            led_every_lap
        )
        
        return {
            "qualifying": qualifying_points,
            "race": race_points_breakdown["total"],
            "race_breakdown": race_points_breakdown,
            "total": qualifying_points + race_points_breakdown["total"]
        }
    
    def calculate_points_from_results(
        self,
        results: List[Dict]
    ) -> List[Dict]:
        """
        Calculate points for multiple drivers from race results
        
        Args:
            results: List of result dictionaries with:
                - driver_id: Driver identifier
                - driver_name: Driver name
                - grid_position: Starting position
                - finish_position: Finishing position
                - fastest_lap: Whether set fastest lap
                - dnf: Whether did not finish
                - led_every_lap: Whether led every lap (optional)
                
        Returns:
            List of result dictionaries with added points fields
        """
        scored_results = []
        
        for result in results:
            weekend_points = self.calculate_weekend_points(
                grid_position=result.get("grid_position", 20),
                finish_position=result.get("finish_position", 20),
                fastest_lap=result.get("fastest_lap", False),
                dnf=result.get("dnf", False),
                led_every_lap=result.get("led_every_lap", False)
            )
            
            result["points"] = weekend_points
            scored_results.append(result)
        
        # Sort by total points (highest first)
        scored_results.sort(key=lambda x: x["points"]["total"], reverse=True)
        
        return scored_results

# Global instance
fantasy_scoring = FantasyScoringEngine()

