import json
import os
from typing import Dict, Any, Optional
from pathlib import Path

# Default paths for calibration configuration
DEFAULT_CALIBRATION_CONFIG_PATH = "calibration_config.json"
DEFAULT_CALIBRATION_BACKUP_PATH = "calibration_config_backup.json"

class CalibrationConfigManager:
    """Manages saving and loading calibration parameters for the F1 prediction system."""
    
    def __init__(self, config_path: str = DEFAULT_CALIBRATION_CONFIG_PATH):
        self.config_path = Path(config_path)
        self.backup_path = Path(str(config_path).replace('.json', '_backup.json'))
    
    def save_calibration_params(self, params: Dict[str, Any], backup: bool = True) -> bool:
        """
        Save calibration parameters to JSON file.
        
        Args:
            params: Dictionary of calibration parameters from Optuna
            backup: Whether to create a backup of existing config
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        try:
            # Create backup if requested and file exists
            if backup and self.config_path.exists():
                self._create_backup()
            
            # Save new parameters
            with open(self.config_path, 'w') as f:
                json.dump(params, f, indent=2, default=str)
            
            print(f"✅ Calibration parameters saved to {self.config_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving calibration parameters: {e}")
            return False
    
    def load_calibration_params(self) -> Optional[Dict[str, Any]]:
        """
        Load calibration parameters from JSON file.
        
        Returns:
            Dict containing calibration parameters or None if loading failed
        """
        try:
            if not self.config_path.exists():
                print(f"⚠️  No calibration config found at {self.config_path}")
                return None
            
            with open(self.config_path, 'r') as f:
                params = json.load(f)
            
            print(f"✅ Calibration parameters loaded from {self.config_path}")
            return params
            
        except Exception as e:
            print(f"❌ Error loading calibration parameters: {e}")
            return None
    
    def _create_backup(self) -> bool:
        """Create a backup of the current calibration config."""
        try:
            import shutil
            shutil.copy2(self.config_path, self.backup_path)
            print(f"📋 Backup created at {self.backup_path}")
            return True
        except Exception as e:
            print(f"⚠️  Could not create backup: {e}")
            return False
    
    def restore_backup(self) -> bool:
        """Restore calibration parameters from backup."""
        try:
            if not self.backup_path.exists():
                print("⚠️  No backup file found")
                return False
            
            import shutil
            shutil.copy2(self.backup_path, self.config_path)
            print(f"✅ Backup restored from {self.backup_path}")
            return True
            
        except Exception as e:
            print(f"❌ Error restoring backup: {e}")
            return False
    
    def get_config_info(self) -> Dict[str, Any]:
        """Get information about the current calibration configuration."""
        info = {
            "config_exists": self.config_path.exists(),
            "backup_exists": self.backup_path.exists(),
            "config_size": None,
            "last_modified": None
        }
        
        if self.config_path.exists():
            stat = self.config_path.stat()
            info["config_size"] = stat.st_size
            info["last_modified"] = stat.st_mtime
        
        return info

def save_optuna_best_params(study, config_path: str = DEFAULT_CALIBRATION_CONFIG_PATH) -> bool:
    """
    Save Optuna study's best parameters to calibration config.
    
    Args:
        study: Optuna study object with best_params
        config_path: Path to save the configuration
        
    Returns:
        bool: True if save was successful
    """
    manager = CalibrationConfigManager(config_path)
    
    # Extract best parameters from Optuna study
    best_params = study.best_params.copy()
    
    # Add metadata
    calibration_config = {
        "parameters": best_params,
        "metadata": {
            "study_name": study.study_name,
            "best_value": study.best_value,
            "n_trials": len(study.trials),
            "optimization_direction": study.direction.name,
            "created_at": str(study.datetime_start),
            "completed_at": str(study.datetime_complete) if study.datetime_complete else None
        }
    }
    
    return manager.save_calibration_params(calibration_config)

def load_calibration_params_for_service(config_path: str = DEFAULT_CALIBRATION_CONFIG_PATH) -> Optional[Dict[str, Any]]:
    """
    Load calibration parameters for use in the calibration service.
    
    Args:
        config_path: Path to the configuration file
        
    Returns:
        Dict containing just the parameters (without metadata) or None if loading failed
    """
    manager = CalibrationConfigManager(config_path)
    config = manager.load_calibration_params()
    
    if config is None:
        return None
    
    # Return just the parameters if they're nested under 'parameters' key
    if "parameters" in config:
        return config["parameters"]
    
    # Return the whole config if it's flat
    return config

def validate_calibration_params(params: Dict[str, Any]) -> bool:
    """
    Validate that calibration parameters have the expected structure.
    
    Args:
        params: Dictionary of calibration parameters
        
    Returns:
        bool: True if parameters are valid
    """
    required_keys = []
    optional_keys = [
        "temperature", "logistic_slope", "logistic_intercept",
        "team_weight_mclaren", "team_weight_redbull", "team_weight_ferrari", "team_weight_mercedes",
        "driver_max_verstappen", "driver_lando_norris", "driver_oscar_piastri",
        "form_boost_norris", "form_boost_piastri", "verstappen_penalty"
    ]
    
    # Check if at least some expected parameters are present
    found_keys = [key for key in optional_keys if key in params]
    
    if len(found_keys) == 0:
        print("⚠️  No recognized calibration parameters found")
        return False
    
    # Validate parameter values
    for key, value in params.items():
        if isinstance(value, (int, float)):
            # Allow negative values for penalties
            if "penalty" in key.lower():
                # Penalties can be negative
                pass
            elif value < 0:
                print(f"⚠️  Parameter {key} has negative value: {value}")
                return False
        elif not isinstance(value, (str, bool)):
            print(f"⚠️  Parameter {key} has unexpected type: {type(value)}")
            return False
    
    print(f"✅ Validated {len(found_keys)} calibration parameters")
    return True

# Convenience functions for common operations
def quick_save_params(params: Dict[str, Any], config_path: str = DEFAULT_CALIBRATION_CONFIG_PATH) -> bool:
    """Quick save of parameters without backup."""
    manager = CalibrationConfigManager(config_path)
    return manager.save_calibration_params(params, backup=False)

def quick_load_params(config_path: str = DEFAULT_CALIBRATION_CONFIG_PATH) -> Optional[Dict[str, Any]]:
    """Quick load of parameters for service use."""
    return load_calibration_params_for_service(config_path)
