#!/usr/bin/env python3
"""
Dynamic Prediction Service
Provides access to pre-generated predictions for each Grand Prix
"""

import json
import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

class DynamicPredictionService:
    def __init__(self):
        self.predictions_dir = Path("predictions")
        self.cache = {}
        self.load_all_predictions()
    
    def load_all_predictions(self):
        """Load all prediction files into memory"""
        try:
            # Load combined predictions file
            combined_file = self.predictions_dir / "all_races_predictions.json"
            if combined_file.exists():
                with open(combined_file, 'r') as f:
                    data = json.load(f)
                    self.all_predictions = data
                    logger.info(f"✅ Loaded combined predictions for {data.get('total_races', 0)} races")
            
            # Load individual race files
            for file_path in self.predictions_dir.glob("*_predictions.json"):
                if file_path.name != "all_races_predictions.json":
                    circuit_id = file_path.stem.replace("_predictions", "")
                    with open(file_path, 'r') as f:
                        self.cache[circuit_id] = json.load(f)
            
            logger.info(f"✅ Loaded {len(self.cache)} individual race predictions")
            
        except Exception as e:
            logger.error(f"❌ Error loading predictions: {e}")
            self.all_predictions = {}
            self.cache = {}
    
    def get_race_predictions(self, circuit_id: str) -> Optional[Dict[str, Any]]:
        """Get predictions for a specific circuit"""
        circuit_id = circuit_id.lower()
        
        # Try cache first
        if circuit_id in self.cache:
            return self.cache[circuit_id]
        
        # Try to load from file
        file_path = self.predictions_dir / f"{circuit_id}_predictions.json"
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    predictions = json.load(f)
                    self.cache[circuit_id] = predictions
                    return predictions
            except Exception as e:
                logger.error(f"❌ Error loading predictions for {circuit_id}: {e}")
        
        return None
    
    def get_all_races(self) -> List[Dict[str, Any]]:
        """Get list of all available races with predictions"""
        if not self.all_predictions:
            return []
        
        return self.all_predictions.get('races', [])
    
    def get_race_summary(self, circuit_id: str) -> Optional[Dict[str, Any]]:
        """Get summary information for a race"""
        predictions = self.get_race_predictions(circuit_id)
        if not predictions:
            return None
        
        return {
            'race_name': predictions.get('race_name'),
            'circuit': predictions.get('circuit'),
            'round': predictions.get('round'),
            'date': predictions.get('date'),
            'country': predictions.get('country'),
            'city': predictions.get('city'),
            'track_characteristics': predictions.get('track_characteristics'),
            'top_predictions': predictions.get('top_predictions'),
            'total_drivers': len(predictions.get('driver_predictions', [])),
            'generated_at': predictions.get('prediction_metadata', {}).get('generated_at')
        }
    
    def get_driver_predictions(self, circuit_id: str, driver_id: str = None) -> List[Dict[str, Any]]:
        """Get driver predictions for a specific race"""
        predictions = self.get_race_predictions(circuit_id)
        if not predictions:
            return []
        
        driver_predictions = predictions.get('driver_predictions', [])
        
        if driver_id:
            # Filter for specific driver
            return [p for p in driver_predictions if p.get('driver_id') == driver_id]
        
        return driver_predictions
    
    def get_top_predictions(self, circuit_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top predictions for a race"""
        driver_predictions = self.get_driver_predictions(circuit_id)
        
        # Sort by win probability and return top N
        sorted_predictions = sorted(driver_predictions, key=lambda x: x.get('win_probability', 0), reverse=True)
        return sorted_predictions[:limit]
    
    def get_team_predictions(self, circuit_id: str, team: str) -> List[Dict[str, Any]]:
        """Get predictions for a specific team in a race"""
        driver_predictions = self.get_driver_predictions(circuit_id)
        return [p for p in driver_predictions if p.get('team') == team]
    
    def search_races(self, query: str) -> List[Dict[str, Any]]:
        """Search for races by name or circuit"""
        query = query.lower()
        results = []
        
        for race in self.get_all_races():
            race_name = race.get('race_name', '').lower()
            circuit = race.get('circuit', '').lower()
            country = race.get('country', '').lower()
            
            if query in race_name or query in circuit or query in country:
                results.append(race)
        
        return results
    
    def get_next_race_predictions(self) -> Optional[Dict[str, Any]]:
        """Get predictions for the next upcoming race"""
        from datetime import datetime
        
        today = datetime.now().date()
        upcoming_races = []
        
        for race in self.get_all_races():
            try:
                race_date = datetime.strptime(race.get('date', ''), '%Y-%m-%d').date()
                if race_date >= today:
                    upcoming_races.append((race_date, race))
            except:
                continue
        
        if upcoming_races:
            # Sort by date and get the earliest
            upcoming_races.sort(key=lambda x: x[0])
            next_race = upcoming_races[0][1]
            return self.get_race_predictions(next_race.get('circuit', ''))
        
        return None
    
    def get_season_summary(self) -> Dict[str, Any]:
        """Get overall season summary"""
        if not self.all_predictions:
            return {}
        
        races = self.get_all_races()
        
        # Calculate season statistics
        total_drivers = len(races[0].get('driver_predictions', [])) if races else 0
        
        # Find most dominant driver across all races
        driver_totals = {}
        for race in races:
            for driver in race.get('driver_predictions', []):
                driver_id = driver.get('driver_id')
                win_prob = driver.get('win_probability', 0)
                if driver_id not in driver_totals:
                    driver_totals[driver_id] = {
                        'driver_name': driver.get('driver_name'),
                        'team': driver.get('team'),
                        'total_win_probability': 0,
                        'races': 0
                    }
                driver_totals[driver_id]['total_win_probability'] += win_prob
                driver_totals[driver_id]['races'] += 1
        
        # Find most dominant driver
        most_dominant = None
        if driver_totals:
            most_dominant = max(driver_totals.values(), key=lambda x: x['total_win_probability'])
        
        return {
            'season': '2025',
            'total_races': len(races),
            'total_drivers': total_drivers,
            'most_dominant_driver': most_dominant,
            'generated_at': self.all_predictions.get('generated_at'),
            'model_version': '2025-v1.0'
        }

# Global instance
dynamic_prediction_service = DynamicPredictionService()
