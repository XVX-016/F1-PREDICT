import json
import os
from datetime import datetime
from typing import Dict, List, Any

class PredictionLogger:
    """
    Service for logging predictions made by the ML model for later calibration tuning.
    """
    
    def __init__(self, log_file: str = "predictions_log.json"):
        self.log_file = log_file
        self._ensure_log_file_exists()
    
    def _ensure_log_file_exists(self):
        """Ensure the log file exists with proper structure."""
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w') as f:
                json.dump([], f, indent=2)
    
    def log_prediction(self, race_name: str, predictions: List[Dict[str, Any]], 
                      model_version: str = "v1.0", additional_metadata: Dict = None):
        """
        Log a prediction made by the ML model.
        
        Args:
            race_name: Name of the race
            predictions: List of driver predictions with probabilities
            model_version: Version of the ML model used
            additional_metadata: Any additional metadata to store
        """
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "race_name": race_name,
            "model_version": model_version,
            "predictions": predictions,
            "metadata": additional_metadata or {}
        }
        
        try:
            # Load existing logs
            with open(self.log_file, 'r') as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            data = []
        
        # Add new entry
        data.append(entry)
        
        # Save updated logs
        with open(self.log_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ Prediction logged for {race_name}")
    
    def log_race_result(self, race_name: str, actual_results: List[str], 
                       race_date: str = None, additional_metadata: Dict = None):
        """
        Log actual race results for later calibration comparison.
        
        Args:
            race_name: Name of the race
            actual_results: List of driver names in finishing order
            race_date: Date of the race
            additional_metadata: Any additional metadata
        """
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "race_name": race_name,
            "race_date": race_date or datetime.utcnow().strftime("%Y-%m-%d"),
            "actual_results": actual_results,
            "metadata": additional_metadata or {}
        }
        
        results_file = "race_results.json"
        
        try:
            # Load existing results
            with open(results_file, 'r') as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            data = []
        
        # Check if this race already exists
        existing_race = next((r for r in data if r["race_name"] == race_name), None)
        if existing_race:
            # Update existing entry
            existing_race.update(entry)
        else:
            # Add new entry
            data.append(entry)
        
        # Save updated results
        with open(results_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ Race results logged for {race_name}")
    
    def get_predictions_for_race(self, race_name: str) -> List[Dict]:
        """Get all predictions made for a specific race."""
        try:
            with open(self.log_file, 'r') as f:
                data = json.load(f)
            return [entry for entry in data if entry["race_name"] == race_name]
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def get_race_result(self, race_name: str) -> Dict:
        """Get actual results for a specific race."""
        try:
            with open("race_results.json", 'r') as f:
                data = json.load(f)
            return next((entry for entry in data if entry["race_name"] == race_name), None)
        except (FileNotFoundError, json.JSONDecodeError):
            return None
    
    def get_all_predictions(self) -> List[Dict]:
        """Get all logged predictions."""
        try:
            with open(self.log_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def get_all_results(self) -> List[Dict]:
        """Get all logged race results."""
        try:
            with open("race_results.json", 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def clear_old_logs(self, days_to_keep: int = 365):
        """Clear predictions older than specified days."""
        cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        cutoff_date = cutoff_date.replace(day=cutoff_date.day - days_to_keep)
        
        try:
            with open(self.log_file, 'r') as f:
                data = json.load(f)
            
            # Filter out old entries
            filtered_data = []
            for entry in data:
                entry_date = datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00'))
                if entry_date >= cutoff_date:
                    filtered_data.append(entry)
            
            # Save filtered data
            with open(self.log_file, 'w') as f:
                json.dump(filtered_data, f, indent=2)
            
            print(f"✅ Cleared predictions older than {days_to_keep} days")
            
        except (FileNotFoundError, json.JSONDecodeError):
            pass
