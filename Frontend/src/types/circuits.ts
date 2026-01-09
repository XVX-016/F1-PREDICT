export type CircuitFeatureFlag = 'DRS Zones' | 'Tire wear' | 'Banking' | 'Top speed' | string;

export interface CircuitFeatures {
  raceName: string;
  circuitName: string;
  laps: number;
  lengthKm: number;
  features: CircuitFeatureFlag[];
}

export type CircuitsFeaturesMap = Record<string, CircuitFeatures>; // keyed by raceName


