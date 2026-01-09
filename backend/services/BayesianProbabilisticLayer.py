"""
Bayesian Probabilistic Layer for F1 Predictions
Implements Bayesian inference to model prediction uncertainty,
improve edge-case probability estimates, and combine prior knowledge
with new race data to output updated probability distributions.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
import logging
from scipy import stats
from scipy.stats import beta, gamma, norm
import json
import time

logger = logging.getLogger(__name__)

@dataclass
class BayesianPrior:
    """Bayesian prior distribution for a driver"""
    driver_id: str
    driver_name: str
    
    # Prior parameters for win probability (Beta distribution)
    alpha_win: float  # Beta distribution alpha parameter
    beta_win: float   # Beta distribution beta parameter
    
    # Prior parameters for position (Normal distribution)
    mu_position: float    # Mean position
    sigma_position: float # Standard deviation of position
    
    # Prior parameters for reliability (Gamma distribution)
    k_reliability: float  # Shape parameter
    theta_reliability: float  # Scale parameter
    
    # Prior strength (higher = stronger prior)
    prior_strength: float
    
    # Historical data points
    historical_races: int
    last_updated: str

@dataclass
class BayesianPosterior:
    """Bayesian posterior distribution for a driver"""
    driver_id: str
    driver_name: str
    
    # Posterior win probability
    win_probability: float
    win_credible_interval_95: Tuple[float, float]
    win_credible_interval_99: Tuple[float, float]
    
    # Posterior position distribution
    expected_position: float
    position_credible_interval_95: Tuple[float, float]
    position_credible_interval_99: Tuple[float, float]
    
    # Posterior reliability
    expected_reliability: float
    reliability_credible_interval_95: Tuple[float, float]
    
    # Uncertainty metrics
    uncertainty_score: float
    evidence_strength: float
    
    # Model diagnostics
    convergence_metric: float
    effective_sample_size: float

class BayesianProbabilisticLayer:
    """
    Advanced Bayesian probabilistic layer for F1 race predictions
    """
    
    def __init__(self, prior_strength: float = 1.0):
        self.prior_strength = prior_strength
        self.priors = {}
        self.posteriors = {}
        
        logger.info(f" Bayesian Probabilistic Layer initialized with prior strength {prior_strength}")
    
    def initialize_priors(
        self,
        driver_profiles: Dict[str, Any],
        historical_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, BayesianPrior]:
        """
        Initialize Bayesian priors for all drivers
        
        Args:
            driver_profiles: Dictionary of driver profiles
            historical_data: Optional historical performance data
        
        Returns:
            Dictionary of Bayesian priors for each driver
        """
        logger.info(" Initializing Bayesian priors for all drivers...")
        
        for driver_id, profile in driver_profiles.items():
            prior = self._create_driver_prior(profile, historical_data)
            self.priors[driver_id] = prior
        
        logger.info(f"✅ Initialized {len(self.priors)} Bayesian priors")
        return self.priors
    
    def _create_driver_prior(
        self,
        profile: Any,
        historical_data: Optional[Dict[str, Any]] = None
    ) -> BayesianPrior:
        """Create Bayesian prior for a specific driver"""
        
        # Extract historical data if available
        if historical_data and profile.driver_id in historical_data:
            hist_data = historical_data[profile.driver_id]
            historical_races = hist_data.get('races', 0)
            historical_wins = hist_data.get('wins', 0)
            historical_positions = hist_data.get('positions', [])
        else:
            historical_races = 0
            historical_wins = 0
            historical_positions = []
        
        # Win probability prior (Beta distribution)
        if historical_races > 0:
            # Use historical win rate
            win_rate = historical_wins / historical_races
            alpha_win = win_rate * 10 + 1  # Prior strength of 10
            beta_win = (1 - win_rate) * 10 + 1
        else:
            # Use driver tier to estimate win probability
            tier_win_rate = self._estimate_win_rate_from_tier(profile.driver_tier)
            alpha_win = tier_win_rate * 5 + 1  # Prior strength of 5
            beta_win = (1 - tier_win_rate) * 5 + 1
        
        # Position prior (Normal distribution)
        if historical_positions:
            mu_position = np.mean(historical_positions)
            sigma_position = np.std(historical_positions)
        else:
            # Use driver tier to estimate position
            mu_position = self._estimate_position_from_tier(profile.driver_tier)
            sigma_position = 5.0  # Conservative uncertainty
        
        # Reliability prior (Gamma distribution)
        k_reliability = 5.0  # Shape parameter
        theta_reliability = profile.car_reliability / k_reliability  # Scale parameter
        
        # Prior strength based on experience
        prior_strength = min(profile.experience_years / 5.0, 2.0)
        
        prior = BayesianPrior(
            driver_id=profile.driver_id,
            driver_name=profile.name,
            alpha_win=alpha_win,
            beta_win=beta_win,
            mu_position=mu_position,
            sigma_position=sigma_position,
            k_reliability=k_reliability,
            theta_reliability=theta_reliability,
            prior_strength=prior_strength,
            historical_races=historical_races,
            last_updated=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        return prior
    
    def _estimate_win_rate_from_tier(self, driver_tier: str) -> float:
        """Estimate win rate based on driver tier"""
        tier_win_rates = {
            "Elite": 0.15,      # 15% win rate
            "Strong": 0.08,     # 8% win rate
            "Midfield": 0.03,   # 3% win rate
            "Developing": 0.01  # 1% win rate
        }
        return tier_win_rates.get(driver_tier, 0.05)
    
    def _estimate_position_from_tier(self, driver_tier: str) -> float:
        """Estimate average position based on driver tier"""
        tier_positions = {
            "Elite": 4.0,       # Average 4th position
            "Strong": 7.0,      # Average 7th position
            "Midfield": 12.0,   # Average 12th position
            "Developing": 16.0  # Average 16th position
        }
        return tier_positions.get(driver_tier, 10.0)
    
    def update_with_race_data(
        self,
        race_results: Dict[str, Any],
        track_type: str,
        weather_condition: str
    ) -> Dict[str, BayesianPosterior]:
        """
        Update Bayesian priors with new race data
        
        Args:
            race_results: Results from a race
            track_type: Type of track
            weather_condition: Weather condition
        
        Returns:
            Updated Bayesian posteriors for all drivers
        """
        logger.info("🔄 Updating Bayesian priors with new race data...")
        
        posteriors = {}
        
        for driver_id, prior in self.priors.items():
            if driver_id in race_results:
                race_data = race_results[driver_id]
                posterior = self._update_driver_posterior(prior, race_data, track_type, weather_condition)
                posteriors[driver_id] = posterior
            else:
                # No race data, use prior as posterior
                posterior = self._prior_to_posterior(prior)
                posteriors[driver_id] = posterior
        
        self.posteriors = posteriors
        logger.info(f"✅ Updated {len(posteriors)} Bayesian posteriors")
        
        return posteriors
    
    def _update_driver_posterior(
        self,
        prior: BayesianPrior,
        race_data: Dict[str, Any],
        track_type: str,
        weather_condition: str
    ) -> BayesianPosterior:
        """Update posterior for a specific driver with race data"""
        
        # Extract race data
        position = race_data.get('position', prior.mu_position)
        points = race_data.get('points', 0.0)
        reliability = race_data.get('reliability_factor', 1.0)
        
        # Win indicator (1 if won, 0 otherwise)
        win_indicator = 1.0 if position == 1 else 0.0
        
        # Update win probability posterior (Beta-Binomial conjugate)
        alpha_posterior = prior.alpha_win + win_indicator
        beta_posterior = prior.beta_win + (1 - win_indicator)
        
        # Update position posterior (Normal-Normal conjugate)
        # Assume race data has variance of 4.0
        data_variance = 4.0
        prior_precision = 1.0 / (prior.sigma_position ** 2)
        data_precision = 1.0 / data_variance
        
        posterior_precision = prior_precision + data_precision
        mu_posterior = (
            (prior.mu_position * prior_precision + position * data_precision) /
            posterior_precision
        )
        sigma_posterior = np.sqrt(1.0 / posterior_precision)
        
        # Update reliability posterior (Gamma conjugate)
        k_posterior = prior.k_reliability + 1
        theta_posterior = prior.theta_reliability * prior.k_reliability / k_posterior
        
        # Calculate posterior statistics
        win_probability = alpha_posterior / (alpha_posterior + beta_posterior)
        expected_position = mu_posterior
        expected_reliability = k_posterior * theta_posterior
        
        # Calculate credible intervals
        win_ci_95 = beta.interval(0.95, alpha_posterior, beta_posterior)
        win_ci_99 = beta.interval(0.99, alpha_posterior, beta_posterior)
        
        position_ci_95 = norm.interval(0.95, mu_posterior, sigma_posterior)
        position_ci_99 = norm.interval(0.99, mu_posterior, sigma_posterior)
        
        reliability_ci_95 = gamma.interval(0.95, k_posterior, scale=theta_posterior)
        
        # Calculate uncertainty metrics
        uncertainty_score = self._calculate_uncertainty_score(
            alpha_posterior, beta_posterior, sigma_posterior
        )
        
        evidence_strength = self._calculate_evidence_strength(
            prior, alpha_posterior, beta_posterior
        )
        
        # Model diagnostics
        convergence_metric = self._calculate_convergence_metric(prior, posterior_precision)
        effective_sample_size = alpha_posterior + beta_posterior
        
        posterior = BayesianPosterior(
            driver_id=prior.driver_id,
            driver_name=prior.driver_name,
            win_probability=win_probability,
            win_credible_interval_95=win_ci_95,
            win_credible_interval_99=win_ci_99,
            expected_position=expected_position,
            position_credible_interval_95=position_ci_95,
            position_credible_interval_99=position_ci_99,
            expected_reliability=expected_reliability,
            reliability_credible_interval_95=reliability_ci_95,
            uncertainty_score=uncertainty_score,
            evidence_strength=evidence_strength,
            convergence_metric=convergence_metric,
            effective_sample_size=effective_sample_size
        )
        
        return posterior
    
    def _prior_to_posterior(self, prior: BayesianPrior) -> BayesianPosterior:
        """Convert prior to posterior when no new data is available"""
        
        # Use prior means as expected values
        win_probability = prior.alpha_win / (prior.alpha_win + prior.beta_win)
        expected_position = prior.mu_position
        expected_reliability = prior.k_reliability * prior.theta_reliability
        
        # Calculate credible intervals from priors
        win_ci_95 = beta.interval(0.95, prior.alpha_win, prior.beta_win)
        win_ci_99 = beta.interval(0.99, prior.alpha_win, prior.beta_win)
        
        position_ci_95 = norm.interval(0.95, prior.mu_position, prior.sigma_position)
        position_ci_99 = norm.interval(0.99, prior.mu_position, prior.sigma_position)
        
        reliability_ci_95 = gamma.interval(0.95, prior.k_reliability, scale=prior.theta_reliability)
        
        # High uncertainty when using priors only
        uncertainty_score = 0.8
        evidence_strength = 0.2
        convergence_metric = 0.5
        effective_sample_size = prior.alpha_win + prior.beta_win
        
        posterior = BayesianPosterior(
            driver_id=prior.driver_id,
            driver_name=prior.driver_name,
            win_probability=win_probability,
            win_credible_interval_95=win_ci_95,
            win_credible_interval_99=win_ci_99,
            expected_position=expected_position,
            position_credible_interval_95=position_ci_95,
            position_credible_interval_99=position_ci_99,
            expected_reliability=expected_reliability,
            reliability_credible_interval_95=reliability_ci_95,
            uncertainty_score=uncertainty_score,
            evidence_strength=evidence_strength,
            convergence_metric=convergence_metric,
            effective_sample_size=effective_sample_size
        )
        
        return posterior
    
    def _calculate_uncertainty_score(
        self,
        alpha: float,
        beta: float,
        sigma_position: float
    ) -> float:
        """Calculate uncertainty score based on posterior parameters"""
        
        # Win probability uncertainty (Beta distribution variance)
        win_variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
        win_uncertainty = np.sqrt(win_variance)
        
        # Position uncertainty (normalized)
        position_uncertainty = sigma_position / 20.0  # Normalize by max position
        
        # Combined uncertainty score (0-1, higher = more uncertain)
        uncertainty_score = (win_uncertainty + position_uncertainty) / 2.0
        
        return min(uncertainty_score, 1.0)
    
    def _calculate_evidence_strength(
        self,
        prior: BayesianPrior,
        alpha_posterior: float,
        beta_posterior: float
    ) -> float:
        """Calculate strength of evidence from data"""
        
        # Prior strength
        prior_total = prior.alpha_win + prior.beta_win
        
        # Posterior strength
        posterior_total = alpha_posterior + beta_posterior
        
        # Evidence strength (0-1, higher = stronger evidence)
        evidence_strength = min((posterior_total - prior_total) / 10.0, 1.0)
        
        return max(evidence_strength, 0.0)
    
    def _calculate_convergence_metric(
        self,
        prior: BayesianPrior,
        posterior_precision: float
    ) -> float:
        """Calculate convergence metric for model diagnostics"""
        
        prior_precision = 1.0 / (prior.sigma_position ** 2)
        
        # Convergence metric (0-1, higher = more converged)
        convergence_metric = min(posterior_precision / (prior_precision + 1.0), 1.0)
        
        return convergence_metric
    
    def combine_with_monte_carlo(
        self,
        monte_carlo_results: List[Any],
        track_type: str,
        weather_condition: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Combine Bayesian posteriors with Monte Carlo simulation results
        
        Args:
            monte_carlo_results: Results from Monte Carlo simulations
            track_type: Type of track
            weather_condition: Weather condition
        
        Returns:
            Combined predictions with uncertainty quantification
        """
        logger.info("🔗 Combining Bayesian posteriors with Monte Carlo results...")
        
        combined_predictions = {}
        
        for mc_result in monte_carlo_results:
            driver_id = mc_result.driver_id
            
            if driver_id in self.posteriors:
                bayesian_posterior = self.posteriors[driver_id]
                
                # Combine Monte Carlo and Bayesian results
                combined = self._combine_driver_predictions(
                    mc_result, bayesian_posterior, track_type, weather_condition
                )
                
                combined_predictions[driver_id] = combined
        
        logger.info(f"✅ Combined {len(combined_predictions)} driver predictions")
        return combined_predictions
    
    def _combine_driver_predictions(
        self,
        mc_result: Any,
        bayesian_posterior: BayesianPosterior,
        track_type: str,
        weather_condition: str
    ) -> Dict[str, Any]:
        """Combine Monte Carlo and Bayesian results for a single driver"""
        
        # Weight factors for combination
        mc_weight = 0.6  # Monte Carlo weight
        bayesian_weight = 0.4  # Bayesian weight
        
        # Combined win probability
        combined_win_prob = (
            mc_result.win_probability * mc_weight +
            bayesian_posterior.win_probability * bayesian_weight
        )
        
        # Combined position expectation
        combined_position = (
            mc_result.avg_position * mc_weight +
            bayesian_posterior.expected_position * bayesian_weight
        )
        
        # Combined uncertainty (weighted average)
        combined_uncertainty = (
            mc_result.uncertainty_score * mc_weight +
            bayesian_posterior.uncertainty_score * bayesian_weight
        )
        
        # Track-specific adjustments
        track_adjustment = self._calculate_track_adjustment(
            track_type, mc_result.avg_track_advantage
        )
        
        # Weather-specific adjustments
        weather_adjustment = self._calculate_weather_adjustment(
            weather_condition, mc_result.avg_weather_impact
        )
        
        # Final adjusted predictions
        final_win_prob = combined_win_prob * track_adjustment * weather_adjustment
        final_position = combined_position / (track_adjustment * weather_adjustment)
        
        # Ensure probabilities sum to 1 (will be normalized later)
        final_win_prob = max(0.001, min(0.999, final_win_prob))
        
        combined_prediction = {
            'driver_id': mc_result.driver_id,
            'driver_name': mc_result.driver_name,
            'constructor': mc_result.constructor,
            
            # Combined predictions
            'win_probability': final_win_prob,
            'expected_position': final_position,
            'uncertainty_score': combined_uncertainty,
            
            # Monte Carlo results
            'mc_win_probability': mc_result.win_probability,
            'mc_avg_position': mc_result.avg_position,
            'mc_std_position': mc_result.std_position,
            'mc_podium_probability': mc_result.podium_probability,
            
            # Bayesian results
            'bayesian_win_probability': bayesian_posterior.win_probability,
            'bayesian_expected_position': bayesian_posterior.expected_position,
            'bayesian_uncertainty': bayesian_posterior.uncertainty_score,
            'bayesian_evidence_strength': bayesian_posterior.evidence_strength,
            
            # Credible intervals
            'win_ci_95': bayesian_posterior.win_credible_interval_95,
            'win_ci_99': bayesian_posterior.win_credible_interval_99,
            'position_ci_95': bayesian_posterior.position_credible_interval_95,
            'position_ci_99': bayesian_posterior.position_credible_interval_99,
            
            # Performance factors
            'track_adjustment': track_adjustment,
            'weather_adjustment': weather_adjustment,
            'reliability_factor': mc_result.avg_reliability,
            
            # Model diagnostics
            'convergence_metric': bayesian_posterior.convergence_metric,
            'effective_sample_size': bayesian_posterior.effective_sample_size
        }
        
        return combined_prediction
    
    def _calculate_track_adjustment(self, track_type: str, track_advantage: float) -> float:
        """Calculate track-specific adjustment factor"""
        base_adjustment = 1.0
        
        if track_type == "street":
            base_adjustment = 1.1
        elif track_type == "high_speed":
            base_adjustment = 1.05
        elif track_type == "technical":
            base_adjustment = 1.08
        elif track_type == "permanent":
            base_adjustment = 1.02
        
        # Combine with driver's track advantage
        final_adjustment = base_adjustment * track_advantage
        
        return np.clip(final_adjustment, 0.8, 1.3)
    
    def _calculate_weather_adjustment(self, weather_condition: str, weather_impact: float) -> float:
        """Calculate weather-specific adjustment factor"""
        base_adjustment = 1.0
        
        if weather_condition == "wet":
            base_adjustment = 0.95
        elif weather_condition == "intermediate":
            base_adjustment = 0.98
        elif weather_condition == "mixed":
            base_adjustment = 0.97
        
        # Combine with driver's weather impact
        final_adjustment = base_adjustment * weather_impact
        
        return np.clip(final_adjustment, 0.7, 1.2)
    
    def export_bayesian_data(
        self,
        filename: str = None
    ) -> str:
        """Export Bayesian priors and posteriors to JSON file"""
        if filename is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"bayesian_predictions_{timestamp}.json"
        
        export_data = {
            'priors': {},
            'posteriors': {},
            'metadata': {
                'prior_strength': self.prior_strength,
                'export_timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'total_drivers': len(self.priors)
            }
        }
        
        # Export priors
        for driver_id, prior in self.priors.items():
            export_data['priors'][driver_id] = {
                'driver_name': prior.driver_name,
                'alpha_win': prior.alpha_win,
                'beta_win': prior.beta_win,
                'mu_position': prior.mu_position,
                'sigma_position': prior.sigma_position,
                'k_reliability': prior.k_reliability,
                'theta_reliability': prior.theta_reliability,
                'prior_strength': prior.prior_strength,
                'historical_races': prior.historical_races,
                'last_updated': prior.last_updated
            }
        
        # Export posteriors
        for driver_id, posterior in self.posteriors.items():
            export_data['posteriors'][driver_id] = {
                'driver_name': posterior.driver_name,
                'win_probability': posterior.win_probability,
                'win_ci_95': posterior.win_credible_interval_95,
                'win_ci_99': posterior.win_credible_interval_99,
                'expected_position': posterior.expected_position,
                'position_ci_95': posterior.position_credible_interval_95,
                'position_ci_99': posterior.position_credible_interval_99,
                'expected_reliability': posterior.expected_reliability,
                'reliability_ci_95': posterior.reliability_credible_interval_95,
                'uncertainty_score': posterior.uncertainty_score,
                'evidence_strength': posterior.evidence_strength,
                'convergence_metric': posterior.convergence_metric,
                'effective_sample_size': posterior.effective_sample_size
            }
        
        # Write to file
        with open(filename, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        logger.info(f"💾 Bayesian data exported to {filename}")
        return filename
    
    def get_uncertainty_summary(self) -> Dict[str, Any]:
        """Get summary of uncertainty metrics across all drivers"""
        if not self.posteriors:
            return {}
        
        uncertainty_scores = [p.uncertainty_score for p in self.posteriors.values()]
        evidence_strengths = [p.evidence_strength for p in self.posteriors.values()]
        convergence_metrics = [p.convergence_metric for p in self.posteriors.values()]
        
        summary = {
            'total_drivers': len(self.posteriors),
            'avg_uncertainty': np.mean(uncertainty_scores),
            'avg_evidence_strength': np.mean(evidence_strengths),
            'avg_convergence': np.mean(convergence_metrics),
            'high_uncertainty_drivers': [
                p.driver_name for p in self.posteriors.values()
                if p.uncertainty_score > 0.7
            ],
            'low_evidence_drivers': [
                p.driver_name for p in self.posteriors.values()
                if p.evidence_strength < 0.3
            ]
        }
        
        return summary
