from fastapi import Header, HTTPException, Depends
from typing import Optional
from database.supabase_client import get_db

async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Validates Supabase JWT and returns user_id/user object.
    In a real production app, verify the JWT signature locally or via Supabase Auth API.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authentication Token")

    try:
        token = authorization.replace("Bearer ", "")
        db = get_db()
        # Verify user with Supabase Auth
        user = db.auth.get_user(token)
        
        if not user or not user.user:
             raise HTTPException(status_code=401, detail="Invalid Token")
             
        return user.user
    except Exception as e:
        # Fallback for dev/hackathon if auth fails or is mocked
        # print(f"Auth error: {e}")
        # raise HTTPException(status_code=401, detail="Invalid Authentication")
        
        # NOTE: For Hackathon speed, if get_user fails (common with anon keys vs service role),
        # we might fallback to just decoding the JWT if we trust the gateway.
        # But 'db.auth.get_user(token)' is the correct way.
        raise HTTPException(status_code=401, detail=str(e))

def get_redis_client():
    """
    Dependency to get a Redis client.
    Returns None if Redis is unavailable, allowing callers to handle fallback.
    """
    import redis
    import os
    
    host = os.getenv("REDIS_HOST", "localhost")
    port = int(os.getenv("REDIS_PORT", 6379))
    
    try:
        r = redis.Redis(host=host, port=port, decode_responses=True, socket_timeout=1)
        # Ping to verify connection
        r.ping()
        return r
    except (redis.ConnectionError, redis.TimeoutError):
        return None
