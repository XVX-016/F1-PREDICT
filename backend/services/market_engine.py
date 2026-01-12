import logging
from datetime import datetime, timezone
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

class MarketEngine:
    def __init__(self):
        self.db = get_db()

    def get_open_markets(self):
        """Fetch all markets that are currently OPEN or LOCKED (visible but maybe not bettable)."""
        try:
             # We want markets that are not 'settled'/'closed' roughly? 
             # Schema says status in ('open','locked','settled').
             # Usually user wants to see Open and Locked markets.
             
             # Fetch markets with their options
             res = self.db.table("markets")\
                 .select("*, market_options(*)")\
                 .in_("status", ["open", "locked"])\
                 .order("closing_time", desc=False)\
                 .execute()
             
             return res.data
        except Exception as e:
            logger.error(f"Error fetching markets: {e}")
            return []

    def get_market_by_id(self, market_id: str):
        try:
            res = self.db.table("markets")\
                .select("*, market_options(*)")\
                .eq("id", market_id)\
                .execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Error fetching market {market_id}: {e}")
            return None

market_engine = MarketEngine()
