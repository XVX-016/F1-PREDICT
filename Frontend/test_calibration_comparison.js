// Quick comparison script for fine-tuned calibration parameters

// Fine-tuned calibration parameters
const FINE_TUNED_PARAMS = {
  temperature: 0.55,
  driverBiases: {
    "Max Verstappen": -0.05,
    "Lando Norris": 0.10,
    "Oscar Piastri": 0.08,
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
    "McLaren": 1.5,
    "Red Bull Racing": 0.9,
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
    "Lando Norris": 1.6,
    "Oscar Piastri": 1.5,
    "Max Verstappen": 0.9,
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
  }
};

// Sample predictions (same as before)
const samplePredictions = [
  {
    driverName: "Max Verstappen",
    team: "Red Bull Racing",
    winProbability: 0.25,
    podiumProbability: 0.65,
    position: 1
  },
  {
    driverName: "Lando Norris",
    team: "McLaren",
    winProbability: 0.12,
    podiumProbability: 0.35,
    position: 2
  },
  {
    driverName: "Oscar Piastri",
    team: "McLaren",
    winProbability: 0.10,
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

// Enhanced calibration functions (simplified)
function applyTemperatureScaling(probabilities, temperature) {
  return probabilities.map(prob => {
    const logit = Math.log(prob / (1 - prob));
    const scaledLogit = logit / temperature;
    return 1 / (1 + Math.exp(-scaledLogit));
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

function applyFineTunedCalibration(predictions) {
  // Extract raw probabilities
  const rawWinProbs = predictions.map(p => p.winProbability);
  const rawPodiumProbs = predictions.map(p => p.podiumProbability);
  
  // Step 1: Apply temperature scaling
  const tempScaledWin = applyTemperatureScaling(rawWinProbs, FINE_TUNED_PARAMS.temperature);
  const tempScaledPodium = applyTemperatureScaling(rawPodiumProbs, FINE_TUNED_PARAMS.temperature);
  
  // Step 2: Create intermediate predictions
  let calibratedPredictions = predictions.map((pred, i) => ({
    ...pred,
    winProbability: tempScaledWin[i],
    podiumProbability: tempScaledPodium[i]
  }));
  
  // Step 3: Apply team weighting
  calibratedPredictions = applyTeamWeighting(
    calibratedPredictions, 
    FINE_TUNED_PARAMS.teamWeights, 
    FINE_TUNED_PARAMS.recentFormWeights
  );
  
  // Step 4: Apply driver biases
  calibratedPredictions = applyDriverBiases(calibratedPredictions, FINE_TUNED_PARAMS.driverBiases);
  
  // Step 5: Normalize probabilities
  calibratedPredictions = normalizeProbabilities(calibratedPredictions);
  
  // Step 6: Sort by win probability
  calibratedPredictions.sort((a, b) => b.winProbability - a.winProbability);
  
  // Update positions
  calibratedPredictions = calibratedPredictions.map((pred, index) => ({
    ...pred,
    position: index + 1
  }));
  
  return calibratedPredictions;
}

function compareCalibrations() {
  console.log("🏎️ FINE-TUNED CALIBRATION COMPARISON");
  console.log("=".repeat(60));
  
  console.log("\n📊 BEFORE Calibration:");
  samplePredictions.forEach((driver, index) => {
    console.log(`${index + 1}. ${driver.driverName} (${driver.team}): ${(driver.winProbability * 100).toFixed(1)}% win probability`);
  });
  
  console.log("\n🔧 Applying Fine-Tuned Calibration...");
  const fineTunedPredictions = applyFineTunedCalibration(samplePredictions);
  
  console.log("\n📈 AFTER Fine-Tuned Calibration:");
  fineTunedPredictions.forEach((driver, index) => {
    const beforeProb = samplePredictions.find(d => d.driverName === driver.driverName)?.winProbability || 0;
    const change = ((driver.winProbability - beforeProb) / beforeProb * 100);
    const changeSymbol = change > 0 ? "↗️" : change < 0 ? "↘️" : "➡️";
    
    console.log(`${index + 1}. ${driver.driverName} (${driver.team}): ${(driver.winProbability * 100).toFixed(1)}% win probability ${changeSymbol} ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
  });
  
  // Show key improvements
  console.log("\n🎯 Key Improvements:");
  
  const maxVerstappen = fineTunedPredictions.find(d => d.driverName === "Max Verstappen");
  const landoNorris = fineTunedPredictions.find(d => d.driverName === "Lando Norris");
  const oscarPiastri = fineTunedPredictions.find(d => d.driverName === "Oscar Piastri");
  
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
  
  // Show new calibration parameters
  console.log("\n⚙️ Fine-Tuned Parameters:");
  console.log("   Team Weights:");
  Object.entries(FINE_TUNED_PARAMS.teamWeights).forEach(([team, weight]) => {
    const symbol = weight > 1.1 ? "↗️" : weight < 0.9 ? "↘️" : "➡️";
    console.log(`     ${team}: ${weight.toFixed(2)}x ${symbol}`);
  });
  
  console.log("\n   Recent Form Weights (Key Drivers):");
  Object.entries(FINE_TUNED_PARAMS.recentFormWeights)
    .filter(([driver]) => ["Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc", "George Russell", "Lewis Hamilton"].includes(driver))
    .forEach(([driver, weight]) => {
      const symbol = weight > 1.1 ? "↗️" : weight < 0.9 ? "↘️" : "➡️";
      console.log(`     ${driver}: ${weight.toFixed(2)}x ${symbol}`);
    });
  
  console.log("\n   Driver Biases (Key Drivers):");
  Object.entries(FINE_TUNED_PARAMS.driverBiases)
    .filter(([driver]) => ["Lando Norris", "Oscar Piastri", "Max Verstappen", "Charles Leclerc", "George Russell", "Lewis Hamilton"].includes(driver))
    .forEach(([driver, bias]) => {
      const symbol = bias > 0.01 ? "↗️" : bias < -0.01 ? "↘️" : "➡️";
      console.log(`     ${driver}: ${bias > 0 ? '+' : ''}${bias.toFixed(3)} ${symbol}`);
    });
  
  console.log("\n✅ Fine-tuned calibration comparison completed!");
}

// Run the comparison
compareCalibrations();
