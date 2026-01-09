// Test script for enhanced calibration system
import { enhancedCalibrationService, DriverPrediction } from './src/services/enhancedCalibration.ts';

// Sample predictions before calibration (simulating current overestimation)
const samplePredictions: DriverPrediction[] = [
  {
    driverName: "Max Verstappen",
    team: "Red Bull Racing",
    winProbability: 0.25, // 25% - overestimated
    podiumProbability: 0.65,
    position: 1
  },
  {
    driverName: "Lando Norris",
    team: "McLaren",
    winProbability: 0.12, // 12% - underestimated
    podiumProbability: 0.35,
    position: 2
  },
  {
    driverName: "Oscar Piastri",
    team: "McLaren",
    winProbability: 0.10, // 10% - underestimated
    podiumProbability: 0.30,
    position: 3
  },
  {
    driverName: "Charles Leclerc",
    team: "Ferrari",
    winProbability: 0.08,
    podiumProbability: 0.25,
    position: 4
  },
  {
    driverName: "George Russell",
    team: "Mercedes",
    winProbability: 0.07,
    podiumProbability: 0.22,
    position: 5
  },
  {
    driverName: "Lewis Hamilton",
    team: "Mercedes",
    winProbability: 0.06,
    podiumProbability: 0.20,
    position: 6
  },
  {
    driverName: "Carlos Sainz",
    team: "Ferrari",
    winProbability: 0.05,
    podiumProbability: 0.18,
    position: 7
  },
  {
    driverName: "Fernando Alonso",
    team: "Aston Martin",
    winProbability: 0.04,
    podiumProbability: 0.15,
    position: 8
  }
];

function testEnhancedCalibration() {
  console.log("🧪 Testing Enhanced F1 Calibration System");
  console.log("=" * 60);
  
  console.log("\n📊 BEFORE Enhanced Calibration:");
  samplePredictions.forEach((driver, index) => {
    console.log(`${index + 1}. ${driver.driverName} (${driver.team}): ${(driver.winProbability * 100).toFixed(1)}% win probability`);
  });
  
  console.log("\n🔧 Applying Enhanced Calibration...");
  
  // Apply enhanced calibration
  const calibratedPredictions = enhancedCalibrationService.applyEnhancedCalibration(
    samplePredictions,
    "permanent_circuit"
  );
  
  console.log("\n📈 AFTER Enhanced Calibration:");
  calibratedPredictions.forEach((driver, index) => {
    const beforeProb = samplePredictions.find(d => d.driverName === driver.driverName)?.winProbability || 0;
    const change = ((driver.winProbability - beforeProb) / beforeProb * 100);
    const changeSymbol = change > 0 ? "↗️" : change < 0 ? "↘️" : "➡️";
    
    console.log(`${index + 1}. ${driver.driverName} (${driver.team}): ${(driver.winProbability * 100).toFixed(1)}% win probability ${changeSymbol} ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
  });
  
  // Calculate total probability
  const totalBefore = samplePredictions.reduce((sum, d) => sum + d.winProbability, 0);
  const totalAfter = calibratedPredictions.reduce((sum, d) => sum + d.winProbability, 0);
  
  console.log(`\n📊 Total Probability: ${(totalBefore * 100).toFixed(1)}% → ${(totalAfter * 100).toFixed(1)}%`);
  
  // Show key improvements
  console.log("\n🎯 Key Improvements:");
  
  const maxVerstappen = calibratedPredictions.find(d => d.driverName === "Max Verstappen");
  const landoNorris = calibratedPredictions.find(d => d.driverName === "Lando Norris");
  const oscarPiastri = calibratedPredictions.find(d => d.driverName === "Oscar Piastri");
  
  if (maxVerstappen) {
    const before = samplePredictions.find(d => d.driverName === "Max Verstappen")?.winProbability || 0;
    const reduction = ((before - maxVerstappen.winProbability) / before * 100);
    console.log(`   • Max Verstappen: Reduced by ${reduction.toFixed(1)}% (${(before * 100).toFixed(1)}% → ${(maxVerstappen.winProbability * 100).toFixed(1)}%)`);
  }
  
  if (landoNorris) {
    const before = samplePredictions.find(d => d.driverName === "Lando Norris")?.winProbability || 0;
    const increase = ((landoNorris.winProbability - before) / before * 100);
    console.log(`   • Lando Norris: Increased by ${increase.toFixed(1)}% (${(before * 100).toFixed(1)}% → ${(landoNorris.winProbability * 100).toFixed(1)}%)`);
  }
  
  if (oscarPiastri) {
    const before = samplePredictions.find(d => d.driverName === "Oscar Piastri")?.winProbability || 0;
    const increase = ((oscarPiastri.winProbability - before) / before * 100);
    console.log(`   • Oscar Piastri: Increased by ${increase.toFixed(1)}% (${(before * 100).toFixed(1)}% → ${(oscarPiastri.winProbability * 100).toFixed(1)}%)`);
  }
  
  // Show calibration summary
  console.log("\n⚙️ Calibration Parameters:");
  const summary = enhancedCalibrationService.getCalibrationSummary();
  
  console.log("   Team Weights:");
  Object.entries(summary.teamWeights).forEach(([team, weight]) => {
    const symbol = weight > 1.1 ? "↗️" : weight < 0.9 ? "↘️" : "➡️";
    console.log(`     ${team}: ${weight.toFixed(2)}x ${symbol}`);
  });
  
  console.log("\n   Recent Form Weights (Key Drivers):");
  Object.entries(summary.recentFormWeights)
    .filter(([driver]) => ["Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc", "George Russell", "Lewis Hamilton"].includes(driver))
    .forEach(([driver, weight]) => {
      const symbol = weight > 1.1 ? "↗️" : weight < 0.9 ? "↘️" : "➡️";
      console.log(`     ${driver}: ${weight.toFixed(2)}x ${symbol}`);
    });
  
  console.log("\n✅ Enhanced calibration test completed!");
}

// Run the test
testEnhancedCalibration();
