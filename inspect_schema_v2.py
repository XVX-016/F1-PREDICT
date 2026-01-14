import os
from supabase import create_client
from dotenv import load_dotenv

# Try multiple paths for .env
dotenv_paths = [".env", "backend/.env", "../.env"]
loaded = False
for path in dotenv_paths:
    if os.path.exists(path):
        load_dotenv(path)
        print(f"Loaded .env from {path}")
        loaded = True
        break

if not loaded:
    print("Could not find .env file!")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print(f"Missing Supabase config! URL: {url}, Key: {'set' if key else 'None'}")
else:
    try:
        supabase = create_client(url, key)
        res = supabase.table("races").select("*").limit(1).execute()
        if res.data:
            print("Columns in 'races' table:")
            print(list(res.data[0].keys()))
            print("\nSample Data for first race:")
            print(res.data[0])
        else:
            print("No data found in 'races' table.")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
