#!/usr/bin/env python3
"""
F1 Prediction Calibration Training Script

This script trains calibration parameters for the F1 prediction system
using historical race data and various calibration methods.
"""

import numpy as np
import pandas as pd
import json
import pickle
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, brier_score_loss
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class F1CalibrationTrainer:
    def __init__(self):
        self.calibration_params = {
            'temperature': 1.1,
            'logistic_slope': 1.05,
            'logistic_intercept': -0.02,
            'driver_biases': {},
            'track_type_adjustments': {
                'street_circuit': 1.15,
                'permanent_circuit': 1.0,
                'high_speed': 0.95
            }
        }
        
    def load_sample_data(self) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Load sample F1 prediction data for training.
        In production, this would load from your actual race database.
        """
        # Simulate historical race data
        np.random.seed(42)
        n_races = 100
        n_drivers = 20
        
        # Generate realistic win probabilities (sum to 1 per race)
        raw_probs = np.random.dirichlet(np.ones(n_drivers), size=n_races)
        
        # Generate actual results (1 = win, 0 = lose)
        actual_results = np.zeros((n_races, n_drivers))
        for i in range(n_races):
            winner = np.random.choice(n_drivers, p=raw_probs[i])
            actual_results[i, winner] = 1
            
        # Driver names
        driver_names = [
            "Max Verstappen", "Lando Norris", "Oscar Piastri", "Charles Leclerc",
            "Carlos Sainz", "George Russell", "Lewis Hamilton", "Fernando Alonso",
            "Lance Stroll", "Pierre Gasly", "Esteban Ocon", "Nico Hulkenberg",
            "Kevin Magnussen", "Yuki Tsunoda", "Daniel Ricciardo", "Alexander Albon",
            "Valtteri Bottas", "Zhou Guanyu", "Andrea Kimi Antonelli", "Oliver Bearman"
        ]
        
        return raw_probs, actual_results, driver_names
    
    def apply_temperature_scaling(self, probs: np.ndarray, temperature: float) -> np.ndarray:
        """Apply temperature scaling to probabilities."""
        return np.power(probs, 1/temperature)
    
    def apply_logistic_calibration(self, probs: np.ndarray, slope: float, intercept: float) -> np.ndarray:
        """Apply logistic regression calibration."""
        # Convert to logits
        eps = 1e-15
        probs_clipped = np.clip(probs, eps, 1-eps)
        logits = np.log(probs_clipped / (1 - probs_clipped))
        
        # Apply calibration
        calibrated_logits = slope * logits + intercept
        return 1 / (1 + np.exp(-calibrated_logits))
    
    def apply_driver_bias_correction(self, probs: np.ndarray, biases: Dict[str, float], driver_names: List[str]) -> np.ndarray:
        """Apply driver-specific bias corrections."""
        corrected = probs.copy()
        for i, driver in enumerate(driver_names):
            if driver in biases:
                corrected[:, i] = np.clip(corrected[:, i] + biases[driver], 0, 1)
        return corrected
    
    def normalize_probabilities(self, probs: np.ndarray) -> np.ndarray:
        """Normalize probabilities to sum to 1 per race."""
        row_sums = probs.sum(axis=1, keepdims=True)
        return probs / row_sums
    
    def calculate_bias(self, predicted: np.ndarray, actual: np.ndarray) -> float:
        """Calculate mean bias across all predictions."""
        return np.mean(predicted - actual)
    
    def calculate_log_loss(self, predicted: np.ndarray, actual: np.ndarray) -> float:
        """Calculate log loss."""
        eps = 1e-15
        predicted_clipped = np.clip(predicted, eps, 1-eps)
        return log_loss(actual.flatten(), predicted_clipped.flatten())
    
    def calculate_brier_score(self, predicted: np.ndarray, actual: np.ndarray) -> float:
        """Calculate Brier score."""
        return brier_score_loss(actual.flatten(), predicted.flatten())
    
    def calculate_reliability_score(self, predicted: np.ndarray, actual: np.ndarray) -> float:
        """Calculate reliability score (how well predicted probs match actual frequencies)."""
        bins = 10
        bin_size = 1.0 / bins
        reliability = 0
        
        for i in range(bins):
            bin_start = i * bin_size
            bin_end = (i + 1) * bin_size
            
            # Find predictions in this bin
            in_bin_mask = (predicted >= bin_start) & (predicted < bin_end)
            
            if np.any(in_bin_mask):
                avg_pred = np.mean(predicted[in_bin_mask])
                avg_actual = np.mean(actual[in_bin_mask])
                reliability += abs(avg_pred - avg_actual)
        
        return 1 - (reliability / bins)  # Higher is better
    
    def evaluate_calibration(self, raw_probs: np.ndarray, calibrated_probs: np.ndarray, actual_results: np.ndarray) -> Dict:
        """Evaluate calibration quality."""
        return {
            'before_bias': self.calculate_bias(raw_probs, actual_results),
            'after_bias': self.calculate_bias(calibrated_probs, actual_results),
            'before_log_loss': self.calculate_log_loss(raw_probs, actual_results),
            'after_log_loss': self.calculate_log_loss(calibrated_probs, actual_results),
            'before_brier_score': self.calculate_brier_score(raw_probs, actual_results),
            'after_brier_score': self.calculate_brier_score(calibrated_probs, actual_results),
            'reliability_score': self.calculate_reliability_score(calibrated_probs, actual_results)
        }
    
    def train_temperature_scaling(self, probs: np.ndarray, actual: np.ndarray) -> float:
        """Find optimal temperature parameter."""
        temperatures = np.linspace(0.5, 3.0, 50)
        best_temp = 1.0
        best_score = float('inf')
        
        for temp in temperatures:
            scaled_probs = self.apply_temperature_scaling(probs, temp)
            scaled_probs = self.normalize_probabilities(scaled_probs)
            score = self.calculate_log_loss(scaled_probs, actual)
            
            if score < best_score:
                best_score = score
                best_temp = temp
        
        return best_temp
    
    def train_logistic_calibration(self, probs: np.ndarray, actual: np.ndarray) -> Tuple[float, float]:
        """Find optimal logistic calibration parameters."""
        # Flatten for training
        X = probs.flatten().reshape(-1, 1)
        y = actual.flatten()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
        
        # Train logistic regression
        lr = LogisticRegression(solver='lbfgs', max_iter=1000)
        lr.fit(X_train, y_train)
        
        # Extract parameters
        slope = lr.coef_[0][0]
        intercept = lr.intercept_[0]
        
        return slope, intercept
    
    def train_driver_biases(self, probs: np.ndarray, actual: np.ndarray, driver_names: List[str]) -> Dict[str, float]:
        """Find optimal driver-specific bias corrections."""
        biases = {}
        
        for i, driver in enumerate(driver_names):
            driver_probs = probs[:, i]
            driver_actual = actual[:, i]
            
            # Calculate current bias
            current_bias = self.calculate_bias(driver_probs, driver_actual)
            
            # Apply bias correction
            bias_correction = -current_bias * 0.5  # Conservative correction
            
            biases[driver] = bias_correction
        
        return biases
    
    def train_calibration_pipeline(self) -> Dict:
        """Train the complete calibration pipeline."""
        print("🚀 Loading sample F1 race data...")
        raw_probs, actual_results, driver_names = self.load_sample_data()
        
        print(f"📊 Training on {raw_probs.shape[0]} races with {raw_probs.shape[1]} drivers")
        
        # Step 1: Train temperature scaling
        print("🌡️ Training temperature scaling...")
        optimal_temp = self.train_temperature_scaling(raw_probs, actual_results)
        print(f"   Optimal temperature: {optimal_temp:.3f}")
        
        # Step 2: Apply temperature scaling
        temp_scaled = self.apply_temperature_scaling(raw_probs, optimal_temp)
        temp_scaled = self.normalize_probabilities(temp_scaled)
        
        # Step 3: Train logistic calibration
        print("📈 Training logistic calibration...")
        optimal_slope, optimal_intercept = self.train_logistic_calibration(temp_scaled, actual_results)
        print(f"   Optimal slope: {optimal_slope:.3f}")
        print(f"   Optimal intercept: {optimal_intercept:.3f}")
        
        # Step 4: Apply logistic calibration
        logistic_calibrated = self.apply_logistic_calibration(temp_scaled, optimal_slope, optimal_intercept)
        logistic_calibrated = self.normalize_probabilities(logistic_calibrated)
        
        # Step 5: Train driver biases
        print("🏎️ Training driver-specific biases...")
        optimal_biases = self.train_driver_biases(logistic_calibrated, actual_results, driver_names)
        
        # Show top bias corrections
        sorted_biases = sorted(optimal_biases.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
        print("   Top bias corrections:")
        for driver, bias in sorted_biases:
            print(f"     {driver}: {bias:+.3f}")
        
        # Step 6: Apply driver biases
        bias_corrected = self.apply_driver_bias_correction(logistic_calibrated, optimal_biases, driver_names)
        bias_corrected = self.normalize_probabilities(bias_corrected)
        
        # Step 7: Evaluate final calibration
        print("📊 Evaluating calibration quality...")
        metrics = self.evaluate_calibration(raw_probs, bias_corrected, actual_results)
        
        # Update calibration parameters
        self.calibration_params.update({
            'temperature': optimal_temp,
            'logistic_slope': optimal_slope,
            'logistic_intercept': optimal_intercept,
            'driver_biases': optimal_biases
        })
        
        return metrics
    
    def plot_calibration_results(self, raw_probs: np.ndarray, calibrated_probs: np.ndarray, actual_results: np.ndarray):
        """Plot calibration results and improvements."""
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('F1 Prediction Calibration Results', fontsize=16, fontweight='bold')
        
        # Plot 1: Bias progression
        bias_steps = ['Raw', 'Temp Scaled', 'Logistic', 'Bias Corrected']
        bias_values = [
            self.calculate_bias(raw_probs, actual_results),
            self.calculate_bias(self.apply_temperature_scaling(raw_probs, self.calibration_params['temperature']), actual_results),
            self.calculate_bias(self.apply_logistic_calibration(
                self.apply_temperature_scaling(raw_probs, self.calibration_params['temperature']),
                self.calibration_params['logistic_slope'],
                self.calibration_params['logistic_intercept']
            ), actual_results),
            self.calculate_bias(calibrated_probs, actual_results)
        ]
        
        axes[0, 0].plot(bias_steps, bias_values, 'o-', linewidth=2, markersize=8)
        axes[0, 0].axhline(y=0, color='red', linestyle='--', alpha=0.7, label='Ideal (No Bias)')
        axes[0, 0].set_title('Bias Progression Across Calibration Steps')
        axes[0, 0].set_ylabel('Mean Bias')
        axes[0, 0].grid(True, alpha=0.3)
        axes[0, 0].legend()
        
        # Plot 2: Reliability diagram
        bins = 10
        bin_centers = np.linspace(0.05, 0.95, bins)
        
        # Raw predictions
        raw_reliability = []
        for center in bin_centers:
            bin_mask = (raw_probs >= center - 0.05) & (raw_probs < center + 0.05)
            if np.any(bin_mask):
                avg_pred = np.mean(raw_probs[bin_mask])
                avg_actual = np.mean(actual_results[bin_mask])
                raw_reliability.append((avg_pred, avg_actual))
        
        # Calibrated predictions
        cal_reliability = []
        for center in bin_centers:
            bin_mask = (calibrated_probs >= center - 0.05) & (calibrated_probs < center + 0.05)
            if np.any(bin_mask):
                avg_pred = np.mean(calibrated_probs[bin_mask])
                avg_actual = np.mean(actual_results[bin_mask])
                cal_reliability.append((avg_pred, avg_actual))
        
        if raw_reliability:
            raw_x, raw_y = zip(*raw_reliability)
            axes[0, 1].scatter(raw_x, raw_y, alpha=0.7, label='Raw Predictions', color='red')
        
        if cal_reliability:
            cal_x, cal_y = zip(*cal_reliability)
            axes[0, 1].scatter(cal_x, cal_y, alpha=0.7, label='Calibrated Predictions', color='green')
        
        axes[0, 1].plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Perfect Calibration')
        axes[0, 1].set_title('Reliability Diagram')
        axes[0, 1].set_xlabel('Predicted Probability')
        axes[0, 1].set_ylabel('Actual Frequency')
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].legend()
        
        # Plot 3: Log loss comparison
        log_loss_steps = ['Raw', 'Calibrated']
        log_loss_values = [
            self.calculate_log_loss(raw_probs, actual_results),
            self.calculate_log_loss(calibrated_probs, actual_results)
        ]
        
        bars = axes[1, 0].bar(log_loss_steps, log_loss_values, color=['red', 'green'], alpha=0.7)
        axes[1, 0].set_title('Log Loss Comparison')
        axes[1, 0].set_ylabel('Log Loss (Lower is Better)')
        axes[1, 0].grid(True, alpha=0.3)
        
        # Add value labels on bars
        for bar, value in zip(bars, log_loss_values):
            height = bar.get_height()
            axes[1, 0].text(bar.get_x() + bar.get_width()/2., height + 0.01,
                           f'{value:.3f}', ha='center', va='bottom')
        
        # Plot 4: Driver bias corrections
        driver_names = list(self.calibration_params['driver_biases'].keys())
        bias_values = list(self.calibration_params['driver_biases'].values())
        
        # Sort by absolute bias
        sorted_data = sorted(zip(driver_names, bias_values), key=lambda x: abs(x[1]), reverse=True)
        sorted_names, sorted_biases = zip(*sorted_data)
        
        colors = ['red' if b < 0 else 'green' for b in sorted_biases]
        bars = axes[1, 1].barh(range(len(sorted_names)), sorted_biases, color=colors, alpha=0.7)
        axes[1, 1].set_yticks(range(len(sorted_names)))
        axes[1, 1].set_yticklabels(sorted_names)
        axes[1, 1].set_title('Driver Bias Corrections')
        axes[1, 1].set_xlabel('Bias Correction')
        axes[1, 1].axvline(x=0, color='black', linestyle='-', alpha=0.5)
        axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('f1_calibration_results.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def save_calibration_params(self, filename: str = 'calibration_params.json'):
        """Save calibration parameters to JSON file."""
        with open(filename, 'w') as f:
            json.dump(self.calibration_params, f, indent=2)
        print(f"💾 Calibration parameters saved to {filename}")
    
    def export_typescript_params(self, filename: str = 'calibration_params.ts'):
        """Export calibration parameters in TypeScript format."""
        ts_content = f"""// Auto-generated calibration parameters
