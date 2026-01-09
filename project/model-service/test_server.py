#!/usr/bin/env python3
"""
Simple test script to debug Flask server startup
"""

import sys
import traceback
import json

def test_imports():
    """Test all imports"""
    print("Testing imports...")
    
    try:
        import flask
        print("✅ Flask imported")
    except Exception as e:
        print(f"❌ Flask import failed: {e}")
        return False
    
    try:
        import flask_cors
        print("✅ Flask-CORS imported")
    except Exception as e:
        print(f"❌ Flask-CORS import failed: {e}")
        return False
    
    try:
        import pandas as pd
        print("✅ Pandas imported")
    except Exception as e:
        print(f"❌ Pandas import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✅ NumPy imported")
    except Exception as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    return True

def test_app_creation():
    """Test app creation"""
    print("\nTesting app creation...")
    
    try:
        from app import app
        print("✅ Flask app created successfully")
        return True
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        print("Full traceback:")
        traceback.print_exc()
        return False

def test_endpoint():
    """Test endpoint creation"""
    print("\nTesting endpoint...")
    
    try:
        from app import app
        
        # Test if the route exists
        with app.test_client() as client:
            response = client.get('/predictions/race?name=Dutch+Grand+Prix&date=2025-08-31')
            print(f"✅ Endpoint test successful: {response.status_code}")
            
            # Show response content
            try:
                data = response.get_json()
                print(f"Response data: {json.dumps(data, indent=2)}")
            except:
                print(f"Response text: {response.get_data(as_text=True)}")
            
            return response.status_code == 200
    except Exception as e:
        print(f"❌ Endpoint test failed: {e}")
        print("Full traceback:")
        traceback.print_exc()
        return False

def main():
    """Main test function"""
    print("🔍 Flask Server Debug Test")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed")
        return False
    
    # Test app creation
    if not test_app_creation():
        print("\n❌ App creation failed")
        return False
    
    # Test endpoint
    if not test_endpoint():
        print("\n❌ Endpoint test failed")
        return False
    
    print("\n✅ All tests passed!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
