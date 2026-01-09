import datetime
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime, timezone
import os
import sys

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.RaceCalendarService import RaceCalendarService
from services.probability_engine import probability_engine
from services.MarketService import market_service
from services.BetService import bet_service
from services.ResultService import result_service
from services.UserService import user_service

logger = logging.getLogger(__name__)

class BettingLifecycleService:
    """
    Automatic betting lifecycle management service that:
    - Closes markets at race start
    - Settles bets after race results
    - Generates new markets for next GP using calendar + track features + player history
    """
    
    def __init__(self):
        self.calendar_service = RaceCalendarService()
        self.probability_engine = probability_engine
        self.market_service = market_service
        self.bet_service = bet_service
        self.result_service = result_service
        self.user_service = user_service
        
        logger.info(" BettingLifecycleService initialized")

    def close_current_markets(self, race_id: str) -> Dict[str, Any]:
        """Close all active markets for the current race."""
        try:
            logger.info(f" Closing markets for race: {race_id}")
            result = self.market_service.close_markets(race_id)
            logger.info(f" Markets closed for race: {race_id}")
            return {
                "status": "success",
                "message": f"Markets closed for race {race_id}",
                "race_id": race_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f" Failed to close markets for race {race_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to close markets: {str(e)}",
                "race_id": race_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def settle_race(self, race_id: str) -> Dict[str, Any]:
        """Settle all bets after race results are available."""
        try:
            logger.info(f" Settling bets for race: {race_id}")
            
            # Get race results
            results = self.result_service.get_results(race_id)
            if not results:
                logger.warning(f" No results available for race {race_id}")
                return {
                    "status": "warning",
                    "message": f"No results available for race {race_id}",
                    "race_id": race_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            # Settle bets using results
            settlement_result = self.bet_service.settle_bets(race_id, results)
            
            logger.info(f" Bets settled for race: {race_id}")
            return {
                "status": "success",
                "message": f"Bets settled for race {race_id}",
                "race_id": race_id,
                "settlement_result": settlement_result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f" Failed to settle bets for race {race_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to settle bets: {str(e)}",
                "race_id": race_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def generate_next_markets(self) -> Dict[str, Any]:
        """Generate new betting markets for the next race."""
        try:
            logger.info(" Generating new markets for next race")
            
            # Get next race info
            next_race = self.calendar_service.get_next_race()
            if not next_race:
                logger.warning(" No next race found")
                return {
                    "status": "warning",
                    "message": "No next race found",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            # Get track features
            track_features = self.calendar_service.get_track_features(next_race["circuit_id"])
            
            # Get player history for smarter odds
            player_history = self.user_service.get_player_betting_patterns()
            
            # Generate odds using probability engine and market engine
            # Get probabilities from probability engine
            race_id = next_race.get("circuit_id") or next_race.get("id")
            probabilities = self.probability_engine.get_probabilities(race_id)
            
            # Market engine will derive odds from probabilities
            from services.market_engine import MarketEngine
            market_engine = MarketEngine()
            # Convert probabilities to format expected by market engine
            prob_dict = {str(driver_id): prob.get("win_probability", 0.0) 
                        for driver_id, prob in probabilities.items()}
            odds = market_engine.calculate_odds(prob_dict)
            
            # Create markets
            market_result = self.market_service.create_markets(next_race["circuit_id"], odds)
            
            logger.info(f" New markets generated for: {next_race['name']}")
            return {
                "status": "success",
                "message": f"New markets generated for {next_race['name']}",
                "race": next_race,
                "market_result": market_result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f" Failed to generate next markets: {e}")
            return {
                "status": "error",
                "message": f"Failed to generate next markets: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def run_lifecycle(self) -> Dict[str, Any]:
        """Main lifecycle runner called by cron/job scheduler."""
        try:
            logger.info("🔄 Running betting lifecycle check")
            current_time = datetime.now(timezone.utc)
            results = []
            
            # Get current race info
            current_race = self.calendar_service.get_current_race()
            if not current_race:
                logger.info("ℹ️ No current race found")
                return {
                    "status": "info",
                    "message": "No current race found",
                    "timestamp": current_time.isoformat()
                }
            
            # Check if we should close markets (at race start)
            race_start_time = self._parse_race_time(current_race.get("date"))
            if race_start_time and current_time >= race_start_time:
                logger.info(f"🏁 Race start time reached for {current_race['name']}")
                close_result = self.close_current_markets(current_race["circuit_id"])
                results.append(close_result)
            
            # Check if we should settle markets (after race ends)
            race_end_time = self._parse_race_end_time(current_race.get("date"))
            if race_end_time and current_time >= race_end_time:
                logger.info(f"🏆 Race end time reached for {current_race['name']}")
                settle_result = self.settle_race(current_race["circuit_id"])
                results.append(settle_result)
                
                # Generate new markets for next race
                generate_result = self.generate_next_markets()
                results.append(generate_result)
            
            logger.info(" Betting lifecycle check completed")
            return {
                "status": "success",
                "message": "Lifecycle check completed",
                "current_race": current_race,
                "results": results,
                "timestamp": current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f" Betting lifecycle failed: {e}")
            return {
                "status": "error",
                "message": f"Lifecycle failed: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def _parse_race_time(self, race_date: str) -> Optional[datetime]:
        """Parse race start time (assume 14:00 UTC for race start)"""
        try:
            if not race_date:
                return None
            race_date_obj = datetime.fromisoformat(race_date)
            # Assume race starts at 14:00 UTC
            return race_date_obj.replace(hour=14, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
        except Exception:
            return None

    def _parse_race_end_time(self, race_date: str) -> Optional[datetime]:
        """Parse race end time (assume 16:00 UTC for race end)"""
        try:
            if not race_date:
                return None
            race_date_obj = datetime.fromisoformat(race_date)
            # Assume race ends at 16:00 UTC (2 hours after start)
            return race_date_obj.replace(hour=16, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
        except Exception:
            return None

    def get_lifecycle_status(self) -> Dict[str, Any]:
        """Get current lifecycle status"""
        try:
            current_race = self.calendar_service.get_current_race()
            next_race = self.calendar_service.get_next_race()
            current_time = datetime.now(timezone.utc)
            
            status = {
                "current_time": current_time.isoformat(),
                "current_race": current_race,
                "next_race": next_race,
                "markets_status": self.market_service.get_markets_status(),
                "bets_status": self.bet_service.get_bets_status()
            }
            
            if current_race:
                race_start = self._parse_race_time(current_race.get("date"))
                race_end = self._parse_race_end_time(current_race.get("date"))
                
                status["race_timeline"] = {
                    "start_time": race_start.isoformat() if race_start else None,
                    "end_time": race_end.isoformat() if race_end else None,
                    "time_to_start": (race_start - current_time).total_seconds() if race_start else None,
                    "time_to_end": (race_end - current_time).total_seconds() if race_end else None
                }
            
            return {
                "status": "success",
                "data": status,
                "timestamp": current_time.isoformat()
            }
        except Exception as e:
            logger.error(f" Failed to get lifecycle status: {e}")
            return {
                "status": "error",
                "message": f"Failed to get status: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }




# Global instance
betting_lifecycle_service = BettingLifecycleService()
