import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

res = supabase.table("races").select("*").limit(1).execute()
if res.data:
    print("Columns in 'races' table:")
    print(list(res.data[0].keys()))
else:
    print("No data found in 'races' table.")
