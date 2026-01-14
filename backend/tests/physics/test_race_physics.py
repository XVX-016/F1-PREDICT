import unittest
from services.tyre_model import tyre_lap_time
from services.fuel_model import fuel_time_penalty
from services.pit_model import pit_loss

class TestRacePhysics(unittest.TestCase):
    
    def test_tyre_model_fresh(self):
        # Age 0 should return base_time
        self.assertEqual(tyre_lap_time(90.0, 0, 0.1, 2.0, 0.5), 90.0)
        
    def test_tyre_model_degradation(self):
        # Age 10: 90 + 0.1*10 + 2.0*(1 - e^-5) approx 90 + 1 + 2 = 93
        t10 = tyre_lap_time(90.0, 10, 0.1, 2.0, 0.5)
        self.assertGreater(t10, 91.0)
        self.assertLess(t10, 93.1)
        
    def test_fuel_model(self):
        # 100kg, lap 0, burn 1.5, k=0.03 -> 0.03 * 100 = 3.0s
        self.assertAlmostEqual(fuel_time_penalty(100, 0, 1.5, 0.03), 3.0)
        # Lap 50: 100 - 75 = 25kg -> 0.03 * 25 = 0.75s
        self.assertAlmostEqual(fuel_time_penalty(100, 50, 1.5, 0.03), 0.75)
        
    def test_pit_loss(self):
        self.assertEqual(pit_loss(20.0, 2.5), 22.5)
        self.assertEqual(pit_loss(20.0), 20.0)

if __name__ == '__main__':
    unittest.main()
