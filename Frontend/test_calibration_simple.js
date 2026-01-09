// Simple test to verify calibration system is working
console.log('🧪 Testing F1 Calibration System...\n');

// Test the calibration pipeline step by step
function testCalibrationPipeline() {
  // Sample prediction data
  const samplePrediction = {
    driverName: 'Max Verstappen',
    winProbPct: 45.0
  };

  // Step 1: Temperature Scaling (T = 1.061)
  const temp = 1.061;
  const rawProb = samplePrediction.winProbPct / 100;
  const tempScaled = Math.pow(rawProb, 1/temp);
  
  console.log('📊 Step 1: Temperature Scaling');
  console.log(`   Raw: ${(rawProb * 100).toFixed(1)}%`);
  console.log(`   Temperature: ${temp}`);
  console.log(`   Temp Scaled: ${(tempScaled * 100).toFixed(1)}%`);
  console.log(`   Effect: ${tempScaled > rawProb ? 'Increased' : 'Decreased'} probability\n`);

  // Step 2: Logistic Calibration (slope = 2.405, intercept = -3.134)
  const slope = 2.405;
  const intercept = -3.134;
  const logit = Math.log(tempScaled / (1 - tempScaled));
  const calibratedLogit = slope * logit + intercept;
  const logisticCalibrated = 1 / (1 + Math.exp(-calibratedLogit));
  
  console.log('📈 Step 2: Logistic Calibration');
  console.log(`   Input: ${(tempScaled * 100).toFixed(1)}%`);
  console.log(`   Slope: ${slope}, Intercept: ${intercept}`);
  console.log(`   Logit: ${logit.toFixed(3)}`);
  console.log(`   Calibrated Logit: ${calibratedLogit.toFixed(3)}`);
  console.log(`   Logistic Output: ${(logisticCalibrated * 100).toFixed(1)}%`);
  console.log(`   Effect: ${logisticCalibrated > tempScaled ? 'Increased' : 'Decreased'} probability\n`);

  // Step 3: Driver Bias Correction
  const driverBiases = {
    "Max Verstappen": 0.005,
    "Lando Norris": -0.003,
    "Charles Leclerc": -0.005
  };
  
  const bias = driverBiases[samplePrediction.driverName] || 0;
  const biasCorrected = Math.max(0, Math.min(1, logisticCalibrated + bias));
  
  console.log('🏎️ Step 3: Driver Bias Correction');
  console.log(`   Input: ${(logisticCalibrated * 100).toFixed(1)}%`);
  console.log(`   Driver: ${samplePrediction.driverName}`);
  console.log(`   Bias: ${bias > 0 ? '+' : ''}${bias}`);
  console.log(`   Bias Corrected: ${(biasCorrected * 100).toFixed(1)}%`);
  console.log(`   Effect: ${bias > 0 ? 'Increased' : bias < 0 ? 'Decreased' : 'No change'} probability\n`);

  // Summary
  console.log('📋 Calibration Summary');
  console.log(`   Original: ${(rawProb * 100).toFixed(1)}%`);
  console.log(`   Final: ${(biasCorrected * 100).toFixed(1)}%`);
  const change = ((biasCorrected - rawProb) / rawProb * 100);
  console.log(`   Change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`);
  
  if (Math.abs(change) < 5) {
    console.log('   ✅ Calibration working correctly - subtle adjustments applied');
  } else if (Math.abs(change) < 15) {
    console.log('   ⚠️ Moderate calibration applied - check parameters');
  } else {
    console.log('   ❌ Strong calibration applied - may need parameter tuning');
  }
}

// Run the test
testCalibrationPipeline();

console.log('\n🎯 Expected Results:');
console.log('   • Temperature scaling should make extreme probabilities more conservative');
console.log('   • Logistic calibration should correct systematic bias');
console.log('   • Driver biases should provide individual adjustments');
console.log('   • Overall change should be moderate (5-15%)');
