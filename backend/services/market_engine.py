"""
Market Engine - Derives odds from probabilities
Applies house margin
No real money logic
"""
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class MarketEngine:
    """Fantasy market engine"""
    
    def __init__(self, house_margin: float = 0.07):
        """
        Initialize market engine
        
        Args:
            house_margin: House margin (default 7%)
        """
        self.house_margin = house_margin
    
    def calculate_odds(
        self,
        probabilities: Dict[str, float]
    ) -> Dict[str, float]:
        """
        Calculate odds from probabilities with house margin
        
        Args:
            probabilities: Dict mapping driver_id to win_prob
        
        Returns:
            Dict mapping driver_id to odds
        """
        # Apply house margin
        adjusted_probs = {}
        for driver_id, prob in probabilities.items():
            # Scale probability to include house edge
            adjusted_prob = prob / (1.0 - self.house_margin)
            adjusted_probs[driver_id] = adjusted_prob
        
        # Renormalize to sum to 1.0
        total = sum(adjusted_probs.values())
        if total > 0:
            adjusted_probs = {k: v / total for k, v in adjusted_probs.items()}
        
        # Calculate odds (1 / probability)
        odds = {}
        for driver_id, prob in adjusted_probs.items():
            # Cap probability to avoid division by zero
            prob = max(prob, 0.01)
            odds[driver_id] = round(1.0 / prob, 2)
        
        return odds
    
    def create_markets(
        self,
        race_id: str,
        probabilities: Dict[str, Dict[str, float]],
        driver_names: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """
        Create fantasy markets for a race
        
        Args:
            race_id: Race UUID
            probabilities: Dict mapping driver_id to prob dict
            driver_names: Dict mapping driver_id to driver name
        
        Returns:
            List of market entries
        """
        # Extract win probabilities
        win_probs = {driver_id: probs["win_prob"] for driver_id, probs in probabilities.items()}
        
        # Calculate odds
        odds = self.calculate_odds(win_probs)
        
        # Create market entries
        markets = []
        for driver_id, prob in win_probs.items():
            markets.append({
                "race_id": race_id,
                "driver_id": driver_id,
                "driver_name": driver_names.get(driver_id, "Unknown"),
                "probability": round(prob, 4),
                "odds": odds.get(driver_id, 1.0),
                "market_type": "win"
            })
        
        # Sort by probability (highest first)
        markets.sort(key=lambda x: x["probability"], reverse=True)
        
        return markets

# Global instance
market_engine = MarketEngine()





