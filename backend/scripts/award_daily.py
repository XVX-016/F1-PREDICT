from services.points_engine import PointsEngine
from database.supabase_client import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting Daily Bonus Distribution...")
    engine = PointsEngine()
    db = get_db()
    
    users = db.table("users").select("id").execute()
    
    if not users.data:
        logger.info("No users found.")
        return

    count = 0
    for user in users.data:
        if engine.award_daily_bonus(user["id"]):
            count += 1
            
    logger.info(f"Daily bonus distribution complete. Awarded to {count} users.")

if __name__ == "__main__":
    main()
