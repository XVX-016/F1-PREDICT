"""
Supabase database client with connection pooling
"""
import os
from typing import Optional
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    """Supabase client singleton"""
    
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance"""
        if cls._instance is None:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment"
                )
            
            cls._instance = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized")
        
        return cls._instance
    
    @classmethod
    def reset(cls):
        """Reset client instance (for testing)"""
        cls._instance = None

# Convenience function
def get_db() -> Client:
    """Get Supabase database client"""
    return SupabaseClient.get_client()





