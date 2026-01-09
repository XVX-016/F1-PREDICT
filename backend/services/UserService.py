"""
User Service for F1 Betting
Manages user data, betting patterns, and player history for smarter odds generation
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json
import os
import sys
import statistics

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

class UserService:
    """
    Service for managing F1 betting users and their patterns.
    Handles user data, betting history, and pattern analysis for smarter odds.
    """
    
    def __init__(self):
        self.users_file = "backend/data/users.json"
        self.users = self._load_users()
        logger.info("✅ UserService initialized")

    def _load_users(self) -> Dict[str, Any]:
        """Load users from persistent storage"""
        try:
            if os.path.exists(self.users_file):
                with open(self.users_file, 'r') as f:
                    return json.load(f)
            else:
                # Create initial users structure
                initial_users = {
                    "users": {},
                    "betting_patterns": {},
                    "metadata": {
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "total_users": 0,
                        "total_bets_analyzed": 0
                    }
                }
                self._save_users(initial_users)
                return initial_users
        except Exception as e:
            logger.error(f"❌ Failed to load users: {e}")
            return {"users": {}, "betting_patterns": {}, "metadata": {}}

    def _save_users(self, users_data: Dict[str, Any]):
        """Save users to persistent storage"""
        try:
            os.makedirs(os.path.dirname(self.users_file), exist_ok=True)
            users_data["metadata"]["last_updated"] = datetime.now(timezone.utc).isoformat()
            with open(self.users_file, 'w') as f:
                json.dump(users_data, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Failed to save users: {e}")

    def create_user(self, user_id: str, username: str, email: str = None) -> Dict[str, Any]:
        """Create a new user"""
        try:
            logger.info(f"👤 Creating user: {user_id}")
            
            if user_id in self.users["users"]:
                return {
                    "status": "error",
                    "message": f"User {user_id} already exists"
                }
            
            # Create user record
            user = {
                "user_id": user_id,
                "username": username,
                "email": email,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_active": datetime.now(timezone.utc).isoformat(),
                "total_bets": 0,
                "total_stake": 0.0,
                "total_winnings": 0.0,
                "favorite_drivers": [],
                "favorite_teams": [],
                "betting_preferences": {
                    "preferred_markets": ["race_winner", "podium_finish"],
                    "average_stake": 10.0,
                    "risk_tolerance": "medium"
                },
                "statistics": {
                    "win_rate": 0.0,
                    "roi": 0.0,
                    "favorite_track_types": []
                }
            }
            
            # Add to users
            self.users["users"][user_id] = user
            
            # Update metadata
            self.users["metadata"]["total_users"] += 1
            
            # Save to storage
            self._save_users(self.users)
            
            logger.info(f"✅ User created: {user_id}")
            return {
                "status": "success",
                "user": user
            }
        except Exception as e:
            logger.error(f"❌ Failed to create user {user_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to create user: {str(e)}"
            }

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user information"""
        try:
            return self.users["users"].get(user_id)
        except Exception as e:
            logger.error(f"❌ Failed to get user {user_id}: {e}")
            return None

    def update_user_activity(self, user_id: str) -> Dict[str, Any]:
        """Update user's last active timestamp"""
        try:
            if user_id in self.users["users"]:
                self.users["users"][user_id]["last_active"] = datetime.now(timezone.utc).isoformat()
                self._save_users(self.users)
                return {"status": "success"}
            else:
                return {"status": "error", "message": "User not found"}
        except Exception as e:
            logger.error(f"❌ Failed to update user activity {user_id}: {e}")
            return {"status": "error", "message": str(e)}

    def record_bet(self, user_id: str, bet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record a bet for a user"""
        try:
            if user_id not in self.users["users"]:
                return {"status": "error", "message": "User not found"}
            
            user = self.users["users"][user_id]
            
            # Update user statistics
            user["total_bets"] += 1
            user["total_stake"] += bet_data.get("stake", 0)
            
            # Update betting patterns
            self._update_betting_patterns(user_id, bet_data)
            
            # Save to storage
            self._save_users(self.users)
            
            return {"status": "success"}
        except Exception as e:
            logger.error(f"❌ Failed to record bet for user {user_id}: {e}")
            return {"status": "error", "message": str(e)}

    def record_bet_settlement(self, user_id: str, bet_data: Dict[str, Any], 
                            won: bool, payout: float) -> Dict[str, Any]:
        """Record bet settlement for a user"""
        try:
            if user_id not in self.users["users"]:
                return {"status": "error", "message": "User not found"}
            
            user = self.users["users"][user_id]
            
            # Update winnings
            if won:
                user["total_winnings"] += payout
            
            # Update statistics
            self._update_user_statistics(user_id)
            
            # Save to storage
            self._save_users(self.users)
            
            return {"status": "success"}
        except Exception as e:
            logger.error(f"❌ Failed to record bet settlement for user {user_id}: {e}")
            return {"status": "error", "message": str(e)}

    def _update_betting_patterns(self, user_id: str, bet_data: Dict[str, Any]):
        """Update betting patterns for a user"""
        try:
            if user_id not in self.users["betting_patterns"]:
                self.users["betting_patterns"][user_id] = {
                    "market_preferences": {},
                    "driver_preferences": {},
                    "team_preferences": {},
                    "stake_patterns": [],
                    "odds_preferences": []
                }
            
            patterns = self.users["betting_patterns"][user_id]
            
            # Update market preferences
            market_type = bet_data.get("market_type", "unknown")
            patterns["market_preferences"][market_type] = patterns["market_preferences"].get(market_type, 0) + 1
            
            # Update driver preferences
            selection = bet_data.get("selection", "")
            if selection:
                patterns["driver_preferences"][selection] = patterns["driver_preferences"].get(selection, 0) + 1
            
            # Update stake patterns
            stake = bet_data.get("stake", 0)
            patterns["stake_patterns"].append(stake)
            
            # Update odds preferences
            odds = bet_data.get("odds", 0)
            patterns["odds_preferences"].append(odds)
            
            # Keep only last 100 entries to prevent memory bloat
            if len(patterns["stake_patterns"]) > 100:
                patterns["stake_patterns"] = patterns["stake_patterns"][-100:]
            if len(patterns["odds_preferences"]) > 100:
                patterns["odds_preferences"] = patterns["odds_preferences"][-100:]
                
        except Exception as e:
            logger.error(f"❌ Failed to update betting patterns for user {user_id}: {e}")

    def _update_user_statistics(self, user_id: str):
        """Update user statistics based on betting history"""
        try:
            user = self.users["users"][user_id]
            patterns = self.users["betting_patterns"].get(user_id, {})
            
            # Calculate win rate (would need bet settlement data)
            # For now, use a placeholder calculation
            total_bets = user["total_bets"]
            if total_bets > 0:
                # Placeholder: assume 30% win rate for demonstration
                user["statistics"]["win_rate"] = 0.30
                
                # Calculate ROI
                total_stake = user["total_stake"]
                total_winnings = user["total_winnings"]
                if total_stake > 0:
                    user["statistics"]["roi"] = (total_winnings - total_stake) / total_stake
            
            # Update favorite drivers/teams based on betting patterns
            driver_prefs = patterns.get("driver_preferences", {})
            if driver_prefs:
                user["favorite_drivers"] = sorted(driver_prefs.items(), key=lambda x: x[1], reverse=True)[:3]
            
            team_prefs = patterns.get("team_preferences", {})
            if team_prefs:
                user["favorite_teams"] = sorted(team_prefs.items(), key=lambda x: x[1], reverse=True)[:3]
            
            # Update average stake
            stake_patterns = patterns.get("stake_patterns", [])
            if stake_patterns:
                user["betting_preferences"]["average_stake"] = statistics.mean(stake_patterns)
                
        except Exception as e:
            logger.error(f"❌ Failed to update user statistics for user {user_id}: {e}")

    def get_player_betting_patterns(self) -> Dict[str, Any]:
        """Get aggregated betting patterns across all players for smarter odds generation"""
        try:
            logger.info("📊 Analyzing player betting patterns")
            
            all_patterns = {
                "total_players": len(self.users["users"]),
                "market_preferences": {},
                "driver_popularity": {},
                "team_popularity": {},
                "average_stake": 0.0,
                "average_odds": 0.0,
                "risk_preferences": {},
                "track_type_preferences": {}
            }
            
            if not self.users["users"]:
                logger.info("ℹ️ No users found for pattern analysis")
                return all_patterns
            
            # Aggregate patterns across all users
            total_stakes = []
            total_odds = []
            
            for user_id, user in self.users["users"].items():
                patterns = self.users["betting_patterns"].get(user_id, {})
                
                # Market preferences
                for market, count in patterns.get("market_preferences", {}).items():
                    all_patterns["market_preferences"][market] = all_patterns["market_preferences"].get(market, 0) + count
                
                # Driver popularity
                for driver, count in patterns.get("driver_preferences", {}).items():
                    all_patterns["driver_popularity"][driver] = all_patterns["driver_popularity"].get(driver, 0) + count
                
                # Stake and odds aggregation
                total_stakes.extend(patterns.get("stake_patterns", []))
                total_odds.extend(patterns.get("odds_preferences", []))
                
                # Risk preferences (based on odds selection)
                odds_prefs = patterns.get("odds_preferences", [])
                if odds_prefs:
                    avg_odds = statistics.mean(odds_prefs)
                    if avg_odds < 2.0:
                        risk_level = "low"
                    elif avg_odds < 5.0:
                        risk_level = "medium"
                    else:
                        risk_level = "high"
                    
                    all_patterns["risk_preferences"][risk_level] = all_patterns["risk_preferences"].get(risk_level, 0) + 1
            
            # Calculate averages
            if total_stakes:
                all_patterns["average_stake"] = statistics.mean(total_stakes)
            if total_odds:
                all_patterns["average_odds"] = statistics.mean(total_odds)
            
            # Sort preferences by popularity
            all_patterns["market_preferences"] = dict(sorted(
                all_patterns["market_preferences"].items(), 
                key=lambda x: x[1], reverse=True
            ))
            all_patterns["driver_popularity"] = dict(sorted(
                all_patterns["driver_popularity"].items(), 
                key=lambda x: x[1], reverse=True
            ))
            
            logger.info(f"✅ Analyzed patterns for {all_patterns['total_players']} players")
            return all_patterns
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze player betting patterns: {e}")
            return {
                "total_players": 0,
                "error": str(e)
            }

    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get detailed statistics for a specific user"""
        try:
            user = self.get_user(user_id)
            if not user:
                return {"status": "error", "message": "User not found"}
            
            patterns = self.users["betting_patterns"].get(user_id, {})
            
            return {
                "status": "success",
                "user_id": user_id,
                "user_info": user,
                "betting_patterns": patterns,
                "statistics": {
                    "total_bets": user["total_bets"],
                    "total_stake": user["total_stake"],
                    "total_winnings": user["total_winnings"],
                    "win_rate": user["statistics"]["win_rate"],
                    "roi": user["statistics"]["roi"],
                    "average_stake": user["betting_preferences"]["average_stake"],
                    "favorite_drivers": user["favorite_drivers"],
                    "favorite_teams": user["favorite_teams"]
                }
            }
        except Exception as e:
            logger.error(f"❌ Failed to get user statistics for {user_id}: {e}")
            return {
                "status": "error",
                "message": f"Failed to get user statistics: {str(e)}"
            }

    def get_all_users(self) -> Dict[str, Any]:
        """Get all users (for admin purposes)"""
        return {
            "status": "success",
            "users": self.users["users"],
            "total_users": len(self.users["users"]),
            "metadata": self.users["metadata"]
        }

    def get_users_status(self) -> Dict[str, Any]:
        """Get users service status"""
        try:
            return {
                "total_users": len(self.users["users"]),
                "total_bets_analyzed": self.users["metadata"].get("total_bets_analyzed", 0),
                "last_updated": self.users["metadata"].get("last_updated"),
                "active_users": len([
                    user for user in self.users["users"].values()
                    if self._is_user_active(user)
                ])
            }
        except Exception as e:
            logger.error(f"❌ Failed to get users status: {e}")
            return {
                "total_users": 0,
                "error": str(e)
            }

    def _is_user_active(self, user: Dict[str, Any]) -> bool:
        """Check if a user is considered active (active within last 30 days)"""
        try:
            last_active = datetime.fromisoformat(user["last_active"])
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            return last_active > thirty_days_ago
        except Exception:
            return False


# Global instance
user_service = UserService()