export const CALIBRATION_PARAMS = {{
  temperature: {self.calibration_params['temperature']},
  logisticSlope: {self.calibration_params['logistic_slope']},
  logisticIntercept: {self.calibration_params['logistic_intercept']},
  driverBiases: {{
{chr(10).join(f'    "{driver}": {bias},' for driver, bias in self.calibration_params['driver_biases'].items())}
  }},
  trackTypeAdjustments: {{
{chr(10).join(f'    "{track_type}": {adjustment},' for track_type, adjustment in self.calibration_params['track_type_adjustments'].items())}
  }}
}};
"""
        
        with open(filename, 'w') as f:
            f.write(ts_content)
        print(f"📝 TypeScript parameters exported to {filename}")

def main():
    """Main training function."""
    print("🏎️ F1 Prediction Calibration Training")
    print("=" * 50)
    
    # Initialize trainer
    trainer = F1CalibrationTrainer()
    
    # Train calibration pipeline
    metrics = trainer.train_calibration_pipeline()
    
    # Display results
    print("\n📊 Calibration Results:")
    print(f"   Bias improvement: {metrics['before_bias']:.4f} → {metrics['after_bias']:.4f}")
    print(f"   Log loss improvement: {metrics['before_log_loss']:.4f} → {metrics['after_log_loss']:.4f}")
    print(f"   Brier score improvement: {metrics['before_brier_score']:.4f} → {metrics['after_brier_score']:.4f}")
    print(f"   Reliability score: {metrics['reliability_score']:.4f}")
    
    # Load data for plotting
    raw_probs, actual_results, driver_names = trainer.load_sample_data()
    
    # Apply final calibration for plotting
    temp_scaled = trainer.apply_temperature_scaling(raw_probs, trainer.calibration_params['temperature'])
    temp_scaled = trainer.normalize_probabilities(temp_scaled)
    logistic_calibrated = trainer.apply_logistic_calibration(
        temp_scaled, 
        trainer.calibration_params['logistic_slope'],
        trainer.calibration_params['logistic_intercept']
    )
    logistic_calibrated = trainer.normalize_probabilities(logistic_calibrated)
    final_calibrated = trainer.apply_driver_bias_correction(
        logistic_calibrated, 
        trainer.calibration_params['driver_biases'], 
        driver_names
    )
    final_calibrated = trainer.normalize_probabilities(final_calibrated)
    
    # Plot results
    print("\n📈 Generating calibration plots...")
    trainer.plot_calibration_results(raw_probs, final_calibrated, actual_results)
    
    # Save parameters
    trainer.save_calibration_params()
    trainer.export_typescript_params()
    
    print("\n✅ Calibration training complete!")
    print("   Use the generated parameters in your F1CalibrationService")

if __name__ == "__main__":
    main()
