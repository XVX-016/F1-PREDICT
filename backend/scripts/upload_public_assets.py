import os
import sys
import logging
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_client() -> Client:
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = (os.getenv("SUPABASE_SERVICE_KEY") or 
           os.getenv("VITE_SUPABASE_SERVICE_KEY") or 
           os.getenv("VITE_SUPABASE_ANON_KEY"))
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials.")
    return create_client(url, key)

def list_all_files(client: Client, bucket: str) -> set:
    all_files = set()
    limit = 1000
    offset = 0
    while True:
        files = client.storage.from_(bucket).list(options={"limit": limit, "offset": offset})
        if not files: break
        for f in files: all_files.add(f['name'])
        if len(files) < limit: break
        offset += limit
    return all_files

def main():
    # Load env
    root = Path(__file__).parent.parent.parent
    for p in [root / "backend" / ".env", root / "Frontend" / ".env", root / ".env"]:
        if p.exists(): load_dotenv(dotenv_path=p)

    client = get_client()
    assets_bucket = os.getenv("SUPABASE_ASSETS_BUCKET", "assets")
    
    # Target: public assets
    frontend_public = root / "Frontend" / "public"
    if not frontend_public.exists():
        logger.error(f"Public dir not found at {frontend_public}")
        return

    logger.info("Gathering files from Frontend/public...")
    all_files = [p for p in frontend_public.rglob('*') if p.is_file()]
    
    logger.info("Fetching existing assets from Supabase...")
    existing_assets = list_all_files(client, assets_bucket)
    
    logger.info(f"Total assets to check: {len(all_files)}")
    for i, f in enumerate(all_files):
        rel_path = f.relative_to(frontend_public).as_posix()
        
        if rel_path in existing_assets:
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
                
                client.storage.from_(assets_bucket).upload(
                    path=rel_path,
                    file=file_data,
                    file_options={"upsert": "true", "content-type": content_type}
                )
        except Exception as e:
            if "already exists" not in str(e).lower():
                logger.error(f"Failed to upload {rel_path}: {e}")

    logger.info("Asset Upload Complete!")

if __name__ == "__main__":
    main()
