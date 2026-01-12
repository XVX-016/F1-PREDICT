from datetime import datetime, timedelta, timezone
import logging
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

class PointsEngine:
    def __init__(self):
        self.db = get_db()
        self.HOURLY_BASE = 10
        self.DAILY_BONUS = 150

    def get_now(self):
        return datetime.now(timezone.utc)

    def award_points(self, user_id: str, amount: int, reason: str):
        """Generic method to award points and log transaction."""
        try:
            # Upsert user_points
            # We need to fetch current balance first to increment, or use a DB function. 
            # REST API doesn't support atomic increment easily without a function or RPC. 
            # For now, we fetch-and-update.
            res = self.db.table("user_points").select("balance").eq("user_id", user_id).execute()
            current_balance = res.data[0]["balance"] if res.data else 0
            new_balance = current_balance + amount

            self.db.table("user_points").upsert({
                "user_id": user_id, 
                "balance": new_balance,
                "updated_at": self.get_now().isoformat()
            }).execute()

            # Insert transaction
            self.db.table("transactions").insert({
                "user_id": user_id,
                "amount": amount,
                "reason": reason,
                "created_at": self.get_now().isoformat()
            }).execute()
            
            logger.info(f"Awarded {amount} to {user_id} for '{reason}'. New Bal: {new_balance}")
            return True
        except Exception as e:
            logger.error(f"Error awarding points: {e}")
            return False

    def award_hourly_points(self, user_id: str):
        """Awards hourly points if enough time has passed."""
        try:
            res = self.db.table("user_points").select("*").eq("user_id", user_id).execute()
            user_data = res.data[0] if res.data else None
            
            now = self.get_now()
            
            if user_data:
                last_hourly = datetime.fromisoformat(user_data["last_hourly"]) if user_data.get("last_hourly") else None
                if last_hourly and (now - last_hourly) < timedelta(hours=1):
                    logger.info(f"User {user_id} already claimed hourly points recently.")
                    return False
            
            # Award points using generic method
            if self.award_points(user_id, self.HOURLY_BASE, "Hourly Login Reward"):
                 # Update last_hourly separately or as part of the upsert? 
                 # The generic method updates 'balance'. We need to update 'last_hourly' too.
                 self.db.table("user_points").update({
                     "last_hourly": now.isoformat()
                 }).eq("user_id", user_id).execute()
                 return True
            return False
            
        except Exception as e:
            logger.error(f"Error awarding hourly points to {user_id}: {e}")
            return False

    def award_daily_bonus(self, user_id: str):
        """Awards daily bonus if enough time has passed."""
        try:
            res = self.db.table("user_points").select("*").eq("user_id", user_id).execute()
            user_data = res.data[0] if res.data else None
            
            now = self.get_now()
            
            if user_data:
                last_daily = datetime.fromisoformat(user_data["last_daily"]) if user_data["last_daily"] else None
                if last_daily and (now - last_daily) < timedelta(hours=24):
                    logger.info(f"User {user_id} already claimed daily bonus recently.")
                    return False
                
            # Award points using generic method
            if self.award_points(user_id, self.DAILY_BONUS, "Daily Login Bonus"):
                # Update last_daily
                self.db.table("user_points").update({
                    "last_daily": now.isoformat()
                }).eq("user_id", user_id).execute()
                return True
            return False

        except Exception as e:
            logger.error(f"Error awarding daily bonus to {user_id}: {e}")
            return False

    def award_race_points(self, user_id: str, position: int, probability: float):
        """
        Awards points for a correct prediction based on position and initial probability.
        Formula: Base * max(1, 1/prob)
        """
        try:
            base_points_map = {1: 100, 2: 75, 3: 60, 10: 30} # simplified map
            base_points = base_points_map.get(position, 10) # default 10 for other positions
            
            # Safety checks for probability
            safe_prob = probability if probability > 0.001 else 0.001
            multiplier = max(1.0, 1.0 / safe_prob)
            
            points_to_add = int(base_points * multiplier)
            
            if self.award_points(user_id, points_to_add, f"Race Reward (Pos: {position}, Prob: {probability:.3f})"):
                return points_to_add
            return 0
            
        except Exception as e:
            logger.error(f"Error awarding race points to {user_id}: {e}")
            return 0
