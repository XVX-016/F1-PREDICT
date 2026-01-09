"""
Bet Service for F1 Betting
Manages individual bets - placement, settlement, and tracking
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json
import os
import sys
import uuid

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

class BetService:
    """
    Service for managing F1 betting operations.
    Handles bet placement, settlement, and tracking.
    """
    
    def __init__(self):
        self.bets_file = "backend/data/bets.json"
        self.bets = self._load_bets()
        logger.info("✅ BetService initialized")

    def _load_bets(self) -> Dict[str, Any]:
        """Load bets from persistent storage"""
        try:
            if os.path.exists(self.bets_file):
                with open(self.bets_file, 'r') as f:
                    return json.load(f)
            else:
                # Create initial bets structure
                initial_bets = {
                    "pending_bets": {},
                    "settled_bets": {},
                    "metadata": {
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "total_bets_placed": 0,
                        "total_stake": 0.0,
                        "total_payout": 0.0
                    }
                }
                self._save_bets(initial_bets)
                return initial_bets
        except Exception as e:
            logger.error(f"❌ Failed to load bets: {e}")
            return {"pending_bets": {}, "settled_bets": {}, "metadata": {}}

    def _save_bets(self, bets_data: Dict[str, Any]):
        """Save bets to persistent storage"""
        try:
            os.makedirs(os.path.dirname(self.bets_file), exist_ok=True)
            bets_data["metadata"]["last_updated"] = datetime.now(timezone.utc).isoformat()
            with open(self.bets_file, 'w') as f:
                json.dump(bets_data, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Failed to save bets: {e}")

    def place_bet(self, user_id: str, race_id: str, market_id: str, 
                  selection: str, stake: float, odds: float) -> Dict[str, Any]:
        """Place a new bet"""
        try:
            logger.info(f"💰 Placing bet for user {user_id} on {race_id}")
            
            # Validate bet
            validation_result = self._validate_bet(user_id, race_id, market_id, stake, odds)
            if not validation_result["valid"]:
                return {
                    "status": "error",
                    "message": validation_result["message"]
                }
            
            # Generate unique bet ID
            bet_id = str(uuid.uuid4())
            
            # Calculate potential payout
            potential_payout = stake * odds
            
            # Create bet record
            bet = {
                "bet_id": bet_id,
                "user_id": user_id,
                "race_id": race_id,
                "market_id": market_id,
                "selection": selection,
                "stake": stake,
                "odds": odds,
                "potential_payout": potential_payout,
                "status": "pending",
                "placed_at": datetime.now(timezone.utc).isoformat(),
                "settled_at": None,
                "actual_payout": 0.0,
                "result": None
            }
            
            # Add to pending bets
            self.bets["pending_bets"][bet_id] = bet
            
            # Update metadata
            self.bets["metadata"]["total_bets_placed"] += 1
            self.bets["metadata"]["total_stake"] += stake
            
            # Save to storage
            self._save_bets(self.bets)
            
            logger.info(f"✅ Bet placed successfully: {bet_id}")
            return {
                "status": "success",
                "bet_id": bet_id,
                "bet": bet
            }
        except Exception as e:
            logger.error(f"❌ Failed to place bet: {e}")
            return {
                "status": "error",
                "message": f"Failed to place bet: {str(e)}"
            }

    def _validate_bet(self, user_id: str, race_id: str, market_id: str, 
                     stake: float, odds: float) -> Dict[str, Any]:
        """Validate bet parameters"""
        try:
            # Check minimum stake
            if stake < 1.0:
                return {"valid": False, "message": "Minimum stake is £1.00"}
            
            # Check maximum stake
            if stake > 1000.0:
                return {"valid": False, "message": "Maximum stake is £1000.00"}
            
            # Check odds validity
            if odds < 1.01 or odds > 1000.0:
                return {"valid": False, "message": "Invalid odds range"}
            
            # Check if race markets are still active (would need market service integration)
            # For now, assume valid
            
            return {"valid": True, "message": "Bet is valid"}
        except Exception as e:
            return {"valid": False, "message": f"Validation error: {str(e)}"}

    def settle_bets(self, race_id: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """Settle all pending bets for a race using race results"""
        try:
            logger.info(f"💰 Settling bets for race: {race_id}")
            
            if not results:
                logger.warning(f"⚠️ No results provided for race {race_id}")
                return {
                    "status": "warning",
                    "message": f"No results available for race {race_id}",
                    "race_id": race_id
                }
            
            settled_bets = []
            total_payout = 0.0
            
            # Find all pending bets for this race
            race_bets = {
                bet_id: bet for bet_id, bet in self.bets["pending_bets"].items()
                if bet["race_id"] == race_id
            }
            
            if not race_bets:
                logger.info(f"ℹ️ No pending bets found for race {race_id}")
                return {
                    "status": "info",
                    "message": f"No pending bets for race {race_id}",
                    "race_id": race_id,
                    "settled_bets": 0,
                    "total_payout": 0.0
                }
            
            # Settle each bet
            for bet_id, bet in race_bets.items():
                settlement_result = self._settle_individual_bet(bet, results)
                settled_bets.append(settlement_result)
                
                # Move from pending to settled
                bet["status"] = "settled"
                bet["settled_at"] = datetime.now(timezone.utc).isoformat()
                bet["result"] = settlement_result["result"]
                bet["actual_payout"] = settlement_result["payout"]
                
                self.bets["settled_bets"][bet_id] = bet
                del self.bets["pending_bets"][bet_id]
                
                total_payout += settlement_result["payout"]
            
            # Update metadata
            self.bets["metadata"]["total_payout"] += total_payout
            
            # Save to storage
            self._save_bets(self.bets)
            
            logger.info(f"✅ Settled {len(settled_bets)} bets for race: {race_id}")
            return {
                "status": "success",
                "message": f"Settled {len(settled_bets)} bets for race {race_id}",
                "race_id": race_id,
                "settled_bets": len(settled_bets),
                "total_payout": total_payout,
                "settlements": settled_bets
            }
        except Exception as e:
            logger.error(f"❌ Failed to settle bets for {race_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to settle bets: {str(e)}",
                "race_id": race_id
            }

    def _settle_individual_bet(self, bet: Dict[str, Any], results: Dict[str, Any]) -> Dict[str, Any]:
        """Settle an individual bet based on race results"""
        try:
            market_id = bet["market_id"]
            selection = bet["selection"]
            stake = bet["stake"]
            odds = bet["odds"]
            
            # Determine bet result based on market type
            if "winner" in market_id:
                result = self._settle_winner_bet(selection, results)
            elif "podium" in market_id:
                result = self._settle_podium_bet(selection, results)
            elif "fastest_lap" in market_id:
                result = self._settle_fastest_lap_bet(selection, results)
            elif "constructor" in market_id:
                result = self._settle_constructor_bet(selection, results)
            else:
                result = {"won": False, "reason": "Unknown market type"}
            
            # Calculate payout
            if result["won"]:
                payout = stake * odds
            else:
                payout = 0.0
            
            return {
                "bet_id": bet["bet_id"],
                "result": result,
                "payout": payout,
                "won": result["won"]
            }
        except Exception as e:
            logger.error(f"❌ Failed to settle individual bet {bet.get('bet_id', 'unknown')}: {e}")
            return {
                "bet_id": bet.get("bet_id", "unknown"),
                "result": {"won": False, "reason": f"Settlement error: {str(e)}"},
                "payout": 0.0,
                "won": False
            }

    def _settle_winner_bet(self, selection: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """Settle race winner bet"""
        try:
            race_winner = results.get("race_winner")
            if not race_winner:
                return {"won": False, "reason": "No race winner in results"}
            
            won = race_winner.lower() == selection.lower()
            return {
                "won": won,
                "reason": f"Race winner: {race_winner}",
                "selection": selection
            }
        except Exception as e:
            return {"won": False, "reason": f"Winner settlement error: {str(e)}"}

    def _settle_podium_bet(self, selection: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """Settle podium finish bet"""
        try:
            podium = results.get("podium", [])
            if not podium:
                return {"won": False, "reason": "No podium results available"}
            
            # Check if selection is in top 3
            podium_drivers = [driver.lower() for driver in podium]
            won = selection.lower() in podium_drivers
            
            return {
                "won": won,
                "reason": f"Podium: {podium}",
                "selection": selection
            }
        except Exception as e:
            return {"won": False, "reason": f"Podium settlement error: {str(e)}"}

    def _settle_fastest_lap_bet(self, selection: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """Settle fastest lap bet"""
        try:
            fastest_lap = results.get("fastest_lap")
            if not fastest_lap:
                return {"won": False, "reason": "No fastest lap result available"}
            
            won = fastest_lap.lower() == selection.lower()
            return {
                "won": won,
                "reason": f"Fastest lap: {fastest_lap}",
                "selection": selection
            }
        except Exception as e:
            return {"won": False, "reason": f"Fastest lap settlement error: {str(e)}"}

    def _settle_constructor_bet(self, selection: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """Settle constructor points bet"""
        try:
            constructor_winner = results.get("constructor_winner")
            if not constructor_winner:
                return {"won": False, "reason": "No constructor winner in results"}
            
            won = constructor_winner.lower() == selection.lower()
            return {
                "won": won,
                "reason": f"Constructor winner: {constructor_winner}",
                "selection": selection
            }
        except Exception as e:
            return {"won": False, "reason": f"Constructor settlement error: {str(e)}"}

    def get_bets_status(self) -> Dict[str, Any]:
        """Get current bets status"""
        try:
            pending_count = len(self.bets["pending_bets"])
            settled_count = len(self.bets["settled_bets"])
            
            return {
                "pending_bets": pending_count,
                "settled_bets": settled_count,
                "total_bets": pending_count + settled_count,
                "total_stake": self.bets["metadata"].get("total_stake", 0.0),
                "total_payout": self.bets["metadata"].get("total_payout", 0.0),
                "last_updated": self.bets["metadata"].get("last_updated")
            }
        except Exception as e:
            logger.error(f"❌ Failed to get bets status: {e}")
            return {
                "pending_bets": 0,
                "settled_bets": 0,
                "total_bets": 0,
                "error": str(e)
            }

    def get_user_bets(self, user_id: str) -> Dict[str, Any]:
        """Get all bets for a specific user"""
        try:
            user_pending = {
                bet_id: bet for bet_id, bet in self.bets["pending_bets"].items()
                if bet["user_id"] == user_id
            }
            
            user_settled = {
                bet_id: bet for bet_id, bet in self.bets["settled_bets"].items()
                if bet["user_id"] == user_id
            }
            
            return {
                "status": "success",
                "user_id": user_id,
                "pending_bets": user_pending,
                "settled_bets": user_settled,
                "total_pending": len(user_pending),
                "total_settled": len(user_settled)
            }
        except Exception as e:
            logger.error(f"❌ Failed to get bets for user {user_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to get user bets: {str(e)}",
                "user_id": user_id
            }

    def get_race_bets(self, race_id: str) -> Dict[str, Any]:
        """Get all bets for a specific race"""
        try:
            race_pending = {
                bet_id: bet for bet_id, bet in self.bets["pending_bets"].items()
                if bet["race_id"] == race_id
            }
            
            race_settled = {
                bet_id: bet for bet_id, bet in self.bets["settled_bets"].items()
                if bet["race_id"] == race_id
            }
            
            return {
                "status": "success",
                "race_id": race_id,
                "pending_bets": race_pending,
                "settled_bets": race_settled,
                "total_pending": len(race_pending),
                "total_settled": len(race_settled)
            }
        except Exception as e:
            logger.error(f"❌ Failed to get bets for race {race_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to get race bets: {str(e)}",
                "race_id": race_id
            }


# Global instance
bet_service = BetService()

