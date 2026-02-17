import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

def init_buckets():
    # Load env from both possible locations
    root = Path(__file__).parent.parent.parent
    load_dotenv(root / "backend" / ".env")
    load_dotenv(root / "Frontend" / ".env")
    
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: Missing Supabase credentials in .env")
        return

    client = create_client(url, key)
    buckets = ["race-telemetry", "assets"]
    
    existing = [b.name for b in client.storage.list_buckets()]
    for b in buckets:
        if b not in existing:
            try:
                print(f"Creating bucket: {b}")
                client.storage.create_bucket(b, options={"public": True})
            except Exception as e:
                print(f"Failed to create {b}: {e}")
        else:
            print(f"Bucket {b} already exists")

if __name__ == "__main__":
    init_buckets()
