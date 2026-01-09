"""
Monte Carlo Simulation Engine for F1 Predictions
Runs 1000+ simulations per race to produce robust probabilistic distributions,
variance estimates, and confidence intervals for each driver.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

logger = logging.getLogger(__name__)

@dataclass
class SimulationResult:
    """Result of a single Monte Carlo simulation"""
    driver_id: str
    driver_name: str
    constructor: str
    position: int
    points: float
    finish_time: float
    reliability_factor: float
    weather_impact: float
    track_advantage: float

@dataclass
class DriverSimulationStats:
    """Aggregated statistics for a driver across all simulations"""
    driver_id: str
    driver_name: str
    constructor: str
    
    # Position statistics
    avg_position: float
    median_position: float
    std_position: float
    min_position: int
    max_position: int
    
    # Win probability
    win_probability: float
    podium_probability: float
    points_probability: float
    
    # Confidence intervals
    position_ci_95: Tuple[float, float]
    position_ci_99: Tuple[float, float]
    
    # Variance and uncertainty
    position_variance: float
    uncertainty_score: float
    
    # Performance factors
    avg_reliability: float
    avg_weather_impact: float
    avg_track_advantage: float

class MonteCarloEngine:
    """
    Advanced Monte Carlo simulation engine for F1 race predictions
    """
    
    def __init__(self, num_simulations: int = 30000, random_seed: int = None):
        self.num_simulations = num_simulations
        self.random_seed = random_seed
        
        if random_seed is not None:
            np.random.seed(random_seed)
        
        logger.info(f"🚀 Monte Carlo Engine initialized with {num_simulations} simulations")
    
    def simulate_race(
        self,
        driver_profiles: Dict[str, Any],
        track_type: str,
        weather_condition: str,
        track_characteristics: Dict[str, Any],
        weather_impact: Dict[str, Any]
    ) -> List[SimulationResult]:
        """
        Simulate a single race with all drivers
        
        Args:
            driver_profiles: Dictionary of driver profiles
            track_type: Type of track (street, high_speed, technical, permanent)
            weather_condition: Weather condition (dry, wet, intermediate, mixed)
            track_characteristics: Track-specific characteristics
            weather_impact: Weather impact factors
        
        Returns:
            List of simulation results for all drivers
        """
        results = []
        
        for driver_id, profile in driver_profiles.items():
            # Base performance score
            base_score = self._calculate_base_score(profile)
            
            # Track-specific adjustments
            track_score = self._apply_track_adjustments(
                base_score, profile, track_type, track_characteristics
            )
            
            # Weather adjustments
            weather_score = self._apply_weather_adjustments(
                track_score, profile, weather_condition, weather_impact
            )
            
            # Reliability factor (random component)
            reliability_factor = self._simulate_reliability(profile)
            
            # Final performance score
            final_score = weather_score * reliability_factor
            
            # Simulate race outcome
            position, points, finish_time = self._simulate_race_outcome(
                final_score, profile, track_type
            )
            
            # Create simulation result
            result = SimulationResult(
                driver_id=driver_id,
                driver_name=profile.name,
                constructor=profile.constructor,
                position=position,
                points=points,
                finish_time=finish_time,
                reliability_factor=reliability_factor,
                weather_impact=weather_score / track_score if track_score > 0 else 1.0,
                track_advantage=track_score / base_score if base_score > 0 else 1.0
            )
            
            results.append(result)
        
        # Sort by position
        results.sort(key=lambda x: x.position)
        
        return results
    
    def _calculate_base_score(self, profile: Any) -> float:
        """Calculate base performance score for a driver"""
        # Driver tier multiplier
        tier_score = profile.tier_multiplier
        
        # Recent form
        form_score = profile.recent_form
        
        # Season performance (normalized)
        season_score = min(profile.season_points / 250.0, 1.0) + 0.5
        
        # Experience factor
        experience_factor = min(profile.experience_years / 10.0, 1.0) + 0.5
        
        # Team strength
        team_score = profile.team_strength
        
        # Base score calculation
        base_score = (
            tier_score * 0.3 +
            form_score * 0.25 +
            season_score * 0.2 +
            experience_factor * 0.15 +
            team_score * 0.1
        )
        
        return base_score
    
    def _apply_track_adjustments(
        self,
        base_score: float,
        profile: Any,
        track_type: str,
        track_characteristics: Dict[str, Any]
    ) -> float:
        """Apply track-specific performance adjustments"""
        # Get driver's track performance for this track type
        track_performance = profile.track_performance.get(track_type, 1.0)
        
        # Track characteristics impact
        track_advantage = 1.0
        
        if track_type == "street":
            # Street circuits favor chassis balance and tire management
            track_advantage = (
                profile.track_performance.get("street", 1.0) *
                profile.tire_management *
                profile.chassis_balance
            ) / 2.0
        elif track_type == "high_speed":
            # High-speed circuits favor aero efficiency and power
            track_advantage = (
                profile.track_performance.get("high_speed", 1.0) *
                profile.race_pace
            ) / 1.5
        elif track_type == "technical":
            # Technical circuits favor driver skill and chassis balance
            track_advantage = (
                profile.track_performance.get("technical", 1.0) *
                profile.qualifying_strength *
                profile.chassis_balance
            ) / 2.0
        
        # Apply track adjustments
        adjusted_score = base_score * track_performance * track_advantage
        
        return adjusted_score
    
    def _apply_weather_adjustments(
        self,
        track_score: float,
        profile: Any,
        weather_condition: str,
        weather_impact: Dict[str, Any]
    ) -> float:
        """Apply weather-specific performance adjustments"""
        # Get driver's weather sensitivity
        weather_sensitivity = profile.weather_sensitivity.get(weather_condition, 1.0)
        
        # Weather impact factors
        if weather_condition == "wet":
            # Wet conditions heavily favor driver skill
            weather_advantage = (
                profile.wet_weather_skill *
                profile.tire_management *
                weather_sensitivity
            ) / 2.0
        elif weather_condition == "intermediate":
            # Intermediate conditions favor adaptability
            weather_advantage = (
                profile.wet_weather_skill *
                profile.tire_management
            ) / 1.5
        elif weather_condition == "mixed":
            # Mixed conditions favor strategy and adaptability
            weather_advantage = (
                profile.wet_weather_skill *
                profile.race_pace
            ) / 1.5
        else:  # dry
            # Dry conditions are baseline
            weather_advantage = 1.0
        
        # Apply weather adjustments
        adjusted_score = track_score * weather_sensitivity * weather_advantage
        
        return adjusted_score
    
    def _simulate_reliability(self, profile: Any) -> float:
        """Simulate car reliability factor"""
        # Base reliability from team
        base_reliability = profile.car_reliability
        
        # Add random variation (±10%)
        reliability_variation = np.random.normal(0, 0.1)
        reliability_factor = base_reliability + reliability_variation
        
        # Ensure reliability is within bounds
        reliability_factor = np.clip(reliability_factor, 0.7, 1.2)
        
        return reliability_factor
    
    def _simulate_race_outcome(
        self,
        final_score: float,
        profile: Any,
        track_type: str
    ) -> Tuple[int, float, float]:
        """Simulate final race outcome (position, points, finish time)"""
        # Add random noise to final score
        noise = np.random.normal(0, 0.15)
        final_score_with_noise = final_score + noise
        
        # Simulate qualifying position (influences starting position)
        qualifying_noise = np.random.normal(0, 0.2)
        qualifying_score = final_score + qualifying_noise
        
        # Simulate race pace (separate from qualifying)
        race_noise = np.random.normal(0, 0.25)
        race_score = final_score + race_noise
        
        # Combine qualifying and race performance
        overall_score = (qualifying_score * 0.4 + race_score * 0.6)
        
        # Convert to position (1-20)
        # Higher score = better position
        position = self._score_to_position(overall_score)
        
        # Calculate points based on position
        points = self._position_to_points(position)
        
        # Simulate finish time (base time + performance variation)
        base_time = 90.0  # 90 minutes base
        time_variation = (1.0 - overall_score) * 10.0  # ±10 minutes
        finish_time = base_time + time_variation
        
        return position, points, finish_time
    
    def _score_to_position(self, score: float) -> int:
        """Convert performance score to finishing position"""
        # Normalize score to 0-1 range
        normalized_score = np.clip(score, 0.5, 2.0)
        normalized_score = (normalized_score - 0.5) / 1.5
        
        # Convert to position (1-20)
        # Use exponential distribution to favor top positions
        position = int(np.exp(normalized_score * 2.5) + 1)
        
        # Ensure position is within bounds
        position = np.clip(position, 1, 20)
        
        return position
    
    def _position_to_points(self, position: int) -> float:
        """Convert finishing position to championship points"""
        points_map = {
            1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
            6: 8, 7: 6, 8: 4, 9: 2, 10: 1
        }
        
        return points_map.get(position, 0.0)
    
    def run_multiple_simulations(
        self,
        driver_profiles: Dict[str, Any],
        track_type: str,
        weather_condition: str,
        track_characteristics: Dict[str, Any],
        weather_impact: Dict[str, Any],
        num_simulations: int = None
    ) -> List[DriverSimulationStats]:
        """
        Run multiple Monte Carlo simulations and aggregate results
        
        Args:
            driver_profiles: Dictionary of driver profiles
            track_type: Type of track
            weather_condition: Weather condition
            track_characteristics: Track characteristics
            weather_impact: Weather impact factors
            num_simulations: Number of simulations (overrides default)
        
        Returns:
            List of aggregated statistics for each driver
        """
        if num_simulations is None:
            num_simulations = self.num_simulations
        
        logger.info(f"🎲 Running {num_simulations} Monte Carlo simulations...")
        start_time = time.time()
        
        # Run simulations
        all_results = []
        for i in range(num_simulations):
            if i % 100 == 0:
                logger.info(f"   Progress: {i}/{num_simulations} simulations completed")
            
            race_result = self.simulate_race(
                driver_profiles, track_type, weather_condition,
                track_characteristics, weather_impact
            )
            all_results.append(race_result)
        
        # Aggregate results
        aggregated_stats = self._aggregate_simulation_results(all_results)
        
        elapsed_time = time.time() - start_time
        logger.info(f"✅ Completed {num_simulations} simulations in {elapsed_time:.2f}s")
        
        return aggregated_stats
    
    def _aggregate_simulation_results(
        self,
        all_results: List[List[SimulationResult]]
    ) -> List[DriverSimulationStats]:
        """Aggregate results from multiple simulations"""
        # Group results by driver
        driver_results = {}
        
        for race_result in all_results:
            for driver_result in race_result:
                driver_id = driver_result.driver_id
                if driver_id not in driver_results:
                    driver_results[driver_id] = []
                driver_results[driver_id].append(driver_result)
        
        # Calculate statistics for each driver
        aggregated_stats = []
        
        for driver_id, results in driver_results.items():
            if not results:
                continue
            
            # Extract data
            positions = [r.position for r in results]
            points = [r.points for r in results]
            reliability = [r.reliability_factor for r in results]
            weather_impact = [r.weather_impact for r in results]
            track_advantage = [r.track_advantage for r in results]
            
            # Position statistics
            avg_position = np.mean(positions)
            median_position = np.median(positions)
            std_position = np.std(positions)
            min_position = min(positions)
            max_position = max(positions)
            
            # Probabilities
            win_probability = sum(1 for p in positions if p == 1) / len(positions)
            podium_probability = sum(1 for p in positions if p <= 3) / len(positions)
            points_probability = sum(1 for p in positions if p <= 10) / len(positions)
            
            # Confidence intervals
            position_ci_95 = np.percentile(positions, [2.5, 97.5])
            position_ci_99 = np.percentile(positions, [0.5, 99.5])
            
            # Variance and uncertainty
            position_variance = np.var(positions)
            uncertainty_score = std_position / avg_position if avg_position > 0 else 1.0
            
            # Performance factors
            avg_reliability = np.mean(reliability)
            avg_weather_impact = np.mean(weather_impact)
            avg_track_advantage = np.mean(track_advantage)
            
            # Create aggregated stats
            stats = DriverSimulationStats(
                driver_id=driver_id,
                driver_name=results[0].driver_name,
                constructor=results[0].constructor,
                avg_position=avg_position,
                median_position=median_position,
                std_position=std_position,
                min_position=min_position,
                max_position=max_position,
                win_probability=win_probability,
                podium_probability=podium_probability,
                points_probability=points_probability,
                position_ci_95=tuple(position_ci_95),
                position_ci_99=tuple(position_ci_99),
                position_variance=position_variance,
                uncertainty_score=uncertainty_score,
                avg_reliability=avg_reliability,
                avg_weather_impact=avg_weather_impact,
                avg_track_advantage=avg_track_advantage
            )
            
            aggregated_stats.append(stats)
        
        # Sort by win probability (descending)
        aggregated_stats.sort(key=lambda x: x.win_probability, reverse=True)
        
        return aggregated_stats
    
    def run_parallel_simulations(
        self,
        driver_profiles: Dict[str, Any],
        track_type: str,
        weather_condition: str,
        track_characteristics: Dict[str, Any],
        weather_impact: Dict[str, Any],
        num_simulations: int = None,
        max_workers: int = 4
    ) -> List[DriverSimulationStats]:
        """
        Run simulations in parallel for improved performance
        
        Args:
            driver_profiles: Dictionary of driver profiles
            track_type: Type of track
            weather_condition: Weather condition
            track_characteristics: Track characteristics
            weather_impact: Weather impact factors
            num_simulations: Number of simulations
            max_workers: Maximum number of parallel workers
        
        Returns:
            List of aggregated statistics for each driver
        """
        if num_simulations is None:
            num_simulations = self.num_simulations
        
        # Calculate simulations per worker
        simulations_per_worker = num_simulations // max_workers
        remaining_simulations = num_simulations % max_workers
        
        logger.info(f"🚀 Running {num_simulations} simulations with {max_workers} workers...")
        start_time = time.time()
        
        all_results = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit simulation tasks
            future_to_worker = {}
            
            for worker_id in range(max_workers):
                # Add extra simulation to first few workers if needed
                worker_simulations = simulations_per_worker
                if worker_id < remaining_simulations:
                    worker_simulations += 1
                
                if worker_simulations > 0:
                    future = executor.submit(
                        self._worker_simulation_batch,
                        driver_profiles, track_type, weather_condition,
                        track_characteristics, weather_impact, worker_simulations
                    )
                    future_to_worker[future] = worker_id
            
            # Collect results
            for future in as_completed(future_to_worker):
                worker_id = future_to_worker[future]
                try:
                    worker_results = future.result()
                    all_results.extend(worker_results)
                    logger.info(f"   Worker {worker_id} completed {len(worker_results)} simulations")
                except Exception as e:
                    logger.error(f"❌ Worker {worker_id} failed: {e}")
        
        # Aggregate results
        aggregated_stats = self._aggregate_simulation_results(all_results)
        
        elapsed_time = time.time() - start_time
        logger.info(f"✅ Completed {len(all_results)} simulations in {elapsed_time:.2f}s")
        
        return aggregated_stats
    
    def _worker_simulation_batch(
        self,
        driver_profiles: Dict[str, Any],
        track_type: str,
        weather_condition: str,
        track_characteristics: Dict[str, Any],
        weather_impact: Dict[str, Any],
        num_simulations: int
    ) -> List[List[SimulationResult]]:
        """Worker function for parallel simulation batches"""
        results = []
        for _ in range(num_simulations):
            race_result = self.simulate_race(
                driver_profiles, track_type, weather_condition,
                track_characteristics, weather_impact
            )
            results.append(race_result)
        return results
    
    def export_simulation_data(
        self,
        aggregated_stats: List[DriverSimulationStats],
        filename: str = None
    ) -> str:
        """Export simulation data to CSV file"""
        if filename is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"monte_carlo_simulation_{timestamp}.csv"
        
        # Convert to DataFrame
        data = []
        for stats in aggregated_stats:
            data.append({
                'driver_id': stats.driver_id,
                'driver_name': stats.driver_name,
                'constructor': stats.constructor,
                'avg_position': stats.avg_position,
                'median_position': stats.median_position,
                'std_position': stats.std_position,
                'min_position': stats.min_position,
                'max_position': stats.max_position,
                'win_probability': stats.win_probability,
                'podium_probability': stats.podium_probability,
                'points_probability': stats.points_probability,
                'position_ci_95_lower': stats.position_ci_95[0],
                'position_ci_95_upper': stats.position_ci_95[1],
                'position_ci_99_lower': stats.position_ci_99[0],
                'position_ci_99_upper': stats.position_ci_99[1],
                'position_variance': stats.position_variance,
                'uncertainty_score': stats.uncertainty_score,
                'avg_reliability': stats.avg_reliability,
                'avg_weather_impact': stats.avg_weather_impact,
                'avg_track_advantage': stats.avg_track_advantage
            })
        
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False)
        
        logger.info(f"💾 Simulation data exported to {filename}")
        return filename
