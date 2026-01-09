import * as tf from '@tensorflow/tfjs';

interface DriverFeatures {
  driverId: string;
  driverName: string;
  seasonPoints: number;
  seasonWins: number;
  seasonPodiums: number;
  seasonDNFs: number;
  trackHistoryWins: number;
  trackHistoryPodiums: number;
  trackHistoryRaces: number;
  recentFormAverage: number;
  recentFormConsistency: number;
  qualifyingAverageGrid: number;
  qualifyingPoles: number;
  fastestLaps: number;
  teamStrength: number;
  homeRaceBonus: number;
}

interface ModelPrediction {
  driverId: string;
  driverName: string;
  probability: number;
  odds: number;
  confidence: number;
  features: number[];
}

class TensorFlowMLService {
  private model: tf.LayersModel | null = null;
  private isTraining = false;
  private featureScaler: tf.LayersModel | null = null;
  private labelEncoder: Map<string, number> = new Map();
  private driverFeatures: Map<string, DriverFeatures> = new Map();

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      console.log('🧠 Initializing TensorFlow ML model...');
      
      // Create a neural network model
      this.model = tf.sequential({
        layers: [
          // Input layer - normalize features
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            inputShape: [15], // 15 features per driver
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.dropout({ rate: 0.3 }),
          
          // Hidden layers
          tf.layers.dense({
            units: 32,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          tf.layers.dropout({ rate: 0.2 }),
          
          tf.layers.dense({
            units: 16,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }),
          
          // Output layer - probability of winning
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      // Compile the model (tfjs supports common metrics like 'accuracy')
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      console.log('✅ TensorFlow model initialized');
    } catch (error) {
      console.error('❌ Error initializing TensorFlow model:', error);
    }
  }

  private normalizeFeatures(features: number[]): number[] {
    // Min-max normalization for each feature
    const normalized = features.map((value, index) => {
      const maxValues = [1000, 25, 25, 25, 10, 10, 50, 0.5, 0.5, 25, 10, 1, 10, 0.5, 1];
      return value / maxValues[index];
    });
    return normalized;
  }

  private extractFeatures(driver: DriverFeatures): number[] {
    return [
      driver.seasonPoints,
      driver.seasonWins,
      driver.seasonPodiums,
      driver.seasonDNFs,
      driver.trackHistoryWins,
      driver.trackHistoryPodiums,
      driver.trackHistoryRaces,
      driver.recentFormAverage,
      driver.recentFormConsistency,
      driver.qualifyingAverageGrid,
      driver.qualifyingPoles,
      driver.fastestLaps,
      driver.teamStrength,
      driver.homeRaceBonus,
      driver.trackHistoryRaces > 0 ? driver.trackHistoryWins / driver.trackHistoryRaces : 0
    ];
  }

  public async trainModel(trainingData: DriverFeatures[], labels: number[]) {
    if (this.isTraining) {
      console.log('⏳ Model training already in progress...');
      return;
    }

    this.isTraining = true;
    console.log('🚀 Starting TensorFlow model training...');

    try {
      // Prepare training data
      const features = trainingData.map(driver => this.extractFeatures(driver));
      const normalizedFeatures = features.map(f => this.normalizeFeatures(f));

      // Convert to tensors
      const xs = tf.tensor2d(normalizedFeatures);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      // Train the model
      const history = await this.model!.fit(xs, ys, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0) {
              console.log(`📊 Epoch ${epoch}: loss=${logs?.loss?.toFixed(4)}, accuracy=${(logs as any)?.accuracy?.toFixed(4)}`);
            }
          }
        }
      });

      console.log('✅ Model training completed');
      console.log(`📈 Final accuracy: ${(history.history as any).accuracy?.[(history.history as any).accuracy.length - 1]?.toFixed(4)}`);

      // Clean up tensors
      xs.dispose();
      ys.dispose();

    } catch (error) {
      console.error('❌ Error training model:', error);
    } finally {
      this.isTraining = false;
    }
  }

  public async predictRaceWinner(drivers: DriverFeatures[], circuit: string): Promise<ModelPrediction[]> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Prepare features for all drivers
      const features = drivers.map(driver => this.extractFeatures(driver));
      const normalizedFeatures = features.map(f => this.normalizeFeatures(f));

      // Convert to tensor
      const xs = tf.tensor2d(normalizedFeatures);

      // Make predictions
      const predictions = this.model.predict(xs) as tf.Tensor;
      const predictionValues = await predictions.array() as number[][];

      // Convert predictions to results
      const results: ModelPrediction[] = drivers.map((driver, index) => {
        const probability = predictionValues[index][0];
        const odds = probability > 0 ? 1 / probability : 999;
        
        return {
          driverId: driver.driverId,
          driverName: driver.driverName,
          probability,
          odds: Math.round(odds * 100) / 100,
          confidence: this.calculateConfidence(driver),
          features: normalizedFeatures[index]
        };
      });

      // Sort by probability (highest first)
      results.sort((a, b) => b.probability - a.probability);

      // Clean up tensors
      xs.dispose();
      predictions.dispose();

      return results;
    } catch (error) {
      console.error('❌ Error making predictions:', error);
      throw error;
    }
  }

  public async predictPodium(drivers: DriverFeatures[], circuit: string): Promise<ModelPrediction[]> {
    // For podium predictions, we use a modified approach
    // We train a separate model or use ensemble methods
    const raceWinnerPredictions = await this.predictRaceWinner(drivers, circuit);
    
    // Adjust probabilities for podium (top 3)
    return raceWinnerPredictions.map(prediction => ({
      ...prediction,
      probability: Math.min(prediction.probability * 2.5, 0.95), // Podium is more likely than win
      odds: Math.round((1 / Math.min(prediction.probability * 2.5, 0.95)) * 100) / 100
    }));
  }

  public async predictQualifying(drivers: DriverFeatures[], circuit: string): Promise<ModelPrediction[]> {
    // For qualifying, we focus more on qualifying-specific features
    const qualifyingDrivers = drivers.map(driver => ({
      ...driver,
      // Boost qualifying-related features
      qualifyingAverageGrid: driver.qualifyingAverageGrid * 0.8, // Better grid position
      qualifyingPoles: driver.qualifyingPoles * 1.2 // More weight on poles
    }));

    return this.predictRaceWinner(qualifyingDrivers, circuit);
  }

  public async predictFastestLap(drivers: DriverFeatures[], circuit: string): Promise<ModelPrediction[]> {
    // For fastest lap, we focus on fastest lap history and recent form
    const fastestLapDrivers = drivers.map(driver => ({
      ...driver,
      // Boost fastest lap related features
      fastestLaps: driver.fastestLaps * 1.5,
      recentFormAverage: driver.recentFormAverage * 1.1
    }));

    const predictions = await this.predictRaceWinner(fastestLapDrivers, circuit);
    
    // Adjust for fastest lap being less predictable
    return predictions.map(prediction => ({
      ...prediction,
      probability: prediction.probability * 0.8, // Less predictable than race winner
      odds: Math.round((1 / (prediction.probability * 0.8)) * 100) / 100
    }));
  }

  private calculateConfidence(driver: DriverFeatures): number {
    // Calculate confidence based on data completeness and consistency
    const dataCompleteness = Math.min(driver.trackHistoryRaces / 20, 1);
    const consistency = Math.max(1 - (driver.recentFormConsistency / 10), 0);
    const experience = Math.min(driver.seasonPoints / 100, 1);
    
    return Math.round((dataCompleteness * 0.4 + consistency * 0.3 + experience * 0.3) * 100);
  }

  public async saveModel(path: string) {
    if (!this.model) {
      throw new Error('No model to save');
    }

    try {
      await this.model.save(`file://${path}`);
      console.log(`💾 Model saved to ${path}`);
    } catch (error) {
      console.error('❌ Error saving model:', error);
      throw error;
    }
  }

  public async loadModel(path: string) {
    try {
      this.model = await tf.loadLayersModel(`file://${path}/model.json`);
      console.log(`📂 Model loaded from ${path}`);
    } catch (error) {
      console.error('❌ Error loading model:', error);
      throw error;
    }
  }

  public async evaluateModel(testData: DriverFeatures[], testLabels: number[]) {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      const features = testData.map(driver => this.extractFeatures(driver));
      const normalizedFeatures = features.map(f => this.normalizeFeatures(f));

      const xs = tf.tensor2d(normalizedFeatures);
      const ys = tf.tensor2d(testLabels, [testLabels.length, 1]);

      const evaluation = this.model.evaluate(xs, ys) as tf.Tensor[];
      const loss = await evaluation[0].array();
      const accuracy = await evaluation[1].array();

      console.log(`📊 Model Evaluation:`);
      console.log(`   Loss: ${loss[0].toFixed(4)}`);
      console.log(`   Accuracy: ${accuracy[0].toFixed(4)}`);

      // Clean up tensors
      xs.dispose();
      ys.dispose();
      evaluation.forEach(tensor => tensor.dispose());

      return { loss: loss[0], accuracy: accuracy[0] };
    } catch (error) {
      console.error('❌ Error evaluating model:', error);
      throw error;
    }
  }

  public getModelSummary(): string {
    if (!this.model) {
      return 'Model not initialized';
    }

    let summary = '';
    this.model.summary(undefined, undefined, undefined, undefined, (line) => {
      summary += line + '\n';
    });

    return summary;
  }

  public isModelReady(): boolean {
    return this.model !== null && !this.isTraining;
  }

  public getTrainingStatus(): boolean {
    return this.isTraining;
  }
}

export default new TensorFlowMLService();
