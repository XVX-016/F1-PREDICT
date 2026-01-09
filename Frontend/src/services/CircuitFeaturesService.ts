import { Race } from '../types/predictions';

interface TrackFeatures {
  track: string;
  first_grand_prix: number;
  number_of_laps: number;
  circuit_length_km: number;
  race_distance_km: number;
  lap_record: {
    time: string;
    driver: string;
    year: number;
  };
  features: {
    corners: number;
    drs_zones: number;
    max_speed_kmh: number | null;
    notable_layout: string;
  };
}

// Comprehensive track data for all 2025 F1 circuits
const TRACK_DATA: Record<string, TrackFeatures> = {
  // Asian Circuits
  'Bahrain International Circuit': {
    track: "Bahrain International Circuit",
    first_grand_prix: 2004,
    number_of_laps: 57,
    circuit_length_km: 5.412,
    race_distance_km: 308.238,
    lap_record: {
      time: "1:31.447",
      driver: "Pedro de la Rosa",
      year: 2005
    },
    features: {
      corners: 15,
      drs_zones: 2,
      max_speed_kmh: 329.6,
      notable_layout: "Desert track, long straights, heavy braking zones"
    }
  },
  'Jeddah Corniche Circuit': {
    track: "Jeddah Corniche Circuit",
    first_grand_prix: 2021,
    number_of_laps: 50,
    circuit_length_km: 6.174,
    race_distance_km: 308.450,
    lap_record: {
      time: "1:30.734",
      driver: "Lewis Hamilton",
      year: 2021
    },
    features: {
      corners: 27,
      drs_zones: 3,
      max_speed_kmh: 330,
      notable_layout: "Fastest street circuit, longest street course, night race"
    }
  },
  'Shanghai International Circuit': {
    track: "Shanghai International Circuit",
    first_grand_prix: 2004,
    number_of_laps: 56,
    circuit_length_km: 5.451,
    race_distance_km: 305.066,
    lap_record: {
      time: "1:32.238",
      driver: "Michael Schumacher",
      year: 2004
    },
    features: {
      corners: 16,
      drs_zones: 2,
      max_speed_kmh: null,
      notable_layout: "Snail-shaped Turn 1, long back straight"
    }
  },
  'Suzuka International Racing Course': {
    track: "Suzuka International Racing Course",
    first_grand_prix: 1987,
    number_of_laps: 53,
    circuit_length_km: 5.807,
    race_distance_km: 307.471,
    lap_record: {
      time: "1:30.983",
      driver: "Lewis Hamilton",
      year: 2020
    },
    features: {
      corners: 18,
      drs_zones: 1,
      max_speed_kmh: null,
      notable_layout: "Figure-eight layout, 130R, technical S-curves"
    }
  },
  'Lusail International Circuit': {
    track: "Lusail International Circuit",
    first_grand_prix: 2021,
    number_of_laps: 57,
    circuit_length_km: 5.419,
    race_distance_km: 308.611,
    lap_record: {
      time: "1:24.319",
      driver: "Max Verstappen",
      year: 2023
    },
    features: {
      corners: 16,
      drs_zones: 2,
      max_speed_kmh: null,
      notable_layout: "Flat, high-speed desert track"
    }
  },
  'Marina Bay Street Circuit': {
    track: "Marina Bay Street Circuit",
    first_grand_prix: 2008,
    number_of_laps: 62,
    circuit_length_km: 4.940,
    race_distance_km: 306.143,
    lap_record: {
      time: "1:35.867",
      driver: "Lewis Hamilton",
      year: 2023
    },
    features: {
      corners: 19,
      drs_zones: 2,
      max_speed_kmh: null,
      notable_layout: "Night race, tight city streets"
    }
  },
  'Yas Marina Circuit': {
    track: "Yas Marina Circuit",
    first_grand_prix: 2009,
    number_of_laps: 58,
    circuit_length_km: 5.281,
    race_distance_km: 306.183,
    lap_record: {
      time: "1:26.103",
      driver: "Max Verstappen",
      year: 2021
    },
    features: {
      corners: 16,
      drs_zones: 2,
      max_speed_kmh: null,
      notable_layout: "Modern facilities, hotel bridge, twilight-to-night race"
    }
  },
  // European Circuits
  'Autodromo Enzo e Dino Ferrari': {
    track: "Autodromo Enzo e Dino Ferrari (Imola)",
    first_grand_prix: 1980,
    number_of_laps: 63,
    circuit_length_km: 4.909,
    race_distance_km: 309.049,
    lap_record: {
      time: "1:15.484",
      driver: "Lewis Hamilton",
      year: 2020
    },
    features: {
      corners: 19,
      drs_zones: 1,
      max_speed_kmh: null,
      notable_layout: "Historic layout featuring Tamburello and Variante Alta"
    }
  },
  'Circuit de Monaco': {
    track: "Circuit de Monaco",
    first_grand_prix: 1950,
    number_of_laps: 78,
    circuit_length_km: 3.337,
    race_distance_km: 260.286,
    lap_record: {
      time: "1:14.260",
      driver: "Max Verstappen",
      year: 2018
    },
    features: {
      corners: 19,
      drs_zones: 1,
      max_speed_kmh: 260,
      notable_layout: "Narrow street layout with Casino Square, tunnel, and tight hairpin"
    }
  },
  'Circuit de Barcelona-Catalunya': {
    track: "Circuit de Barcelona-Catalunya",
    first_grand_prix: 1991,
    number_of_laps: 66,
    circuit_length_km: 4.675,
    race_distance_km: 308.550,
    lap_record: {
      time: "1:18.183",
      driver: "Max Verstappen",
      year: 2022
    },
    features: {
      corners: 14,
      drs_zones: 3,
      max_speed_kmh: 320,
      notable_layout: "Mix of high-speed corners and technical sections, wind-affected"
    }
  },
  'Red Bull Ring': {
    track: "Red Bull Ring (Austria)",
    first_grand_prix: 1970,
    number_of_laps: 71,
    circuit_length_km: 4.318,
    race_distance_km: 306.452,
    lap_record: {
      time: "1:05.619",
      driver: "Max Verstappen",
      year: 2023
    },
    features: {
      corners: 10,
      drs_zones: 2,
      max_speed_kmh: 315,
      notable_layout: "Short lap, elevation changes, fast top speed straights"
    }
  },
  'Silverstone Circuit': {
    track: "Silverstone Circuit (UK)",
    first_grand_prix: 1950,
    number_of_laps: 52,
    circuit_length_km: 5.891,
    race_distance_km: 306.747,
    lap_record: {
      time: "1:27.097",
      driver: "Max Verstappen",
      year: 2020
    },
    features: {
      corners: 18,
      drs_zones: 2,
      max_speed_kmh: 330,
      notable_layout: "Historic track with fast corners such as Maggotts-Becketts-Chapel"
    }
  },
  'Hungaroring': {
    track: "Hungaroring (Hungary)",
    first_grand_prix: 1986,
    number_of_laps: 70,
    circuit_length_km: 4.381,
    race_distance_km: 306.630,
    lap_record: {
      time: "1:16.627",
      driver: "Lewis Hamilton",
      year: 2020
    },
    features: {
      corners: 14,
      drs_zones: 1,
      max_speed_kmh: 300,
      notable_layout: "Twisty, slow and technical—known as 'Monaco without walls'"
    }
  },
  'Circuit de Spa-Francorchamps': {
    track: "Circuit de Spa-Francorchamps (Belgium)",
    first_grand_prix: 1950,
    number_of_laps: 44,
    circuit_length_km: 7.004,
    race_distance_km: 308.052,
    lap_record: {
      time: "1:44.701",
      driver: "Sergio Pérez",
      year: 2024
    },
    features: {
      corners: 19,
      drs_zones: 2,
      max_speed_kmh: 330,
      notable_layout: "Iconic Eau Rouge-Raidillon, long lap, fast straights"
    }
  },
  'Circuit Zandvoort': {
    track: "Circuit Zandvoort (Netherlands)",
    first_grand_prix: 1952,
    number_of_laps: 72,
    circuit_length_km: 4.259,
    race_distance_km: 306.648,
    lap_record: {
      time: "1:11.097",
      driver: "Lewis Hamilton",
      year: 2021
    },
    features: {
      corners: 14,
      drs_zones: 2,
      max_speed_kmh: 290,
      notable_layout: "Banked corners, tight seaside track"
    }
  },
  'Autodromo Nazionale di Monza': {
    track: "Autodromo Nazionale di Monza (Italy)",
    first_grand_prix: 1950,
    number_of_laps: 53,
    circuit_length_km: 5.793,
    race_distance_km: 306.720,
    lap_record: {
      time: "1:21.046",
      driver: "Rubens Barrichello",
      year: 2004
    },
    features: {
      corners: 11,
      drs_zones: 2,
      max_speed_kmh: 370,
      notable_layout: "Temple of Speed with long straights and historic banking"
    }
  },
  'Baku City Circuit': {
    track: "Baku City Circuit (Azerbaijan)",
    first_grand_prix: 2016,
    number_of_laps: 51,
    circuit_length_km: 6.003,
    race_distance_km: 306.049,
    lap_record: {
      time: "1:43.009",
      driver: "Charles Leclerc",
      year: 2019
    },
    features: {
      corners: 20,
      drs_zones: 2,
      max_speed_kmh: 360,
      notable_layout: "Street circuit, long straight and tight castle section"
    }
  },
  'Circuit of The Americas': {
    track: "Circuit of The Americas (USA)",
    first_grand_prix: 2012,
    number_of_laps: 56,
    circuit_length_km: 5.513,
    race_distance_km: 308.405,
    lap_record: {
      time: "1:36.169",
      driver: "Charles Leclerc",
      year: 2019
    },
    features: {
      corners: 20,
      drs_zones: 2,
      max_speed_kmh: 320,
      notable_layout: "Anti-clockwise track with uphill Turn 1 and flowing esses"
    }
  },
  'Autódromo Hermanos Rodríguez': {
    track: "Autódromo Hermanos Rodríguez (Mexico City)",
    first_grand_prix: 1963,
    number_of_laps: 71,
    circuit_length_km: 4.304,
    race_distance_km: 305.354,
    lap_record: {
      time: "1:18.741",
      driver: "Valtteri Bottas",
      year: 2018
    },
    features: {
      corners: 16,
      drs_zones: 2,
      max_speed_kmh: 330,
      notable_layout: "High-altitude track with stadium section (Foro Sol)"
    }
  },
  'Autódromo José Carlos Pace': {
    track: "Autódromo José Carlos Pace (Interlagos, Brazil)",
    first_grand_prix: 1973,
    number_of_laps: 71,
    circuit_length_km: 4.309,
    race_distance_km: 305.879,
    lap_record: {
      time: "1:10.540",
      driver: "Valtteri Bottas",
      year: 2018
    },
    features: {
      corners: 15,
      drs_zones: 2,
      max_speed_kmh: 320,
      notable_layout: "Anti-clockwise, high elevation changes, classic Brazilian circuit"
    }
  },
  'Las Vegas Strip Circuit': {
    track: "Las Vegas Strip Circuit (USA)",
    first_grand_prix: 2023,
    number_of_laps: 50,
    circuit_length_km: 6.201,
    race_distance_km: 310.050,
    lap_record: {
      time: "1:34.876",
      driver: "Lando Norris",
      year: 2024
    },
    features: {
      corners: 17,
      drs_zones: 3,
      max_speed_kmh: 320,
      notable_layout: "Night street circuit through Las Vegas Strip landmarks"
    }
  },
  // Additional mappings for race names
  'Albert Park Circuit': {
    track: "Albert Park Circuit",
    first_grand_prix: 1996,
    number_of_laps: 58,
    circuit_length_km: 5.278,
    race_distance_km: 306.124,
    lap_record: {
      time: "1:20.235",
      driver: "Charles Leclerc",
      year: 2022
    },
    features: {
      corners: 14,
      drs_zones: 2,
      max_speed_kmh: 320,
      notable_layout: "Temporary street circuit around Albert Park lake"
    }
  },
  'Miami International Autodrome': {
    track: "Miami International Autodrome",
    first_grand_prix: 2022,
    number_of_laps: 57,
    circuit_length_km: 5.412,
    race_distance_km: 308.326,
    lap_record: {
      time: "1:29.708",
      driver: "Max Verstappen",
      year: 2023
    },
    features: {
      corners: 19,
      drs_zones: 3,
      max_speed_kmh: 320,
      notable_layout: "Temporary street circuit around Hard Rock Stadium"
    }
  },
  'Circuit Gilles Villeneuve': {
    track: "Circuit Gilles Villeneuve",
    first_grand_prix: 1978,
    number_of_laps: 70,
    circuit_length_km: 4.361,
    race_distance_km: 305.270,
    lap_record: {
      time: "1:13.078",
      driver: "Valtteri Bottas",
      year: 2019
    },
    features: {
      corners: 14,
      drs_zones: 2,
      max_speed_kmh: 320,
      notable_layout: "Island circuit with Wall of Champions, fast chicanes"
    }
  },

};

