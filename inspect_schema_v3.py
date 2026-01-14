import os
from supabase import create_client
from dotenv import load_dotenv

dotenv_paths = [".env", "backend/.env", "../.env"]
for path in dotenv_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

with open("schema_results.txt", "w") as f:
    if not url or not key:
        f.write("Missing Supabase config!")
    else:
        try:
            supabase = create_client(url, key)
            res = supabase.table("races").select("*").limit(1).execute()
            if res.data:
                f.write("Columns in 'races' table:\n")
                f.write(", ".join(res.data[0].keys()))
                f.write("\n\nSample Data:\n")
                f.write(str(res.data[0]))
            else:
                f.write("No data found in 'races' table.")
        except Exception as e:
            f.write(f"Error: {e}")
