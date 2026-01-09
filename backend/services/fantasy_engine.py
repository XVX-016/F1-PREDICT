"""
Fantasy Scoring Engine
Lower probability → higher fantasy points reward
"""
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class FantasyEngine:
    """Fantasy points calculation engine"""
    
    # Base points for finishing positions
    BASE_POINTS = {
        1: 100,
        2: 75,
        3: 60,
        4: 50,
        5: 40,
        6: 30,
        7: 25,
        8: 20,
        9: 15,
        10: 10
    }
    
    def calculate_fantasy_points(
        self,
        probability: float,
        finish_position: int
    ) -> float:
        """
        Calculate fantasy points based on probability and finish position
        
        Args:
            probability: Win probability (0-1)
            finish_position: Actual finishing position (1-20)
        
        Returns:
            Fantasy points (rounded to 2 decimals)
        """
        # Base reward for position
        base_reward = self.BASE_POINTS.get(finish_position, 5)
        
        # Multiplier based on probability (lower prob = higher reward)
        # Cap probability at 0.01 to avoid division by zero
        prob = max(probability, 0.01)
        multiplier = max(1.0, (1 / prob))
        
        # Calculate total points
        total_points = base_reward * multiplier
        
        return round(total_points, 2)
    
    def calculate_race_points(
        self,
        probabilities: Dict[str, float],
        results: Dict[str, int]
    ) -> Dict[str, float]:
        """
        Calculate fantasy points for all drivers in a race
        
        Args:
            probabilities: Dict mapping driver_id to win_prob
            results: Dict mapping driver_id to finish_position
        
        Returns:
            Dict mapping driver_id to fantasy_points
        """
        points = {}
        
        for driver_id, prob in probabilities.items():
            position = results.get(driver_id, 20)  # Default to last if not found
            points[driver_id] = self.calculate_fantasy_points(prob, position)
        
        return points

# Global instance
fantasy_engine = FantasyEngine()