// Race name to circuit name mapping
const raceToCircuitMap: Record<string, string> = {
  'Australian GP': 'Albert Park Circuit',
  'Bahrain GP': 'Bahrain International Circuit',
  'Saudi Arabian GP': 'Jeddah Corniche Circuit',
  'Chinese GP': 'Shanghai International Circuit',
  'Japanese GP': 'Suzuka International Racing Course',
  'Miami GP': 'Miami International Autodrome',
  'Emilia Romagna GP': 'Autodromo Enzo e Dino Ferrari',
  'Monaco GP': 'Circuit de Monaco',
  'Canadian GP': 'Circuit Gilles Villeneuve',
  'Spanish GP': 'Circuit de Barcelona-Catalunya',
  'Austrian GP': 'Red Bull Ring',
  'British GP': 'Silverstone Circuit',
  'Hungarian GP': 'Hungaroring',
  'Belgian GP': 'Circuit de Spa-Francorchamps',
  'Dutch GP': 'Circuit Zandvoort',
  'Italian GP': 'Autodromo Nazionale di Monza',
  'Azerbaijan GP': 'Baku City Circuit',
  'Singapore GP': 'Marina Bay Street Circuit',
  'United States GP': 'Circuit of The Americas',
  'Mexican GP': 'Autódromo Hermanos Rodríguez',
  'Brazilian GP': 'Autódromo José Carlos Pace',
  'Las Vegas GP': 'Las Vegas Strip Circuit',
  'Qatar GP': 'Lusail International Circuit',
  'Abu Dhabi GP': 'Yas Marina Circuit'
};

