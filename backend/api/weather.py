from fastapi import APIRouter, HTTPException, Query
import httpx
import os
import time
from typing import Dict, Any

router = APIRouter()

# Simple In-memory Cache
# Key: location_query, Value: (timestamp, data)
weather_cache: Dict[str, tuple[float, Any]] = {}
CACHE_TTL = 600  # 10 minutes

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY") or os.getenv("VITE_WEATHER_API_KEY")

@router.get("/weather")
async def get_weather(q: str = Query(..., description="Location to fetch weather for")):
    current_time = time.time()
    
    # Check cache
    if q in weather_cache:
        timestamp, cached_data = weather_cache[q]
        if current_time - timestamp < CACHE_TTL:
            return cached_data

    if not WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="Weather API key not configured")

    url = f"https://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={q}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Weather API request failed")
            
            data = response.json()
            
            # Simplified response for frontend
            result = {
                "temp_c": data["current"]["temp_c"],
                "condition": {
                    "text": data["current"]["condition"]["text"],
                    "icon": data["current"]["condition"]["icon"]
                },
                "wind_kph": data["current"]["wind_kph"],
                "humidity": data["current"]["humidity"]
            }
            
            # Update cache
            weather_cache[q] = (current_time, result)
            return result
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
