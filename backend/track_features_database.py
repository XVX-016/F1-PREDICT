import json
import os

class TrackFeaturesDatabase:
    def __init__(self):
        self.track_features = {}
        self.load_track_features()
    
    def load_track_features(self):
        """Load track features from JSON file"""
        try:
            with open('track_features_database.json', 'r') as f:
                data = json.load(f)
                self.track_features = data.get('track_features', {})
        except FileNotFoundError:
            print("⚠️ Track features database not found, using defaults")
            self.track_features = {}
    
    def get_track_features(self, circuit_id):
        """Get features for a specific circuit"""
        return self.track_features.get(circuit_id, {})
    
    def get_all_tracks(self):
        """Get all available tracks"""
        return list(self.track_features.keys())
    
    def get_track_type(self, circuit_id):
        """Get track type for a circuit"""
        track_data = self.get_track_features(circuit_id)
        return track_data.get('type', 'permanent')
    
    def get_overtaking_opportunities(self, circuit_id):
        """Get number of overtaking opportunities for a circuit"""
        track_data = self.get_track_features(circuit_id)
        return track_data.get('overtaking_opportunities', 2)
    
    def get_weather_sensitivity(self, circuit_id):
        """Get weather sensitivity for a circuit"""
        track_data = self.get_track_features(circuit_id)
        return track_data.get('weather_sensitivity', 'medium')

# Global instance
track_features_db = TrackFeaturesDatabase()
