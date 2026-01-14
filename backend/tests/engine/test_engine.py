import unittest
import numpy as np
from engine.simulation.monte_carlo import Strategy, simulate_strategy, calculate_robustness
from engine.simulation.optimizer import StrategyOptimizer

class TestMonteCarloEngine(unittest.TestCase):
    
    def setUp(self):
        self.config = {
            'total_laps': 50,
            'base_lap_time': 90.0,
            'initial_fuel': 100.0,
            'fuel_burn_rate': 2.0,
            'fuel_k': 0.03,
            'tyre_params': {
                'SOFT': {'alpha': 0.15, 'beta': 2.5, 'gamma': 0.4},
                'MEDIUM': {'alpha': 0.1, 'beta': 1.5, 'gamma': 0.3},
                'HARD': {'alpha': 0.05, 'beta': 1.0, 'gamma': 0.2}
            }
        }

    def test_simulation_run(self):
        strat = Strategy(pit_laps=[20], tyre_compounds=['SOFT', 'HARD'])
        race_times = simulate_strategy(
            strategy=strat,
            total_laps=self.config['total_laps'],
            base_lap_time=self.config['base_lap_time'],
            initial_fuel=self.config['initial_fuel'],
            fuel_burn_rate=self.config['fuel_burn_rate'],
            fuel_k=self.config['fuel_k'],
            tyre_params=self.config['tyre_params'],
            n_simulations=10
        )
        self.assertEqual(len(race_times), 10)
        self.assertTrue(all(t > 4500 for t in race_times)) # ~50 laps * 90s

    def test_robustness_metric(self):
        times = [100.0, 101.0, 99.0, 100.0, 100.0]
        robustness = calculate_robustness(times)
        self.assertGreater(robustness, 0)
        self.assertLess(robustness, 0.1)

    def test_optimizer_ranking(self):
        opt = StrategyOptimizer(self.config)
        s1 = Strategy(pit_laps=[25], tyre_compounds=['SOFT', 'HARD'])
        s2 = Strategy(pit_laps=[15, 35], tyre_compounds=['SOFT', 'MEDIUM', 'SOFT'])
        
        ranked = opt.evaluate_strategies([s1, s2])
        self.assertEqual(len(ranked), 2)
        # s2 has more pit stops, should theoretically be slower or different expected time
        self.assertIn("expected_time", ranked[0])
        self.assertIn("robustness", ranked[0])

if __name__ == '__main__':
    unittest.main()
