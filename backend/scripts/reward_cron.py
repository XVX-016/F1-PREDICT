"""
Cron script for F1 Prediction Platform.
Run this periodically (e.g. every hour).
"""
import sys
import os
import logging
from datetime import datetime, timezone

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.points_engine import PointsEngine
from database.supabase_client import get_db

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def run_hourly_rewards():
    logger.info("Running hourly rewards...")
    db = get_db()
    points_engine = PointsEngine()
    
    # Ideally, we should iterate users who are "active" or just all users if scale permits.
    # For hackathon/MVP, fetching all users from profiles is safer than auth.users which needs admin key sometimes.
    # We use user_profiles table which we created.
    try:
        res = db.table("user_profiles").select("id").execute()
        users = res.data
        if not users:
            logger.info("No users found.")
            return

        for u in users:
            points_engine.award_hourly_points(u["id"])
            
    except Exception as e:
        logger.error(f"Error in hourly rewards: {e}")

def run_daily_rewards():
    # Similar logic, or combine. existing award_daily_bonus checks time.
    logger.info("Running daily rewards checks...")
    db = get_db()
    points_engine = PointsEngine()
    try:
        res = db.table("user_profiles").select("id").execute()
        for u in res.data:
            points_engine.award_daily_bonus(u["id"])
    except Exception as e:
        logger.error(f"Error in daily rewards: {e}")

def lock_expired_markets():
    logger.info("Locking expired markets...")
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        # Update markets where closing_time < now and status = 'open'
        res = db.table("markets").update({"status": "locked"})\
            .lt("closing_time", now_iso)\
            .eq("status", "open")\
            .execute()
        logger.info(f"Locked markets: {res.data}")
    except Exception as e:
        logger.error(f"Error locking markets: {e}")

if __name__ == "__main__":
    logger.info("Starting Cron Job")
    run_hourly_rewards()
    run_daily_rewards()
    lock_expired_markets()
    logger.info("Cron Job Finished")
