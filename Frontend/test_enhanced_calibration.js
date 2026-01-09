// Test script for enhanced calibration system (JavaScript version)

// Enhanced calibration parameters - Fine-tuned for McLaren dominance
const ENHANCED_CALIBRATION_PARAMS = {
  temperature: 0.55, // slightly higher to soften extremes
  logisticSlope: 6.063542319320187,
  logisticIntercept: -3.4323975147437498,
  driverBiases: {
    "Max Verstappen": -0.05, // nerf but not collapse
    "Lando Norris": 0.10,    // clear boost
    "Oscar Piastri": 0.08,   // boost
    "George Russell": 0.02,
    "Lewis Hamilton": 0.02,
    "Charles Leclerc": 0.02,
    "Carlos Sainz": 0.02,
    "Fernando Alonso": 0.01,
    "Lance Stroll": 0.0,
    "Pierre Gasly": 0.0,
    "Esteban Ocon": 0.0,
    "Nico Hulkenberg": 0.0,
    "Kevin Magnussen": 0.0,
    "Yuki Tsunoda": 0.0,
    "Daniel Ricciardo": 0.0,
    "Alexander Albon": 0.0,
    "Valtteri Bottas": 0.0,
    "Zhou Guanyu": 0.0,
    "Andrea Kimi Antonelli": 0.0,
    "Oliver Bearman": 0.0
  },
  teamWeights: {
    "McLaren": 1.5,          // stronger boost
    "Red Bull Racing": 0.9,  // softer nerf
    "Ferrari": 1.05,
    "Mercedes": 0.95,
    "Aston Martin": 1.0,
    "Alpine": 1.0,
    "Haas": 1.0,
    "RB": 1.0,
    "Williams": 1.0,
    "Kick Sauber": 1.0
  },
  recentFormWeights: {
    "Lando Norris": 1.6,   // stronger recent form boost
    "Oscar Piastri": 1.5,  // stronger recent form boost
    "Max Verstappen": 0.9, // reduce dominance
    "Charles Leclerc": 1.1,
    "George Russell": 1.05,
    "Lewis Hamilton": 0.95,
    "Carlos Sainz": 1.0,
    "Fernando Alonso": 1.0,
    "Lance Stroll": 1.0,
    "Pierre Gasly": 1.0,
    "Esteban Ocon": 1.0,
    "Nico Hulkenberg": 1.0,
    "Kevin Magnussen": 1.0,
    "Yuki Tsunoda": 1.0,
    "Daniel Ricciardo": 1.0,
    "Alexander Albon": 1.0,
    "Valtteri Bottas": 1.0,
    "Zhou Guanyu": 1.0,
    "Andrea Kimi Antonelli": 1.0,
    "Oliver Bearman": 1.0
  },
  trackTypeAdjustments: {
    "street_circuit": 1.15,
    "permanent_circuit": 1.0,
    "high_speed": 0.95
  }
};

// Sample predictions before calibration (simulating current overestimation)
const samplePredictions = [
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

// Enhanced calibration functions
function applyTemperatureScaling(probabilities, temperature) {
  return probabilities.map(prob => {
    const logit = Math.log(prob / (1 - prob));
    const scaledLogit = logit / temperature;
    return 1 / (1 + Math.exp(-scaledLogit));
  });
}

function applyLogisticCalibration(probabilities, slope, intercept) {
  return probabilities.map(prob => {
    const logit = Math.log(prob / (1 - prob));
    const calibratedLogit = slope * logit + intercept;
    return 1 / (1 + Math.exp(-calibratedLogit));
  });
}

function applyTeamWeighting(predictions, teamWeights, recentFormWeights) {
  return predictions.map(prediction => {
    const teamWeight = teamWeights[prediction.team] || 1.0;
    const recentFormWeight = recentFormWeights[prediction.driverName] || 1.0;
    const combinedWeight = teamWeight * recentFormWeight;
    
    return {
      ...prediction,
      winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * combinedWeight)),
      podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * combinedWeight))
    };
  });
}

function applyDriverBiases(predictions, driverBiases) {
  return predictions.map(prediction => {
    const bias = driverBiases[prediction.driverName] || 0;
    
    return {
      ...prediction,
      winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability + bias)),
      podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability + bias * 0.5))
    };
  });
}

function normalizeProbabilities(predictions) {
  const totalWinProb = predictions.reduce((sum, d) => sum + d.winProbability, 0);
  const totalPodiumProb = predictions.reduce((sum, d) => sum + d.podiumProbability, 0);
  
  return predictions.map(prediction => ({
    ...prediction,
    winProbability: prediction.winProbability / totalWinProb,
    podiumProbability: prediction.podiumProbability / totalPodiumProb
  }));
}

