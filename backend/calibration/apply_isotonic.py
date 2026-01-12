"""
Probability Calibration - Phase 4
Fits and applies isotonic regression to simulation probabilities.
Ensures Win/Podium/Top10 probabilities are statistically reliable.
"""
import numpy as np
import pandas as pd
import logging
import joblib
import os
from typing import List, Dict, Optional, Tuple, Any
from sklearn.isotonic import IsotonicRegression
from database.supabase_client import get_db

logger = logging.getLogger(__name__)
class ProbabilityCalibrator:
    def __init__(self, model_dir: str = "models/calibration"):
        self.model_dir = model_dir
        self.db = get_db()
        self.calibrators = {} # type -> IsotonicRegression
        os.makedirs(self.model_dir, exist_ok=True)

    def fit_from_history(self):
        """
        Fit isotonic regression using historical data.
        Compares win_prob vs actual win (binary), podium_prob vs podium (binary), etc.
        """
        logger.info("📈 Fitting probability calibrators from history...")
        
        try:
            # 1. Fetch historical probabilities and actual results
            # This join assumes we have a way to match probabilities to outcomes
            # For this rehaul, we'll fetch from outcome_probabilities
            res = self.db.table("outcome_probabilities").select("*").execute()
            if not res.data:
                logger.warning("No historical probabilities found for calibration")
                return
                
            df = pd.DataFrame(res.data)
            
            # TODO: Fetch actual outcomes from a 'race_results' table or Jolpica
            # For now, we'll use a placeholder logic for training
            # In a real scenario, we'd have 'actual_win' (0/1), 'actual_podium' (0/1), etc.
            if "actual_win" not in df.columns:
                logger.warning("Actual outcomes missing in database. Calibration fit skipped.")
                # We'll create dummy data for the sake of the script structure if needed, 
                # but better to fail gracefully.
                return

            for prob_type in ["win_prob", "podium_prob", "top10_prob"]:
                target = f"actual_{prob_type.replace('_prob', '')}"
                
                ir = IsotonicRegression(out_of_bounds='clip')
                ir.fit(df[prob_type], df[target])
                
                self.calibrators[prob_type] = ir
                joblib.dump(ir, os.path.join(self.model_dir, f"{prob_type}_calibrator.joblib"))
            
            logger.info("✅ Calibration models fitted and saved")
            
        except Exception as e:
            logger.error(f"❌ Calibration fit failed: {e}")

    def apply_calibration(self, results: List[Dict]) -> List[Dict]:
        """
        Apply loaded calibrators to a list of simulation results.
        """
        logger.info("🧪 Applying calibration to simulation results...")
        
        calibrated_results = []
        for res in results:
            new_res = res.copy()
            for prob_type in ["win_prob", "podium_prob", "top10_prob"]:
                model_path = os.path.join(self.model_dir, f"{prob_type}_calibrator.joblib")
                if os.path.exists(model_path):
                    ir = joblib.load(model_path)
                    # Apply calibration
                    prob = np.array([res[prob_type]])
                    calibrated_prob = float(ir.transform(prob)[0])
                    new_res[prob_type] = calibrated_prob
                    
            calibrated_results.append(new_res)
            
        return calibrated_results

# Global wrapper
def calibrate_probabilities(results: List[Dict]) -> List[Dict]:
    calibrator = ProbabilityCalibrator()
    return calibrator.apply_calibration(results)
