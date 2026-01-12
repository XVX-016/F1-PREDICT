"""
Unit tests for the Monte Carlo Simulation Engine
"""
import unittest
from unittest.mock import MagicMock, patch

# Mock before importing the engine that uses get_db
with patch('database.supabase_client.get_db') as mock_get_db:
    from simulation.monte_carlo import MonteCarloEngine

class TestMonteCarlo(unittest.TestCase):
    def setUp(self):
        with patch('database.supabase_client.get_db') as mock_db:
            self.engine = MonteCarloEngine(n_simulations=10) # Small for testing

    def test_engine_initialization(self):
        self.assertEqual(self.engine.n_simulations, 10)
        self.assertIsNotNone(self.engine.simulator)

    @patch('database.supabase_client.get_db')
    def test_simulation_failure_no_data(self, mock_db):
        # Mocking db response as empty
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        res = self.engine.run_monte_carlo("test_race")
        self.assertIsNone(res)

if __name__ == '__main__':
    unittest.main()
