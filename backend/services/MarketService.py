"""
Market Service for F1 Betting
Manages betting markets - creation, closing, and status tracking
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json
import os
import sys

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

class MarketService:
    """
    Service for managing F1 betting markets.
    Handles market creation, closing, and status tracking.
    """
    
    def __init__(self):
        self.markets_file = "backend/data/markets.json"
        self.markets = self._load_markets()
        logger.info("MarketService initialized")

    def _load_markets(self) -> Dict[str, Any]:
        """Load markets from persistent storage"""
        try:
            if os.path.exists(self.markets_file):
                with open(self.markets_file, 'r') as f:
                    return json.load(f)
            else:
                # Create initial markets structure
                initial_markets = {
                    "active_markets": {},
                    "closed_markets": {},
                    "metadata": {
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "total_markets_created": 0
                    }
                }
                self._save_markets(initial_markets)
                return initial_markets
        except Exception as e:
            logger.error(f"Failed to load markets: {e}")
            return {"active_markets": {}, "closed_markets": {}, "metadata": {}}

    def _save_markets(self, markets_data: Dict[str, Any]):
        """Save markets to persistent storage"""
        try:
            os.makedirs(os.path.dirname(self.markets_file), exist_ok=True)
            markets_data["metadata"]["last_updated"] = datetime.now(timezone.utc).isoformat()
            with open(self.markets_file, 'w') as f:
                json.dump(markets_data, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Failed to save markets: {e}")

    def create_markets(self, race_id: str, odds: Dict[str, Any]) -> Dict[str, Any]:
        """Create new betting markets for a race"""
        try:
            logger.info(f"Creating markets for race: {race_id}")
            
            # Generate market types based on odds
            markets = self._generate_market_types(race_id, odds)
            
            # Add to active markets
            self.markets["active_markets"][race_id] = {
                "race_id": race_id,
                "markets": markets,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "active",
                "total_bets": 0,
                "total_stake": 0.0
            }
            
            # Update metadata
            self.markets["metadata"]["total_markets_created"] += 1
            
            # Save to storage
            self._save_markets(self.markets)
            
            logger.info(f"Created {len(markets)} markets for race: {race_id}")
            return {
                "status": "success",
                "race_id": race_id,
                "markets_created": len(markets),
                "markets": markets
            }
        except Exception as e:
            logger.error(f"Failed to create markets for {race_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to create markets: {str(e)}",
                "race_id": race_id
            }

    def _generate_market_types(self, race_id: str, odds: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate different types of betting markets"""
        markets = []
        
        # Race Winner Market
        if "predictions" in odds:
            winner_market = {
                "market_id": f"{race_id}_winner",
                "market_type": "race_winner",
                "name": "Race Winner",
                "description": "Predict the race winner",
                "options": []
            }
            
            for prediction in odds["predictions"][:10]:  # Top 10 drivers
                winner_market["options"].append({
                    "driver": prediction["driver"],
                    "team": prediction["team"],
                    "odds": self._probability_to_odds(prediction["win_probability"]),
                    "probability": prediction["win_probability"]
                })
            
            markets.append(winner_market)
        
        # Podium Market
        if "predictions" in odds:
            podium_market = {
                "market_id": f"{race_id}_podium",
                "market_type": "podium_finish",
                "name": "Podium Finish",
                "description": "Predict if driver will finish on the podium",
                "options": []
            }
            
            for prediction in odds["predictions"][:15]:  # Top 15 drivers
                podium_market["options"].append({
                    "driver": prediction["driver"],
                    "team": prediction["team"],
                    "odds": self._probability_to_odds(prediction["podium_probability"]),
                    "probability": prediction["podium_probability"]
                })
            
            markets.append(podium_market)
        
        # Fastest Lap Market
        if "predictions" in odds:
            fastest_lap_market = {
                "market_id": f"{race_id}_fastest_lap",
                "market_type": "fastest_lap",
                "name": "Fastest Lap",
                "description": "Predict who will set the fastest lap",
                "options": []
            }
            
            # Use top 8 drivers for fastest lap (more competitive)
            for prediction in odds["predictions"][:8]:
                # Fastest lap probability is typically lower than win probability
                fastest_lap_prob = prediction["win_probability"] * 0.3
                fastest_lap_market["options"].append({
                    "driver": prediction["driver"],
                    "team": prediction["team"],
                    "odds": self._probability_to_odds(fastest_lap_prob),
                    "probability": fastest_lap_prob
                })
            
            markets.append(fastest_lap_market)
        
        # Constructor Championship Points Market
        constructor_market = {
            "market_id": f"{race_id}_constructor_points",
            "market_type": "constructor_points",
            "name": "Constructor Points",
            "description": "Predict which constructor will score the most points",
            "options": []
        }
        
        # Group by teams and calculate team probabilities
        team_probabilities = {}
        if "predictions" in odds:
            for prediction in odds["predictions"]:
                team = prediction["team"]
                if team not in team_probabilities:
                    team_probabilities[team] = 0
                team_probabilities[team] += prediction["win_probability"] * 0.5  # Weighted for team points
        
        for team, prob in team_probabilities.items():
            constructor_market["options"].append({
                "team": team,
                "odds": self._probability_to_odds(prob),
                "probability": prob
            })
        
        markets.append(constructor_market)
        
        return markets

    def _probability_to_odds(self, probability: float) -> float:
        """Convert probability to decimal odds"""
        if probability <= 0:
            return 1000.0  # Very high odds for impossible events
        elif probability >= 1:
            return 1.01   # Very low odds for certain events
        else:
            return round(1.0 / probability, 2)

    def close_markets(self, race_id: str) -> Dict[str, Any]:
        """Close all active markets for a race"""
        try:
            logger.info(f"🔒 Closing markets for race: {race_id}")
            
            if race_id not in self.markets["active_markets"]:
                logger.warning(f"⚠️ No active markets found for race: {race_id}")
                return {
                    "status": "warning",
                    "message": f"No active markets found for race {race_id}",
                    "race_id": race_id
                }
            
            # Move from active to closed
            market_data = self.markets["active_markets"][race_id]
            market_data["status"] = "closed"
            market_data["closed_at"] = datetime.now(timezone.utc).isoformat()
            
            self.markets["closed_markets"][race_id] = market_data
            del self.markets["active_markets"][race_id]
            
            # Save to storage
            self._save_markets(self.markets)
            
            logger.info(f"✅ Closed markets for race: {race_id}")
            return {
                "status": "success",
                "message": f"Markets closed for race {race_id}",
                "race_id": race_id,
                "markets_closed": len(market_data["markets"])
            }
        except Exception as e:
            logger.error(f"❌ Failed to close markets for {race_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to close markets: {str(e)}",
                "race_id": race_id
            }

    def get_markets_status(self) -> Dict[str, Any]:
        """Get current markets status"""
        try:
            active_count = len(self.markets["active_markets"])
            closed_count = len(self.markets["closed_markets"])
            
            return {
                "active_markets": active_count,
                "closed_markets": closed_count,
                "total_markets": active_count + closed_count,
                "last_updated": self.markets["metadata"].get("last_updated"),
                "total_created": self.markets["metadata"].get("total_markets_created", 0)
            }
        except Exception as e:
            logger.error(f"❌ Failed to get markets status: {e}")
            return {
                "active_markets": 0,
                "closed_markets": 0,
                "total_markets": 0,
                "error": str(e)
            }

    def get_race_markets(self, race_id: str) -> Optional[Dict[str, Any]]:
        """Get markets for a specific race"""
        try:
            # Check active markets first
            if race_id in self.markets["active_markets"]:
                return self.markets["active_markets"][race_id]
            
            # Check closed markets
            if race_id in self.markets["closed_markets"]:
                return self.markets["closed_markets"][race_id]
            
            return None
        except Exception as e:
            logger.error(f"❌ Failed to get markets for {race_id}: {e}")
            return None

    def get_all_active_markets(self) -> Dict[str, Any]:
        """Get all currently active markets"""
        return self.markets["active_markets"]

    def get_all_closed_markets(self) -> Dict[str, Any]:
        """Get all closed markets"""
        return self.markets["closed_markets"]


# Global instance
market_service = MarketService()

