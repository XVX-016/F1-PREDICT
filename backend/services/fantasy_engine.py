"""
Fantasy Engine - Phase 5
Calculates fantasy points for race outcomes.
Includes probability-weighted multipliers to reward picking underdogs.
"""
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class FantasyEngine:
    def __init__(self):
        # Base points for finishing positions
        self.base_points = {
            1: 100,
            2: 75,
            3: 60,
            4: 50,
            5: 45,
            6: 40,
            7: 35,
            8: 30,
            9: 25,
            10: 20
        }
        self.default_points = 10

    def calculate_points(self, position: int, win_prob: float) -> float:
        """
        Calculate points awarded for a specific finishing position.
        
        Multiplier: max(1, 1/prob) - rewards low-probability outcomes.
        """
        base = self.base_points.get(position, self.default_points)
        
        # Avoid division by zero and cap multiplier for saner leaderboard
        safe_prob = max(win_prob, 0.01)
        multiplier = max(1.0, 1.0 / safe_prob)
        multiplier = min(multiplier, 20.0) # Cap at 20x
        
        total_points = base * multiplier
        
        return round(total_points, 2)

# Global instance
fantasy_engine = FantasyEngine()
