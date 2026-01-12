"""
Unit tests for the Pace Delta ML Model
"""
import unittest
from unittest.mock import MagicMock, patch
import pandas as pd
import numpy as np
import os
import shutil

# Mock before importing the model that uses get_db
with patch('database.supabase_client.get_db') as mock_get_db:
    from models.pace_model import PaceModel

class TestPaceModel(unittest.TestCase):
    def setUp(self):
        self.model_path = "models/test_model.joblib"
        # Mock get_db for the instance
        with patch('database.supabase_client.get_db') as mock_db:
            self.model = PaceModel(model_path=self.model_path)
        
        self.features = [
            "avg_long_run_pace_ms",
            "tire_deg_rate",
            "sector_consistency",
            "clean_air_delta",
            "recent_form_ewma",
            "grid_position"
        ]
        
        data = []
        for i in range(100):
            data.append({
                "avg_long_run_pace_ms": 90000 + np.random.normal(0, 500),
                "tire_deg_rate": np.random.normal(50, 10),
                "sector_consistency": np.random.normal(100, 20),
                "clean_air_delta": np.random.normal(200, 50),
                "recent_form_ewma": 90000 + np.random.normal(0, 500),
                "grid_position": np.random.randint(1, 21),
                "race_id": "race_1",
                "driver_id": f"driver_{i%20}"
            })
        self.dummy_df = pd.DataFrame(data)

    def tearDown(self):
        if os.path.exists(os.path.dirname(self.model_path)):
            shutil.rmtree(os.path.dirname(self.model_path), ignore_errors=True)

    def test_model_initialization(self):
        self.assertEqual(self.model.model_path, self.model_path)
        self.assertIsNone(self.model.model)

    @patch('database.supabase_client.get_db')
    def test_prediction_without_training_fails(self, mock_db):
        # Should log error and return empty DF/none when model is missing
        res = self.model.predict_for_race("test_race")
        self.assertTrue(res.empty)

if __name__ == '__main__':
    unittest.main()
