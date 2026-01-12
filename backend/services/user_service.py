import logging
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.db = get_db()

    def get_profile(self, user_id: str):
        try:
            # Join auth.users if possible? Or just return profile.
            # Usually auth.users info is in the JWT, we just need the usage profile.
            # We implemented `user_profiles` table in migration 004.
            res = self.db.table("user_profiles").select("*").eq("id", user_id).execute()
            if res.data:
                return res.data[0]
            else:
                # Auto-create if missing (lazy init)
                # In real app, triggered by auth hook.
                return {"id": user_id, "username": None}
        except Exception as e:
            logger.error(f"Error fetching profile {user_id}: {e}")
            return None

    def get_points(self, user_id: str):
        try:
            res = self.db.table("user_points").select("*").eq("user_id", user_id).execute()
            if res.data:
                return res.data[0]
            else:
                return {"user_id": user_id, "balance": 0, "points": 0} # Handle missing wallet
        except Exception as e:
            logger.error(f"Error fetching points {user_id}: {e}")
            return {"user_id": user_id, "balance": 0}

user_service = UserService()
