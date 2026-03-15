import os
import sys
import logging
import time
from pathlib import Path
from functools import wraps
from typing import Set
from supabase import create_client, Client

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Strictly limit which races are uploaded to Supabase to stay within storage limits (1GB free tier)
# Bahrain 2025 ('4_2025')
ALLOWED_REPLAY_RACES = ["4_2025"]

def get_client() -> Client:
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    # Check all possible service key names
    key = (os.getenv("SUPABASE_SERVICE_KEY") or 
           os.getenv("VITE_SUPABASE_SERVICE_KEY") or 
           os.getenv("VITE_SUPABASE_ANON_KEY"))
    
    if url: logger.info(f"Using URL: {url}")
    if key: logger.info(f"Key loaded (starts with {key[:10]}...)")
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials. Checked SUPABASE_URL, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY, VITE_SUPABASE_SERVICE_KEY, VITE_SUPABASE_ANON_KEY.")
    return create_client(url, key)

def retry_on_error(retries=3, delay=2):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            for i in range(retries):
                try:
                    return f(*args, **kwargs)
                except Exception as e:
                    if i == retries - 1: raise e
                    logger.warning(f"Error occurred: {e}. Retrying {i+1}/{retries}...")
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

def list_all_files(client: Client, bucket: str) -> Set[str]:
    """Lists all files in a bucket using pagination."""
    all_files = set()
    limit = 1000
    offset = 0
    
    while True:
        try:
            files = client.storage.from_(bucket).list(options={"limit": limit, "offset": offset})
            if not files:
                break
            
            for f in files:
                all_files.add(f['name'])
            
            if len(files) < limit:
                break
            
            offset += limit
        except Exception as e:
            logger.error(f"Error listing files in {bucket} at offset {offset}: {e}")
            break
            
    return all_files

def migrate():
    client = get_client()
    telemetry_bucket = os.getenv("SUPABASE_TELEMETRY_BUCKET", "race-telemetry")
    assets_bucket = os.getenv("SUPABASE_ASSETS_BUCKET", "assets")
    buckets = [telemetry_bucket, assets_bucket]
    skip_telemetry = os.getenv("SKIP_TELEMETRY", "").lower() in {"1", "true", "yes"}
    skip_assets = os.getenv("SKIP_ASSETS", "").lower() in {"1", "true", "yes"}
    
    # 1. Ensure buckets exist
    try:
        existing_buckets = [b.name for b in client.storage.list_buckets()]
        logger.info(f"Current buckets: {existing_buckets}")
    except Exception as e:
        logger.warning(f"Could not list buckets: {e}. Will try creating them anyway.")
        existing_buckets = []

    for bucket in buckets:
        if bucket not in existing_buckets:
            try:
                logger.info(f"Creating bucket: {bucket}")
                client.storage.create_bucket(bucket, options={"public": True})
            except Exception as e:
                logger.error(f"Failed to create bucket {bucket}: {e}")
        else:
            logger.info(f"Bucket {bucket} already exists")

    # 2. Upload Telemetry JSONs
    telemetry_dir = Path(__file__).parent.parent / "data" / "replay_cache"
    if not skip_telemetry and telemetry_dir.exists():
        files = list(telemetry_dir.glob("*.json"))
        logger.info(f"Total telemetry files to check: {len(files)}")
        
        logger.info("Fetching existing telemetry files from Supabase...")
        existing_remote = list_all_files(client, telemetry_bucket)
        logger.info(f"Found {len(existing_remote)} files on Supabase. Skipping duplicates...")

        for i, f in enumerate(files):
            # Filtering logic
            prefix = f.name.rsplit("_", 1)[0] if "_" in f.name else ""
            if prefix not in ALLOWED_REPLAY_RACES:
                # logger.info(f"Skipping {f.name} (not in whitelist)")
                continue

            if f.name in existing_remote:
                continue
            
            logger.info(f"[{i+1}/{len(files)}] Uploading: {f.name}")
            try:
                @retry_on_error()
                def upload_telemetry():
                    with open(f, 'rb') as file_data:
                        client.storage.from_(telemetry_bucket).upload(
                            path=f.name,
                            file=file_data,
                            file_options={"upsert": "true", "content-type": "application/json"}
                        )
                upload_telemetry()
            except Exception as e:
                if "already exists" in str(e).lower():
                    continue
                logger.error(f"Failed to upload {f.name}: {e}")

    # 3. Upload ALL Public Assets Recursively
    frontend_public = Path(__file__).parent.parent.parent / "Frontend" / "public"
    if not skip_assets and frontend_public.exists():
        logger.info(f"Recursively gathering files from {frontend_public}...")
        all_files = [p for p in frontend_public.rglob('*') if p.is_file()]
        
        logger.info("Fetching existing assets from Supabase...")
        existing_assets = list_all_files(client, assets_bucket)
        
        logger.info(f"Total assets to check: {len(all_files)}")
        for i, f in enumerate(all_files):
            rel_path = f.relative_to(frontend_public).as_posix()
            
            if rel_path in existing_assets:
                # logger.info(f"[{i+1}/{len(all_files)}] Skipping (exists): {rel_path}")
                continue
                
            logger.info(f"[{i+1}/{len(all_files)}] Uploading: {rel_path}")
            try:
                with open(f, 'rb') as file_data:
                    ext = f.suffix.lower()
                    content_type = "application/octet-stream"
                    if ext == ".png": content_type = "image/png"
                    elif ext in [".jpg", ".jpeg"]: content_type = "image/jpeg"
                    elif ext == ".webp": content_type = "image/webp"
                    elif ext == ".avif": content_type = "image/avif"
                    elif ext == ".svg": content_type = "image/svg+xml"
                    elif ext == ".json": content_type = "application/json"
                    elif ext in [".glb", ".gltf"]: content_type = "model/gltf-binary"
                    
                    @retry_on_error()
                    def upload_asset():
                        client.storage.from_(assets_bucket).upload(
                            path=rel_path,
                            file=file_data,
                            file_options={"upsert": "true", "content-type": content_type}
                        )
                    upload_asset()
            except Exception as e:
                if "already exists" in str(e).lower():
                    continue
                logger.error(f"Failed to upload {rel_path}: {e}")

    logger.info("Migration Complete!")

if __name__ == "__main__":
    from dotenv import load_dotenv
    # Try multiple common locations
    root = Path(__file__).parent.parent.parent
    paths = [
        root / "backend" / ".env",
        root / "Frontend" / ".env",
        root / ".env"
    ]
    for p in paths:
        if p.exists():
            logger.info(f"Loading env from {p}")
            load_dotenv(dotenv_path=p)
            
    migrate()

