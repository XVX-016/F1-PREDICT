"""
Probability Calibration - Isotonic Regression
Offline process (not live)
Fits on historical win frequencies vs predicted probabilities
Run after each race completes (before next event)
"""
import numpy as np
from sklearn.isotonic import IsotonicRegression
from typing import List, Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)

class ProbabilityCalibrator:
    """
    Calibrates probabilities using isotonic regression
    Fixes overconfidence in raw simulation outputs
    """
    
    def __init__(self):
        self.model = IsotonicRegression(out_of_bounds="clip")
        self.is_fitted = False
    
    def fit(
        self,
        predicted_probs: List[float],
        actual_frequencies: List[float]
    ):
        """
        Fit calibration model
        
        Args:
            predicted_probs: Predicted probabilities from simulation
            actual_frequencies: Actual historical win frequencies
        """
        if len(predicted_probs) != len(actual_frequencies):
            raise ValueError("Predicted and actual must have same length")
        
        # Convert to numpy arrays
        X = np.array(predicted_probs).reshape(-1, 1)
        y = np.array(actual_frequencies)
        
        # Fit isotonic regression
        self.model.fit(X.flatten(), y)
        self.is_fitted = True
        
        logger.info("Calibration model fitted")
    
    def transform(self, predicted_probs: List[float]) -> List[float]:
        """
        Transform predicted probabilities to calibrated probabilities
        
        Args:
            predicted_probs: Raw predicted probabilities
        
        Returns:
            Calibrated probabilities
        """
        if not self.is_fitted:
            raise ValueError("Calibrator not fitted - call fit() first")
        
        X = np.array(predicted_probs)
        calibrated = self.model.predict(X)
        
        return calibrated.tolist()
    
    def calibrate_probabilities(
        self,
        probabilities: Dict[str, Dict[str, float]]
    ) -> Dict[str, Dict[str, float]]:
        """
        Calibrate all probabilities for a race
        
        Args:
            probabilities: Dict mapping driver_id to prob dict
        
        Returns:
            Calibrated probabilities
        """
        if not self.is_fitted:
            logger.warning("Calibrator not fitted - returning original probabilities")
            return probabilities
        
        calibrated = {}
        
        # Calibrate win probabilities
        driver_ids = list(probabilities.keys())
        win_probs = [probabilities[d]["win_prob"] for d in driver_ids]
        calibrated_win = self.transform(win_probs)
        
        # Calibrate podium probabilities
        podium_probs = [probabilities[d]["podium_prob"] for d in driver_ids]
        calibrated_podium = self.transform(podium_probs)
        
        # Calibrate top10 probabilities
        top10_probs = [probabilities[d]["top10_prob"] for d in driver_ids]
        calibrated_top10 = self.transform(top10_probs)
        
        # Reconstruct dictionary
        for i, driver_id in enumerate(driver_ids):
            calibrated[driver_id] = {
                "win_prob": calibrated_win[i],
                "podium_prob": calibrated_podium[i],
                "top10_prob": calibrated_top10[i]
            }
        
        return calibrated

# Global instance
calibrator = ProbabilityCalibrator()





