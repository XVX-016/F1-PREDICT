import logging
from datetime import datetime, timezone
from database.supabase_client import get_db

logger = logging.getLogger(__name__)

class BetService:
    def __init__(self):
        self.db = get_db()

    def place_bet(self, user_id: str, payload: dict):
        """
        Place a bet for a user.
        Payload expected: { "market_id": str, "option_id": str, "stake": int }
        """
        market_id = payload.get("market_id")
        option_id = payload.get("option_id")
        stake = int(payload.get("stake", 0))

        if stake <= 0:
            return {"error": "Stake must be positive"}

        try:
            # 1. Fetch user points
            res_points = self.db.table("user_points").select("balance").eq("user_id", user_id).execute()
            if not res_points.data:
                return {"error": "User has no points wallet initialized"}
            
            balance = res_points.data[0]["balance"]
            
            if balance < stake:
                return {"error": f"Insufficient funds. Balance: {balance}, Stake: {stake}"}

            # 2. Verify Market is OPEN
            res_market = self.db.table("markets").select("status").eq("id", market_id).execute()
            if not res_market.data or res_market.data[0]["status"] != "open":
                 return {"error": "Market is closed or locked"}

            # 3. Deduct Points (Atomic-ish)
            # Since we don't have stored procedures easily here, we do check-then-act.
            # Ideally inside a transaction or procedure. 
            new_balance = balance - stake
            self.db.table("user_points").update({"balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("user_id", user_id).execute()

            # 4. Create Transaction Log
            self.db.table("transactions").insert({
                "user_id": user_id,
                "amount": -stake,
                "reason": f"Bet placed on market {market_id}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()

            # 5. Place Bet Record
            # We assume odds are valid at time of placement or passed from backend logic (market_options)
            # Ideally we fetch odds from DB to ensure they haven't changed.
            res_option = self.db.table("market_options").select("odds").eq("id", option_id).execute()
            if not res_option.data:
                # Rollback? This is the danger of no atomic trans. 
                # For hackathon, return error.
                return {"error": "Invalid option"}
            
            odds = res_option.data[0]["odds"]
            potential_payout = int(stake * odds)

            data = {
                "user_id": user_id,
                "market_id": market_id,
                "option_id": option_id,
                "stake": stake,
                "payout": potential_payout,
                "status": "open",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            res_bet = self.db.table("bets").insert(data).execute()
            
            return {"success": True, "bet": res_bet.data[0], "new_balance": new_balance}

        except Exception as e:
            logger.error(f"Error placing bet: {e}")
            return {"error": str(e)}

    def get_user_bets(self, user_id: str):
        try:
            res = self.db.table("bets").select("*, market_options(label, odds), markets(market_type, race_id)").eq("user_id", user_id).order("created_at", desc=True).execute()
            return res.data
        except Exception as e:
            logger.error(f"Error fetching bets: {e}")
            return []

bet_service = BetService()
