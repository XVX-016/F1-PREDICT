"""
Market Engine - Phase 5
Derives odds from probabilities with house margin.
"""
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class MarketEngine:
    def __init__(self, house_margin: float = 0.10):
        self.house_margin = house_margin

    def derive_odds(self, probabilities: Dict[str, float]) -> Dict[str, float]:
        """
        Derive odds (1/prob) with a house margin.
        Renormalizes to ensure the book adds up to > 1.0 (overround).
        """
        odds_dict = {}
        
        # 1. Apply margin (increase implied probability)
        # Implied Prob = True Prob * (1 + margin)
        total_true_prob = sum(probabilities.values())
        if total_true_prob == 0:
            return {d: 100.0 for d in probabilities}

        for driver_id, prob in probabilities.items():
            # Normalized prob
            norm_prob = prob / total_true_prob
            
            # Adjusted prob for margin
            target_prob = norm_prob * (1.0 + self.house_margin)
            
            # Odds = 1 / prob
            if target_prob > 0:
                odds = 1.0 / target_prob
            else:
                odds = 100.0 # Ceiling
                
            odds_dict[driver_id] = round(max(float(odds), 1.01), 2)
            
        return odds_dict

# Global instance
market_engine = MarketEngine()
