"""
Isotonic Calibration - Inference Only
Loads pre-trained isotonic calibrator and applies to model probabilities.
No fitting. Inference only.
Fails gracefully if calibrator missing.
"""
import pickle
import numpy as np
from typing import Dict, List, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class IsotonicCalibrator:
    """
    Loads and applies isotonic regression calibrator.
    Inference only - no training logic.
    """
    
    def __init__(self, calibrator_path: Optional[str] = None):
        """
        Initialize calibrator
        
        Args:
            calibrator_path: Path to saved isotonic calibrator pickle file
        """
        self.calibrator_path = Path(calibrator_path) if calibrator_path else Path("models/isotonic_calibrator.pkl")
        self.calibrator = None
        self.load_calibrator()
    
    def load_calibrator(self) -> bool:
        """
        Load isotonic calibrator from file.
        Fails gracefully if file not found.
        
        Returns:
            True if loaded successfully, False otherwise
        """
        try:
            if not self.calibrator_path.exists():
                logger.warning(f"Calibrator not found at {self.calibrator_path}. Calibration will be skipped.")
                return False
            
            with open(self.calibrator_path, 'rb') as f:
                self.calibrator = pickle.load(f)
            
            logger.info(f"Isotonic calibrator loaded from {self.calibrator_path}")
            return True
            
        except Exception as e:
            logger.warning(f"Failed to load calibrator: {e}. Calibration will be skipped.")
            return False
    
    def apply(
        self,
        probabilities: np.ndarray
    ) -> np.ndarray:
        """
        Apply isotonic calibration to probabilities.
        Returns original probabilities if calibrator not loaded.
        
        Args:
            probabilities: Array of predicted probabilities (shape: [n_samples] or [n_samples, n_classes])
            
        Returns:
            Calibrated probabilities with same shape as input
        """
        if self.calibrator is None:
            logger.debug("No calibrator loaded. Returning original probabilities.")
            return probabilities
        
        try:
            # Ensure probabilities are in correct format
            probs = np.asarray(probabilities)
            original_shape = probs.shape
            
            # Flatten if needed for calibration
            if probs.ndim > 1:
                probs_flat = probs.flatten()
            else:
                probs_flat = probs.copy()
            
            # Clip probabilities to valid range
            probs_flat = np.clip(probs_flat, 0.0, 1.0)
            
            # Apply calibration
            calibrated = self.calibrator.predict(probs_flat)
            
            # Ensure output is in valid range
            calibrated = np.clip(calibrated, 0.0, 1.0)
            
            # Reshape to original shape
            if original_shape != calibrated.shape:
                calibrated = calibrated.reshape(original_shape)
            
            return calibrated
            
        except Exception as e:
            logger.error(f"Error applying calibration: {e}. Returning original probabilities.")
            return probabilities
    
    def is_available(self) -> bool:
        """Check if calibrator is loaded and available"""
        return self.calibrator is not None

# Global instance
isotonic_calibrator = IsotonicCalibrator()