function applyEnhancedCalibration(predictions, trackType = "permanent_circuit") {
  console.log("🔧 Applying enhanced calibration...");
  
  // Extract raw probabilities
  const rawWinProbs = predictions.map(p => p.winProbability);
  const rawPodiumProbs = predictions.map(p => p.podiumProbability);
  
  // Step 1: Apply temperature scaling
  const tempScaledWin = applyTemperatureScaling(rawWinProbs, ENHANCED_CALIBRATION_PARAMS.temperature);
  const tempScaledPodium = applyTemperatureScaling(rawPodiumProbs, ENHANCED_CALIBRATION_PARAMS.temperature);
  
  // Step 2: Apply logistic calibration
  const logisticCalibratedWin = applyLogisticCalibration(
    tempScaledWin, 
    ENHANCED_CALIBRATION_PARAMS.logisticSlope, 
    ENHANCED_CALIBRATION_PARAMS.logisticIntercept
  );
  const logisticCalibratedPodium = applyLogisticCalibration(
    tempScaledPodium, 
    ENHANCED_CALIBRATION_PARAMS.logisticSlope, 
    ENHANCED_CALIBRATION_PARAMS.logisticIntercept
  );
  
  // Step 3: Create intermediate predictions
  let calibratedPredictions = predictions.map((pred, i) => ({
    ...pred,
    winProbability: logisticCalibratedWin[i],
    podiumProbability: logisticCalibratedPodium[i]
  }));
  
  // Step 4: Apply team weighting
  calibratedPredictions = applyTeamWeighting(
    calibratedPredictions, 
    ENHANCED_CALIBRATION_PARAMS.teamWeights, 
    ENHANCED_CALIBRATION_PARAMS.recentFormWeights
  );
  
  // Step 5: Apply driver biases
  calibratedPredictions = applyDriverBiases(calibratedPredictions, ENHANCED_CALIBRATION_PARAMS.driverBiases);
  
  // Step 6: Apply track type adjustments
  const trackAdjustment = ENHANCED_CALIBRATION_PARAMS.trackTypeAdjustments[trackType] || 1.0;
  calibratedPredictions = calibratedPredictions.map(prediction => ({
    ...prediction,
    winProbability: Math.min(0.999, Math.max(0.001, prediction.winProbability * trackAdjustment)),
    podiumProbability: Math.min(0.999, Math.max(0.001, prediction.podiumProbability * trackAdjustment))
  }));
  
  // Step 7: Normalize probabilities
  calibratedPredictions = normalizeProbabilities(calibratedPredictions);
  
  // Step 8: Sort by win probability
  calibratedPredictions.sort((a, b) => b.winProbability - a.winProbability);
  
  // Update positions
  calibratedPredictions = calibratedPredictions.map((pred, index) => ({
    ...pred,
    position: index + 1
  }));
  
  console.log("✅ Enhanced calibration applied successfully");
  console.log("🎯 Key adjustments:");
  console.log(`   • McLaren drivers boosted by ${ENHANCED_CALIBRATION_PARAMS.teamWeights.McLaren}x`);
  console.log(`   • Red Bull drivers reduced by ${ENHANCED_CALIBRATION_PARAMS.teamWeights["Red Bull Racing"]}x`);
  console.log(`   • Lando Norris recent form: ${ENHANCED_CALIBRATION_PARAMS.recentFormWeights["Lando Norris"]}x`);
  console.log(`   • Oscar Piastri recent form: ${ENHANCED_CALIBRATION_PARAMS.recentFormWeights["Oscar Piastri"]}x`);
  
  return calibratedPredictions;
}

function testEnhancedCalibration() {
  console.log("🧪 Testing Enhanced F1 Calibration System");
  console.log("=".repeat(60));
  
  console.log("\n📊 BEFORE Enhanced Calibration:");
  samplePredictions.forEach((driver, index) => {
    console.log(`${index + 1}. ${driver.driverName} (${driver.team}): ${(driver.winProbability * 100).toFixed(1)}% win probability`);
  });
  
  console.log("\n🔧 Applying Enhanced Calibration...");
  
  // Apply enhanced calibration
  const calibratedPredictions = applyEnhancedCalibration(samplePredictions, "permanent_circuit");
  
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
  
  console.log("   Team Weights:");
  Object.entries(ENHANCED_CALIBRATION_PARAMS.teamWeights).forEach(([team, weight]) => {
    const symbol = weight > 1.1 ? "↗️" : weight < 0.9 ? "↘️" : "➡️";
    console.log(`     ${team}: ${weight.toFixed(2)}x ${symbol}`);
  });
  
  console.log("\n   Recent Form Weights (Key Drivers):");
  Object.entries(ENHANCED_CALIBRATION_PARAMS.recentFormWeights)
    .filter(([driver]) => ["Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc", "George Russell", "Lewis Hamilton"].includes(driver))
    .forEach(([driver, weight]) => {
      const symbol = weight > 1.1 ? "↗️" : weight < 0.9 ? "↘️" : "➡️";
      console.log(`     ${driver}: ${weight.toFixed(2)}x ${symbol}`);
    });
  
  console.log("\n✅ Enhanced calibration test completed!");
}

// Run the test
testEnhancedCalibration();