class CircuitFeaturesService {
  private static instance: CircuitFeaturesService;
  private features: Record<string, TrackFeatures> = {};

  static getInstance(): CircuitFeaturesService {
    if (!CircuitFeaturesService.instance) {
      CircuitFeaturesService.instance = new CircuitFeaturesService();
    }
    return CircuitFeaturesService.instance;
  }

  async loadFromCsv(url: string): Promise<Record<string, any>> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('Failed to load CSV, using built-in data');
        return this.getBuiltInFeatures();
      }
      const csvText = await response.text();
      return this.parseCsv(csvText);
    } catch (error) {
      console.warn('Error loading CSV, using built-in data:', error);
      return this.getBuiltInFeatures();
    }
  }

  private getBuiltInFeatures(): Record<string, any> {
    return TRACK_DATA;
  }

  private parseCsv(csvText: string): Record<string, any> {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const features: Record<string, any> = {};

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= headers.length) {
        const trackName = values[0];
        const trackData: any = {};
        headers.forEach((header, index) => {
          trackData[header] = values[index];
        });
        features[trackName] = trackData;
      }
    }

    return features;
  }

  findByRaceName(raceName: string): TrackFeatures | null {
    console.log(`🔍 Looking for track features for race: ${raceName}`);
    
    // Try direct mapping first
    const circuitName = raceToCircuitMap[raceName];
    if (circuitName && TRACK_DATA[circuitName]) {
      console.log(`✅ Found direct match: ${raceName} -> ${circuitName}`);
      return TRACK_DATA[circuitName];
    }

    // Try normalized race name
    const normalizedRaceName = raceName.replace(' Grand Prix', ' GP');
    const normalizedCircuitName = raceToCircuitMap[normalizedRaceName];
    if (normalizedCircuitName && TRACK_DATA[normalizedCircuitName]) {
      console.log(`✅ Found normalized match: ${normalizedRaceName} -> ${normalizedCircuitName}`);
      return TRACK_DATA[normalizedCircuitName];
    }

    // Try fuzzy matching
    const raceKey = Object.keys(raceToCircuitMap).find(key => 
      key.toLowerCase().includes(raceName.toLowerCase()) ||
      raceName.toLowerCase().includes(key.toLowerCase())
    );

    if (raceKey) {
      const circuitName = raceToCircuitMap[raceKey];
      if (TRACK_DATA[circuitName]) {
        console.log(`✅ Found fuzzy match: ${raceKey} -> ${circuitName}`);
        return TRACK_DATA[circuitName];
      }
    }

    // Try direct circuit name matching
    const circuitKey = Object.keys(TRACK_DATA).find(key =>
      key.toLowerCase().includes(raceName.toLowerCase()) ||
      raceName.toLowerCase().includes(key.toLowerCase())
    );

    if (circuitKey) {
      console.log(`✅ Found direct circuit match: ${circuitKey}`);
      return TRACK_DATA[circuitKey];
    }

    console.warn(`❌ No track features found for race: ${raceName}`);
    console.log(`Available races: ${Object.keys(raceToCircuitMap).join(', ')}`);
    return null;
  }

  getFeaturesForRace(race: Race): TrackFeatures | null {
    return this.findByRaceName(race.name);
  }
}

export default CircuitFeaturesService;


