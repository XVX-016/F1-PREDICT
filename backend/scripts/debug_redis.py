import redis
import sys

def check_redis():
    try:
        # Connect to Redis
        r = redis.Redis(host="localhost", port=6379, decode_responses=True)
        
        # Check connection
        if not r.ping():
            print("❌ Redis PING failed")
            sys.exit(1)
            
        print("✅ Redis PING successful")
        
        # Check version (as per plan requirements)
        info = r.info()
        redis_version = info.get("redis_version")
        print(f"ℹ️  Redis Version: {redis_version}")
        
        # Test Set/Get
        test_key = "f1_predict_debug_test"
        r.set(test_key, "race_intelligence")
        val = r.get(test_key)
        
        if val == "race_intelligence":
             print("✅ Redis basic IO (SET/GET) successful")
        else:
             print(f"❌ Redis GET mismatch: expected 'race_intelligence', got '{val}'")
             sys.exit(1)
             
        # Cleanup
        r.delete(test_key)
        print("✅ Redis cleanup successful")
        
    except redis.ConnectionError as e:
        print(f"❌ Could not connect to Redis: {e}")
        print("   Make sure 'redis-server' is running on localhost:6379")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_redis()
