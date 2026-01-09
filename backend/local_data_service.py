import json
import os
from datetime import datetime

class LocalDataService:
    def __init__(self):
        self.calendar_file = "f1_calendar_2025.json"
        self.drivers_file = "drivers_2025.json"
        self.standings_file = "2025-race-data/standings.json"
    
    def get_f1_calendar(self, season="2025"):
        """Get F1 calendar from local file"""
        try:
            with open(self.calendar_file, 'r') as f:
                data = json.load(f)
                return data.get('calendar', [])
        except FileNotFoundError:
            print(f"⚠️ Calendar file {self.calendar_file} not found")
            return []
    
    def get_drivers_list(self, race_name=None):
        """Get drivers list from local file"""
        try:
            with open(self.drivers_file, 'r') as f:
                data = json.load(f)
                return data.get('drivers', [])
        except FileNotFoundError:
            print(f"⚠️ Drivers file {self.drivers_file} not found")
            return []
    
    def get_race_drivers(self, race_name):
        """Get drivers for a specific race from race data"""
        try:
            race_dir = f"2025-race-data/{race_name}/Race"
            drivers_file = f"{race_dir}/drivers.json"
            if os.path.exists(drivers_file):
                with open(drivers_file, 'r') as f:
                    data = json.load(f)
                    return data.get('drivers', [])
            else:
                # Fallback to main drivers list
                return self.get_drivers_list()
        except Exception as e:
            print(f"⚠️ Error loading race drivers for {race_name}: {e}")
            return self.get_drivers_list()
    
    def get_standings(self):
        """Get current standings from local file"""
        try:
            with open(self.standings_file, 'r') as f:
                data = json.load(f)
                return data.get('drivers', [])
        except FileNotFoundError:
            print(f"⚠️ Standings file {self.standings_file} not found")
            return []
    
    def get_next_race(self):
        """Get next race from calendar"""
        calendar = self.get_f1_calendar()
        if not calendar:
            return None
        
        today = datetime.now().date()
        for race in calendar:
            race_date = datetime.strptime(race['date'], '%Y-%m-%d').date()
            if race_date >= today:
                return race
        return calendar[-1] if calendar else None

# Global instance
local_data_service = LocalDataService()
