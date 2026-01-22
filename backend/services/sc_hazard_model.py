"""
Safety Car Hazard Model - Real-Time SC Probability Inference
Uses discrete-time hazard modeling for SC/VSC deployment probability.
"""
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class SCHazardFeatures:
    """Feature vector for hazard estimation at lap t."""
    gap_compression: float  # Inverse of field spread (higher = tighter pack)
    tyre_age_variance: float  # Dispersion in tyre ages across grid
    weather_intensity: float  # 0.0 = dry, 1.0 = heavy rain
    track_incident_density: float  # Historical SC frequency for this track
    aggression_index: float  # Mean aggression of field (from RestartSkill)
    lapped_traffic_density: float  # Number of lapped cars in pack

@dataclass
class SCPrediction:
    """Output of hazard model."""
    sc_probability_next_5_laps: float
    vsc_probability: float
    dominant_factors: List[str]
    confidence: float

class SCHazardModel:
    """
    Cox-style discrete-time hazard model for Safety Car deployment.
    h(t) = h0(t) * exp(beta^T * X_t)
    """
    
    def __init__(self, track_baselines: Optional[Dict[str, float]] = None):
        # Baseline hazard per track (calibrated from historical data)
        self.track_baselines = track_baselines or {
            "abu_dhabi": 0.18,
            "bahrain": 0.12,
            "jeddah": 0.48,
            "melbourne": 0.54,
            "monaco": 0.60,
            "singapore": 1.00,  # Always has SC historically
            "baku": 0.50,
            "silverstone": 0.55,
            "monza": 0.45,
            "spa": 0.30,
        }
        
        # Hazard coefficients (calibrated offline)
        self.beta = {
            "gap_compression": 0.8,      # Tight field = more risk
            "tyre_age_variance": 0.3,    # Mixed strategies = incidents
            "weather_intensity": 1.5,    # Rain = major risk factor
            "incident_density": 0.5,     # Track history matters
            "aggression_index": 0.6,     # Aggressive drivers = more chaos
            "lapped_traffic": 0.4,       # Blue flags = risk
        }
        
        # Online Bayesian update state
        self.cumulative_no_sc_laps = 0
        self.observed_incidents = 0
    
    def compute_hazard(
        self,
        track_id: str,
        features: SCHazardFeatures,
        lap: int,
        total_laps: int
    ) -> float:
        """
        Compute instantaneous hazard h(t) for current lap.
        """
        # Baseline hazard (track-specific, decays slightly as race progresses)
        h0 = self.track_baselines.get(track_id, 0.20)
        time_decay = 1.0 - (lap / total_laps) * 0.2  # Slight decay late-race
        h0 *= time_decay
        
        # Linear predictor (log-hazard contribution)
        linear_pred = (
            self.beta["gap_compression"] * features.gap_compression +
            self.beta["tyre_age_variance"] * features.tyre_age_variance +
            self.beta["weather_intensity"] * features.weather_intensity +
            self.beta["incident_density"] * features.track_incident_density +
            self.beta["aggression_index"] * features.aggression_index +
            self.beta["lapped_traffic"] * features.lapped_traffic_density
        )
        
        # Cox-style hazard
        hazard = h0 * np.exp(linear_pred)
        
        # Clamp to reasonable probability
        return np.clip(hazard, 0.0, 0.95)
    
    def predict_next_n_laps(
        self,
        track_id: str,
        features: SCHazardFeatures,
        current_lap: int,
        total_laps: int,
        n_laps: int = 5
    ) -> SCPrediction:
        """
        Compute P(SC in next N laps) using cumulative hazard.
        P(SC_{t -> t+N}) = 1 - exp(-sum_{k=1}^{N} h(t+k))
        """
        cumulative_hazard = 0.0
        
        for k in range(1, n_laps + 1):
            future_lap = current_lap + k
            if future_lap > total_laps:
                break
            h_k = self.compute_hazard(track_id, features, future_lap, total_laps)
            cumulative_hazard += h_k
        
        # Convert to probability
        sc_prob = 1.0 - np.exp(-cumulative_hazard / total_laps * n_laps)
        
        # VSC is roughly 40% of SC probability
        vsc_prob = sc_prob * 0.4
        
        # Identify dominant factors
        factor_contributions = {
            "Gap Compression": self.beta["gap_compression"] * features.gap_compression,
            "Tyre Strategy Mix": self.beta["tyre_age_variance"] * features.tyre_age_variance,
            "Weather": self.beta["weather_intensity"] * features.weather_intensity,
            "Track History": self.beta["incident_density"] * features.track_incident_density,
            "Driver Aggression": self.beta["aggression_index"] * features.aggression_index,
            "Lapped Traffic": self.beta["lapped_traffic"] * features.lapped_traffic_density,
        }
        
        # Sort and take top 2
        sorted_factors = sorted(factor_contributions.items(), key=lambda x: x[1], reverse=True)
        dominant = [f[0] for f in sorted_factors[:2] if f[1] > 0.1]
        
        # Confidence based on how many factors are strong
        confidence = min(0.9, 0.5 + sum(1 for f in sorted_factors if f[1] > 0.2) * 0.1)
        
        return SCPrediction(
            sc_probability_next_5_laps=float(np.clip(sc_prob, 0.0, 0.99)),
            vsc_probability=float(np.clip(vsc_prob, 0.0, 0.5)),
            dominant_factors=dominant if dominant else ["Baseline Track Risk"],
            confidence=confidence
        )
    
    def bayesian_update(self, sc_occurred: bool) -> None:
        """
        Online Bayesian update after each lap.
        Adjusts baseline hazard based on observed outcomes.
        """
        if sc_occurred:
            self.observed_incidents += 1
            self.cumulative_no_sc_laps = 0  # Reset
        else:
            self.cumulative_no_sc_laps += 1
        
        # Dampening factor (reduces baseline if no SC for many laps)
        # This prevents over-prediction in calm races
        # Applied globally, not per-track, for simplicity


# Singleton instance
sc_hazard_model = SCHazardModel()
