import React, { useState, useEffect } from 'react';
import { Race, RacePrediction } from '../types/predictions';
import { sampleRaces } from '../data/sampleRaces';
import F1CarCarousel from '../components/F1CarCarousel';
import { motion } from 'framer-motion';
// import CalibrationDashboard from '../components/CalibrationDashboard';
import DynamicPredictionService from '../services/DynamicPredictionService';
import ModelStatistics from '../components/ModelStatistics';
// import CircuitDetails from '../components/CircuitDetails';

import ZoneFeatures from '../components/ZoneFeatures';
import PastRaceResultsCard from '../components/PastRaceResultsCard';
// import EnhancedPodium from '../components/EnhancedPodium';
import GlassWrapper from '../components/GlassWrapper';

import WeatherPanel from '../components/WeatherPanel';
import PodiumSection from '../components/PodiumSection';
import DriverList from '../components/DriverList';
import TrackFeatureCard from '../components/TrackFeatureCard';
import CustomControls, { CustomControlValues } from '../components/CustomControls';
import { enhancedCalibrationService } from '../services/enhancedCalibration';

import HybridPredictionService from '../services/HybridPredictionService';
import LocalPredictionService from '../services/LocalPredictionService';

// Removed ModelSummary and MiniSeasonCalendar per UI update
import { 
  // CloudRain, 
  // Wind, 
  // Thermometer, 
  // Sun, 
  // Trophy, 
  // Users, 
  // Target,
  // Settings,
  // BarChart3
} from 'lucide-react';
import ResultsService from '../services/ResultsService';

// Enhanced F1 Font Styles
const f1FontStyle = {
  fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif',
  fontWeight: '900',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const
};

const f1FontStyleLight = {
  fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif',
  fontWeight: '400',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const
};

// Deprecated local GlassCard replaced by GlassWrapper



// Enhanced Custom Prediction Interface
interface CustomPrediction {
  driverId: string;
  driverName: string;
  team: string;
  winProbPct: number;
  podiumProbPct: number;
  position: number;
}

// Enhanced Weather Interface
interface CustomWeather {
  tempC: number;
  windKmh: number;
  rainChancePct: number;
  condition: string;
}


interface PredictPageProps {
  raceData?: {
    raceName: string;
    raceId: string;
  };
}

const PredictPage: React.FC<PredictPageProps> = ({ raceData }) => {
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [availableRaces, setAvailableRaces] = useState<Race[]>([]);
  const [prediction, setPrediction] = useState<RacePrediction | null>(null);
  const [customPrediction, setCustomPrediction] = useState<CustomPrediction[]>([]);

  // Static data that doesn't change with race selection
  const [staticModelStats, setStaticModelStats] = useState<any>(null);
  const [staticCircuitFeatures, setStaticCircuitFeatures] = useState<any>(null);

  const [comparisonMode, setComparisonMode] = useState<'ai' | 'custom' | 'compare'>('ai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed selectedDriver and customWinProb state
  const [customWeather, setCustomWeather] = useState<CustomWeather>({
    tempC: 24,
    windKmh: 21,
    rainChancePct: 18,
    condition: 'Sunny'
  });
  const [weatherUpdating, setWeatherUpdating] = useState(false);
  const [autoGeneratePredictions] = useState(false);
  const [controlValues, setControlValues] = useState<CustomControlValues>({ tireWear: 40, cornerDifficulty: 50, drsEffect: 50, trackGrip: 60 });


  const [isHybridServiceAvailable, setIsHybridServiceAvailable] = useState<boolean>(false);
  


  useEffect(() => {
    initializePage();
    
    // Add body class to prevent scrollbars
    document.body.classList.add('predict-page-active');
    
    // Cleanup function to remove body class
    return () => {
      document.body.classList.remove('predict-page-active');
    };
  }, []);

  useEffect(() => {
    if (autoGeneratePredictions && prediction?.all && customWeather) {
      generateWeatherBasedPredictions(customWeather);
    }
  }, [autoGeneratePredictions, customWeather]);

  // Debug: Log driver count when prediction changes
  useEffect(() => {
    if (prediction?.all) {
      console.log(`🔍 Driver count: ${prediction.all.length}/20 drivers`);
      console.log(`🔍 Drivers:`, prediction.all.map(d => d.driverName));
      console.log(`🔍 Teams:`, prediction.all.map(d => `${d.driverName}: ${d.team}`));
      
      // Check for missing 2025 drivers
      const all2025Drivers = enhancedCalibrationService.get2025Drivers();
      const missingDrivers = all2025Drivers.filter(driver => 
        !prediction.all.some(d => d.driverName === driver)
      );
      
      if (missingDrivers.length > 0) {
        console.log(`⚠️ Missing drivers:`, missingDrivers);
      } else {
        console.log(`✅ All 20 drivers present`);
      }
    }
  }, [prediction]);

  const initializePage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load static data once (model stats and circuit features)
      if (!staticModelStats) {
        // Initialize static model statistics
        setStaticModelStats({
          overallAccuracy: 87.5,
          polePositionAccuracy: 82.3,
          podiumAccuracy: 89.1,
          trackTypePerformance: {
            street: 85.2,
            highSpeed: 88.7,
            technical: 86.4,
            hybrid: 87.9
          }
        });
      }

      if (!staticCircuitFeatures) {
        // Initialize static circuit features
        setStaticCircuitFeatures({
          'Australian GP': {
            track: 'Albert Park Circuit',
            number_of_laps: 58,
            circuit_length_km: 5.278,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 320 km/h']
          },
          'Chinese GP': {
            track: 'Shanghai International Circuit',
            number_of_laps: 56,
            circuit_length_km: 5.451,
            features: ['DRS Zones: 2', 'Tire wear: High', 'Banking: None', 'Top speed: 325 km/h']
          },
          'Japanese GP': {
            track: 'Suzuka International Racing Course',
            number_of_laps: 53,
            circuit_length_km: 5.807,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 330 km/h']
          },
          'Bahrain GP': {
            track: 'Bahrain International Circuit',
            number_of_laps: 57,
            circuit_length_km: 5.412,
            features: ['DRS Zones: 2', 'Tire wear: High', 'Banking: None', 'Top speed: 315 km/h']
          },
          'Saudi Arabian GP': {
            track: 'Jeddah Corniche Circuit',
            number_of_laps: 50,
            circuit_length_km: 6.175,
            features: ['DRS Zones: 3', 'Tire wear: Medium', 'Banking: None', 'Top speed: 340 km/h']
          },
          'Miami GP': {
            track: 'Miami International Autodrome',
            number_of_laps: 57,
            circuit_length_km: 5.412,
            features: ['DRS Zones: 3', 'Tire wear: Medium', 'Banking: None', 'Top speed: 320 km/h']
          },
          'Emilia Romagna GP': {
            track: 'Autodromo Enzo e Dino Ferrari',
            number_of_laps: 63,
            circuit_length_km: 4.909,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 310 km/h']
          },
          'Monaco GP': {
            track: 'Circuit de Monaco',
            number_of_laps: 78,
            circuit_length_km: 3.337,
            features: ['DRS Zones: 1', 'Tire wear: Low', 'Banking: None', 'Top speed: 280 km/h']
          },
          'Spanish GP': {
            track: 'Circuit de Barcelona-Catalunya',
            number_of_laps: 66,
            circuit_length_km: 4.675,
            features: ['DRS Zones: 2', 'Tire wear: High', 'Banking: None', 'Top speed: 315 km/h']
          },
          'Canadian GP': {
            track: 'Circuit Gilles Villeneuve',
            number_of_laps: 70,
            circuit_length_km: 4.361,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 320 km/h']
          },
          'Austrian GP': {
            track: 'Red Bull Ring',
            number_of_laps: 71,
            circuit_length_km: 4.318,
            features: ['DRS Zones: 3', 'Tire wear: Medium', 'Banking: None', 'Top speed: 325 km/h']
          },
          'British GP': {
            track: 'Silverstone Circuit',
            number_of_laps: 52,
            circuit_length_km: 5.891,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 330 km/h']
          },
          'Belgian GP': {
            track: 'Circuit de Spa-Francorchamps',
            number_of_laps: 44,
            circuit_length_km: 7.004,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 350 km/h']
          },
          'Hungarian GP': {
            track: 'Hungaroring',
            number_of_laps: 70,
            circuit_length_km: 4.381,
            features: ['DRS Zones: 2', 'Tire wear: High', 'Banking: None', 'Top speed: 300 km/h']
          },
          'Dutch GP': {
            track: 'Circuit Zandvoort',
            number_of_laps: 72,
            circuit_length_km: 4.259,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: Yes', 'Top speed: 310 km/h']
          },
          'Italian GP': {
            track: 'Autodromo Nazionale di Monza',
            number_of_laps: 53,
            circuit_length_km: 5.793,
            features: ['DRS Zones: 2', 'Tire wear: Low', 'Banking: None', 'Top speed: 360 km/h']
          },
          'Azerbaijan GP': {
            track: 'Baku City Circuit',
            number_of_laps: 51,
            circuit_length_km: 6.003,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 340 km/h']
          },
          'Singapore GP': {
            track: 'Marina Bay Street Circuit',
            number_of_laps: 61,
            circuit_length_km: 5.063,
            features: ['DRS Zones: 2', 'Tire wear: High', 'Banking: None', 'Top speed: 300 km/h']
          },
          'United States GP': {
            track: 'Circuit of the Americas',
            number_of_laps: 56,
            circuit_length_km: 5.513,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: Yes', 'Top speed: 320 km/h']
          },
          'Mexican GP': {
            track: 'Autódromo Hermanos Rodríguez',
            number_of_laps: 71,
            circuit_length_km: 4.304,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 315 km/h']
          },
          'Brazilian GP': {
            track: 'Autódromo José Carlos Pace',
            number_of_laps: 71,
            circuit_length_km: 4.309,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 320 km/h']
          },
          'Las Vegas GP': {
            track: 'Las Vegas Strip Circuit',
            number_of_laps: 50,
            circuit_length_km: 6.201,
            features: ['DRS Zones: 3', 'Tire wear: Medium', 'Banking: None', 'Top speed: 340 km/h']
          },
          'Qatar GP': {
            track: 'Lusail International Circuit',
            number_of_laps: 57,
            circuit_length_km: 5.419,
            features: ['DRS Zones: 2', 'Tire wear: High', 'Banking: None', 'Top speed: 325 km/h']
          },
          'Abu Dhabi GP': {
            track: 'Yas Marina Circuit',
            number_of_laps: 58,
            circuit_length_km: 5.281,
            features: ['DRS Zones: 2', 'Tire wear: Medium', 'Banking: None', 'Top speed: 320 km/h']
          }
        });
      }


      // Check if hybrid service is available
      try {
        const hybridService = HybridPredictionService.getInstance();
        const isHealthy = await hybridService.checkServiceHealth();
        setIsHybridServiceAvailable(isHealthy);
        console.log(`🔍 Hybrid service health check: ${isHealthy ? '✅ Available' : '❌ Not available'}`);
      } catch (error) {
        console.warn('⚠️ Hybrid service health check failed:', error);
      setIsHybridServiceAvailable(false);
      }



      // PRIORITY 1: Use updated 2025 calendar from sampleRaces.ts
      console.log('📅 Using updated 2025 F1 calendar...');
      const now = new Date();
      const allRacesSorted = sampleRaces
        .slice()
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      const upcomingRaces = allRacesSorted.filter(race => new Date(race.startDate) > now);

      console.log(`📅 Found ${upcomingRaces.length} upcoming races in 2025 calendar`);
      console.log('🏁 Available races:', upcomingRaces.map(r => `${r.name} (${new Date(r.startDate).toLocaleDateString()})`));

      if (upcomingRaces.length > 0) {
        setAvailableRaces(allRacesSorted);
        
        // If raceData is provided from schedule page, use that race
        let selectedRace = upcomingRaces[0]; // Default to next upcoming race
        
        if (raceData && raceData.raceName) {
          const requestedRace = allRacesSorted.find(race => 
            race.name === raceData.raceName || 
            race.id === raceData.raceId ||
            race.name.toLowerCase().includes(raceData.raceName.toLowerCase())
          );
          
          if (requestedRace) {
            selectedRace = requestedRace;
            console.log(`🎯 Using requested race from schedule: ${selectedRace.name} (${new Date(selectedRace.startDate).toLocaleDateString()})`);
          } else {
            console.log(`⚠️ Requested race "${raceData.raceName}" not found, using next upcoming race`);
          }
        } else {
          console.log(`🎯 Next upcoming race: ${selectedRace.name} (${new Date(selectedRace.startDate).toLocaleDateString()})`);
        }
        
        setCurrentRace(selectedRace);
        await loadPredictions(selectedRace);
        return; // Exit early, don't try other services
      }

      // PRIORITY 2: Fallback to hybrid service if no upcoming races in 2025 calendar
      let racesFound = false;
      
      if (isHybridServiceAvailable) {
        try {
          const hybridService = HybridPredictionService.getInstance();
          const hybridRaces = await hybridService.getAvailableRaces();
          
          if (hybridRaces && hybridRaces.length > 0) {
            console.log(`📅 Found ${hybridRaces.length} races from hybrid service`);
            console.log('🏁 Available race names:', hybridRaces.map(r => r.race || r.name));
            
            const upcomingRaces = hybridRaces
              .filter((race: any) => race.race || race.name)
              .map((race: any) => ({
                id: race.id || (race.race || race.name).toLowerCase().replace(/\s+/g, '-'),
                round: race.round || 1,
                name: race.race || race.name,
                circuit: race.circuit || race.race || race.name,
                city: race.city || 'Unknown',
                country: race.country || 'Unknown',
                startDate: race.date || new Date().toISOString(),
                endDate: race.date || new Date().toISOString(),
                timezone: race.timezone || 'UTC',
                has_sprint: race.has_sprint || false,
                status: 'upcoming' as const
              }));
            
            console.log('🏁 Mapped hybrid races:', upcomingRaces.map(r => r.name));
            console.log('🏁 First race details:', upcomingRaces[0]);
            
            setAvailableRaces(upcomingRaces);
            
            if (upcomingRaces.length > 0) {
              // Find the next upcoming race
              const now = new Date();
              const nextUpcomingRace = upcomingRaces
                .filter(race => new Date(race.startDate) > now)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
              
              const raceToUse = nextUpcomingRace || upcomingRaces[0];
              console.log(`🎯 Next upcoming race: ${raceToUse.name} (${new Date(raceToUse.startDate).toLocaleDateString()})`);
              setCurrentRace(raceToUse);
              await loadPredictions(raceToUse);
              racesFound = true;
            }
          }
        } catch (hybridError) {
          console.warn('⚠️ Hybrid service races failed, trying local:', hybridError);
        }
      }
      
      // Fallback to local predictions if hybrid didn't work
      if (!racesFound) {
      try {
        const localService = LocalPredictionService.getInstance();
        const localRaces = await localService.getAvailableRaces();
        
                  if (localRaces && localRaces.length > 0) {
            console.log(`📅 Found ${localRaces.length} races from local predictions`);
            console.log('🏁 Available race names:', localRaces.map(r => r.name));
            
            const upcomingRaces = localRaces
              .filter((race: any) => race.name && race.predictions)
              .map((race: any) => ({
                id: race.id || race.name.toLowerCase().replace(/\s+/g, '-'),
                round: 1, // Default round
                name: race.name,
                circuit: race.name,
                city: 'Unknown',
                country: 'Unknown',
                startDate: new Date().toISOString(), // Use current date as fallback
                endDate: new Date().toISOString(),
                timezone: 'UTC',
                has_sprint: false,
                status: 'upcoming' as const
              }));
            
            console.log('🏁 Mapped local races:', upcomingRaces.map(r => r.name));
            console.log('🏁 First race details:', upcomingRaces[0]);
            
            setAvailableRaces(upcomingRaces);
            
            if (upcomingRaces.length > 0) {
              // Find the next upcoming race
              const now = new Date();
              const nextUpcomingRace = upcomingRaces
                .filter(race => new Date(race.startDate) > now)
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
              
              const raceToUse = nextUpcomingRace || upcomingRaces[0];
              console.log(`🎯 Next upcoming race: ${raceToUse.name} (${new Date(raceToUse.startDate).toLocaleDateString()})`);
              setCurrentRace(raceToUse);
              await loadPredictions(raceToUse);
              racesFound = true;
            }
          } else {
            throw new Error('No local races available');
          }
      } catch (localError) {
        console.warn('Local races not available, using sample data:', localError);
        
                  // Fallback to sample races - find next upcoming race
        const now = new Date();
        const upcomingRaces = sampleRaces
          .filter(race => new Date(race.startDate) > now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        setAvailableRaces(upcomingRaces);

        if (upcomingRaces.length === 0) {
          setError('No upcoming races available');
          setLoading(false);
          return;
        }

        // Select the next upcoming race (first in the sorted list)
        const nextRace = upcomingRaces[0];
        console.log(`🎯 Next upcoming race: ${nextRace.name} (${new Date(nextRace.startDate).toLocaleDateString()})`);
        setCurrentRace(nextRace);
        await loadPredictions(nextRace);
        }
      }

    } catch (err) {
      console.error('Error initializing page:', err);
      setError('Failed to initialize page');
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async (race: Race) => {
    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Prediction loading timeout')), 10000); // 10 second timeout
      });

      const predictionPromise = (async () => {
        console.log('🚀 Starting prediction loading process...');
        console.log('🎯 Target race:', race.name);
        
        let predictionData = null;
        
        // Map 2025 race names to track-specific prediction names
        const raceNameMapping: Record<string, string> = {
          'Australian GP': 'Australian Grand Prix',
          'Chinese GP': 'Chinese Grand Prix', 
          'Japanese GP': 'Japanese Grand Prix',
          'Bahrain GP': 'Bahrain Grand Prix',
          'Saudi Arabian GP': 'Saudi Arabian Grand Prix',
          'Miami GP': 'Miami Grand Prix',
          'Emilia-Romagna GP': 'Emilia Romagna Grand Prix',
          'Monaco GP': 'Monaco Grand Prix',
          'Spanish GP': 'Spanish Grand Prix',
          'Canadian GP': 'Canadian Grand Prix',
          'Austrian GP': 'Austrian Grand Prix',
          'British GP': 'British Grand Prix',
          'Hungarian GP': 'Hungarian Grand Prix',
          'Belgian GP': 'Belgian Grand Prix',
          'Dutch GP': 'Dutch Grand Prix',
          'Italian GP': 'Italian Grand Prix',
          'Azerbaijan GP': 'Azerbaijan Grand Prix',
          'Singapore GP': 'Singapore Grand Prix',
          'United States GP': 'United States Grand Prix',
          'Mexican GP': 'Mexican Grand Prix',
          'Brazilian GP': 'Brazilian Grand Prix',
          'Las Vegas GP': 'Las Vegas Grand Prix',
          'Qatar GP': 'Qatar Grand Prix',
          'Abu Dhabi GP': 'Abu Dhabi Grand Prix'
        };
        
        // Try Local Dynamic Prediction Service first (with McLaren dominance)
        try {
          console.log('🚀 Attempting local dynamic predictions with McLaren dominance...');
          console.log('🔍 Original race name:', race.name);
          
          // Map race name to track-specific format
          let raceNameForPredictions = race.name;
          if (raceNameMapping[race.name]) {
            raceNameForPredictions = raceNameMapping[race.name];
            console.log('🔍 Mapped race name for predictions:', raceNameForPredictions);
          }
          
          const dynamicService = DynamicPredictionService.getInstance();
          predictionData = await dynamicService.getRacePrediction(raceNameForPredictions, 2025);
          
                      if (predictionData) {
              console.log(`🎯 Local dynamic predictions received for ${race.name}: ${predictionData.all?.length} drivers`);
              console.log('Sample drivers:', predictionData.all?.slice(0, 3).map(d => `${d.driverName} (${d.team})`));
              console.log('🏆 McLaren drivers:', predictionData.all?.filter(d => d.team.includes('McLaren')).map(d => `${d.driverName}: ${d.winProbPct.toFixed(2)}%`));
              
              // Show track-specific information
              console.log('🏁 Track-specific info:', {
                race: predictionData.race,
                weather: predictionData.weatherUsed,
                top3: predictionData.top3?.map(d => `${d.driverName}: ${d.winProbPct.toFixed(1)}%`)
              });
            
            setPrediction(predictionData);
            console.log('✅ Local dynamic prediction set successfully');
            console.log(`🔍 Prediction contains ${predictionData.all?.length || 0} drivers`);
            console.log('🔍 First few drivers:', predictionData.all?.slice(0, 3).map(d => `${d.driverName} (${d.team})`));
            return;
          }
        } catch (dynamicError) {
          console.warn('⚠️ Local dynamic predictions failed, falling back to hybrid:', dynamicError);
        }
        
        // Try hybrid service if dynamic service fails
        if (isHybridServiceAvailable) {
          try {
            console.log('🔄 Attempting hybrid service...');
            const hybridService = HybridPredictionService.getInstance();
            predictionData = await hybridService.getRacePrediction(race.name);
            
            if (predictionData) {
              console.log(`🎯 Hybrid predictions received for ${race.name}: ${predictionData.predictions?.length} drivers`);
              console.log('Sample drivers:', predictionData.predictions?.slice(0, 3).map(d => `${d.driverName} (${d.constructor})`));
              
              // Convert hybrid format to RacePrediction format
              const convertedPrediction = hybridService.convertToRacePrediction(predictionData);
              console.log('✅ Hybrid conversion successful:', convertedPrediction);
              console.log('Top 3 drivers:', convertedPrediction.top3?.map(d => d.driverName));
              console.log('All drivers count:', convertedPrediction.all?.length);
              
              setPrediction(convertedPrediction);
              console.log('✅ Hybrid prediction set successfully');
              console.log(`🔍 Hybrid prediction contains ${convertedPrediction.all?.length || 0} drivers`);
              console.log('🔍 First few drivers:', convertedPrediction.all?.slice(0, 3).map(d => `${d.driverName} (${d.team})`));
              return;
            }
          } catch (hybridError) {
            console.warn('⚠️ Hybrid service failed, falling back to local:', hybridError);
          }
        }
        
        // Fallback to local predictions
        const localService = LocalPredictionService.getInstance();
        console.log('✅ Local service initialized');
        
        try {
          console.log('🔄 Attempting local service...');
          console.log('🎯 Looking for race:', race.name);
          
          // Try to map 2025 race names to local prediction names
          let raceNameToTry = race.name;
          
          if (raceNameMapping[race.name]) {
            raceNameToTry = raceNameMapping[race.name];
            console.log(`🔄 Mapped race name from "${race.name}" to "${raceNameToTry}"`);
          }
          
          predictionData = await localService.getRacePrediction(raceNameToTry);
          if (predictionData) {
            console.log(`🎯 Local predictions received for ${race.name}: ${predictionData.predictions?.length} drivers`);
            console.log('Sample drivers:', predictionData.predictions?.slice(0, 3).map(d => `${d.driverName} (${d.constructor})`));
            
            // Convert local format to RacePrediction format
            const convertedPrediction = localService.convertToRacePrediction(predictionData);
            console.log('✅ Local conversion successful:', convertedPrediction);
            console.log('Top 3 drivers:', convertedPrediction.top3?.map(d => d.driverName));
            console.log('All drivers count:', convertedPrediction.all?.length);
            
                          setPrediction(convertedPrediction);
              console.log('✅ Local prediction set successfully');
              console.log(`🔍 Local prediction contains ${convertedPrediction.all?.length || 0} drivers`);
              console.log('🔍 First few drivers:', convertedPrediction.all?.slice(0, 3).map(d => `${d.driverName} (${d.team})`));
            } else {
            console.log('⚠️ Local service returned no data for specific race, trying next race...');
            // Try next race from local service
            const nextRacePrediction = await localService.getNextRacePrediction();
            if (nextRacePrediction) {
              console.log(`🎯 Local next race predictions received: ${nextRacePrediction.predictions?.length} drivers`);
              console.log('Next race sample drivers:', nextRacePrediction.predictions?.slice(0, 3).map(d => `${d.driverName} (${d.constructor})`));
              
              const convertedPrediction = localService.convertToRacePrediction(nextRacePrediction);
              console.log('✅ Next race conversion successful:', convertedPrediction);
              console.log('Top 3 drivers:', convertedPrediction.top3?.map(d => d.driverName));
              
              setPrediction(convertedPrediction);
              console.log('✅ Local next race prediction set successfully');
            } else {
              console.log('❌ Local service returned no data for next race either');
            }
          }
        } catch (localError) {
          console.error('Local predictions failed:', localError);
          throw new Error('Failed to load predictions from local service');
        }
        
        if (predictionData || prediction) {
          // Initialize custom predictions with AI predictions
          const currentPrediction = prediction;
          if (currentPrediction?.all) {
            const initialCustomPredictions = currentPrediction.all.map((driver: any) => ({
              ...driver,
              winProbPct: driver.winProbPct
            }));
            setCustomPrediction(initialCustomPredictions);
            
            // Auto-generate weather-based predictions if enabled
            if (autoGeneratePredictions) {
              generateWeatherBasedPredictions(customWeather);
            }
          }
          
          // Fire and forget: warm last race results for later stats use
          ResultsService.getLastRaceResult().catch(() => {});
        } else {
          // Check if we have any fallback predictions available
          console.log('🔍 No primary predictions available, checking for fallback...');
          
          // Try to get fallback predictions from DynamicPredictionService
          try {
            const dynamicService = DynamicPredictionService.getInstance();
            const fallbackPrediction = await dynamicService.getRacePrediction(race.name, 2025);
            
                          if (fallbackPrediction && fallbackPrediction.all && fallbackPrediction.all.length > 0) {
                console.log(`✅ Fallback predictions loaded: ${fallbackPrediction.all.length} drivers`);
                console.log('🔍 Fallback drivers:', fallbackPrediction.all.map(d => `${d.driverName} (${d.team})`));
                setPrediction(fallbackPrediction);
              
              // Initialize custom predictions with fallback
              const initialCustomPredictions = fallbackPrediction.all.map((driver: any) => ({
                ...driver,
                winProbPct: driver.winProbPct
              }));
              setCustomPrediction(initialCustomPredictions);
              
              // Fire and forget: warm last race results for later stats use
              ResultsService.getLastRaceResult().catch(() => {});
              return; // Successfully loaded fallback predictions
            }
          } catch (fallbackError) {
            console.warn('⚠️ Fallback predictions also failed:', fallbackError);
          }
          
          throw new Error('Failed to load predictions');
        }
      })();

      // Race the prediction loading against the timeout
      await Promise.race([predictionPromise, timeoutPromise]);

    } catch (err) {
      console.error('Error loading predictions:', err);
      if (err instanceof Error && err.message === 'Prediction loading timeout') {
        setError('Prediction loading timed out. Please try again.');
      } else if (err instanceof Error && err.message.includes('Failed to load predictions from local service')) {
        setError('Local prediction service unavailable. Using fallback predictions.');
      } else if (err instanceof Error && err.message.includes('Failed to load predictions')) {
        setError('All prediction services failed. Using fallback predictions.');
      } else {
        setError(`Failed to load predictions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRaceChange = async (raceId: string) => {
    const selectedRace = availableRaces.find(race => race.id === raceId);
    if (selectedRace) {
      setCurrentRace(selectedRace);
      await loadPredictions(selectedRace);
    }
  };

  // Removed custom prediction handlers

  const handleWeatherChange = (newWeather: CustomWeather) => {
    setWeatherUpdating(true);
    setCustomWeather(newWeather);
    
    // Auto-generate predictions if enabled
    if (autoGeneratePredictions && prediction?.all) {
      generateWeatherBasedPredictions(newWeather);
    }
    
    // Simulate API call delay
    setTimeout(() => {
      setWeatherUpdating(false);
    }, 500);
  };

  const generateWeatherBasedPredictions = (weather: CustomWeather) => {
    if (!prediction?.all) return;

    // Weather impact factors
    const tempFactor = weather.tempC > 30 ? 1.2 : weather.tempC < 15 ? 0.8 : 1.0;
    const windFactor = weather.windKmh > 40 ? 0.9 : weather.windKmh < 10 ? 1.1 : 1.0;
    const rainFactor = weather.rainChancePct > 50 ? 0.7 : weather.rainChancePct > 20 ? 0.9 : 1.0;
    const conditionFactor = weather.condition === 'Rainy' ? 0.6 : weather.condition === 'Cloudy' ? 0.9 : 1.0;

    const tireFactor = 0.8 + controlValues.tireWear / 250;
    const cornerFactor = 0.9 + controlValues.cornerDifficulty / 500;
    const drsFactor = 0.9 + controlValues.drsEffect / 500;
    const gripFactor = 0.9 + controlValues.trackGrip / 500;
    const totalFactor = tempFactor * windFactor * rainFactor * conditionFactor * tireFactor * cornerFactor * drsFactor * gripFactor;

    // Generate new predictions based on weather
    const newPredictions = prediction.all.map(driver => {
      const baseProb = driver.winProbPct;
      let adjustedProb = baseProb * totalFactor;
      
      // Add some randomness for realistic variation
      const randomVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      adjustedProb = adjustedProb * randomVariation;
      
      // Ensure probability stays within reasonable bounds
      adjustedProb = Math.max(0.1, Math.min(50, adjustedProb));
      
      return {
        ...driver,
        winProbPct: adjustedProb
      };
    });

    // Sort by adjusted probability and reassign positions
    const sortedPredictions = newPredictions
      .sort((a, b) => b.winProbPct - a.winProbPct)
      .map((driver, index) => ({
        ...driver,
        position: index + 1
      }));

    setCustomPrediction(sortedPredictions);
    setComparisonMode('compare');
  };

  // Removed custom prediction add function

  if (loading && !currentRace) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden pt-20 bg-black relative predict-page-container">
        
        {/* F1 Car Carousel Background */}
        <div className="f1-car-background">
          <F1CarCarousel />
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <p className="text-2xl text-gray-300 mb-4" style={f1FontStyleLight}>
              Loading race data...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && !currentRace) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden pt-20 bg-gradient-to-br from-black via-gray-900 to-black relative predict-page-container">
        
        {/* F1 Car Carousel Background */}
        <div className="f1-car-background">
          <F1CarCarousel />
        </div>
        
        <div className="container mx-auto px-4 py-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <h1 className="text-7xl mb-6 text-white" style={f1FontStyle}>ERROR</h1>
            <div className="w-32 h-1 bg-red-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-2xl text-red-400 mb-8" style={f1FontStyleLight}>{error}</p>
            <button 
              onClick={initializePage}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-4 rounded-xl transition-all transform hover:scale-105 glass-card"
              style={f1FontStyle}
            >
              TRY AGAIN
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!currentRace) {
    return (
      <div className="min-h-screen text-white overflow-x-hidden pt-20 bg-gradient-to-br from-black via-gray-900 to-black relative predict-page-container">
        
        {/* F1 Car Carousel Background */}
        <div className="f1-car-background">
          <F1CarCarousel />
        </div>
        
        <div className="container mx-auto px-4 py-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <h1 className="text-7xl mb-6 text-white" style={f1FontStyle}>NO RACE AVAILABLE</h1>
            <div className="w-32 h-1 bg-red-500 mx-auto mb-6 rounded-full"></div>
            <p className="text-2xl text-gray-300" style={f1FontStyleLight}>Please check back later for upcoming races.</p>
          </motion.div>
        </div>
      </div>
    );
  }



  // Model statistics: use static data that doesn't change with race selection
  const modelStats = staticModelStats || {
    overallAccuracy: 87.5,
    polePositionAccuracy: 82.3,
    podiumAccuracy: 89.1,
    trackTypePerformance: {
      street: 85.2,
      highSpeed: 88.7,
      technical: 86.4,
      hybrid: 87.9
    }
  };

  // Circuit information for current race
  const getCircuitInfo = (raceName: string) => {
    const circuitMap: Record<string, { name: string; laps: number; length: number; prediction: string; keyFactors: string[] }> = {
      'Australian GP': {
        name: 'Albert Park Circuit',
        laps: 58,
        length: 5.278,
        prediction: 'Technical circuit with multiple overtaking opportunities. Weather can significantly impact tire strategy.',
        keyFactors: ['Weather', 'Overtaking', 'Tire Strategy', 'Technical']
      },
      'Chinese GP': {
        name: 'Shanghai International Circuit',
        laps: 56,
        length: 5.451,
        prediction: 'Technical circuit with long straights and challenging corners. Tire degradation and strategy will be crucial.',
        keyFactors: ['Tire Wear', 'Strategy', 'Technical Corners', 'Straight Speed']
      },
      'Japanese GP': {
        name: 'Suzuka International Racing Course',
        laps: 53,
        length: 5.807,
        prediction: 'High-speed technical circuit with the famous 130R corner. Weather and tire strategy will be key factors.',
        keyFactors: ['High Speed', 'Technical', 'Weather', 'Tire Strategy']
      },
      'Bahrain GP': {
        name: 'Bahrain International Circuit',
        laps: 57,
        length: 5.412,
        prediction: 'Our model predicts overtaking opportunities will be limited with tire degradation playing a crucial role in race strategy.',
        keyFactors: ['Tire Wear', 'Braking', 'Top Speed', 'Corners']
      },
      'Saudi Arabian GP': {
        name: 'Jeddah Corniche Circuit',
        laps: 50,
        length: 6.175,
        prediction: 'High-speed street circuit with multiple DRS zones. Safety car probability is elevated due to tight barriers.',
        keyFactors: ['Speed', 'DRS Zones', 'Safety Car', 'Barriers']
      },
      'Miami GP': {
        name: 'Miami International Autodrome',
        laps: 57,
        length: 5.412,
        prediction: 'Street circuit with multiple overtaking opportunities. Tire strategy and track evolution will be crucial.',
        keyFactors: ['Street Circuit', 'Overtaking', 'Tire Strategy', 'Track Evolution']
      },
      'Emilia Romagna GP': {
        name: 'Autodromo Enzo e Dino Ferrari',
        laps: 63,
        length: 4.909,
        prediction: 'Technical circuit with elevation changes and challenging corners. Tire degradation and strategy will be key.',
        keyFactors: ['Elevation', 'Technical', 'Tire Wear', 'Strategy']
      },
      'Monaco GP': {
        name: 'Circuit de Monaco',
        laps: 78,
        length: 3.337,
        prediction: 'Ultimate test of precision and concentration. Overtaking is extremely difficult, making qualifying crucial.',
        keyFactors: ['Precision', 'Qualifying', 'Concentration', 'Strategy']
      },
      'Spanish GP': {
        name: 'Circuit de Barcelona-Catalunya',
        laps: 66,
        length: 4.675,
        prediction: 'Technical circuit with high tire degradation. Strategy and tire management will be crucial for success.',
        keyFactors: ['Tire Degradation', 'Strategy', 'Technical', 'Endurance']
      },
      'Canadian GP': {
        name: 'Circuit Gilles Villeneuve',
        laps: 70,
        length: 4.361,
        prediction: 'High-speed circuit with multiple overtaking opportunities. Weather and safety cars can change the race.',
        keyFactors: ['Speed', 'Overtaking', 'Weather', 'Safety Cars']
      },
      'Austrian GP': {
        name: 'Red Bull Ring',
        laps: 71,
        length: 4.318,
        prediction: 'Short, fast circuit with multiple DRS zones. Tire strategy and track position will be crucial.',
        keyFactors: ['Speed', 'DRS Zones', 'Tire Strategy', 'Track Position']
      },
      'British GP': {
        name: 'Silverstone Circuit',
        laps: 52,
        length: 5.891,
        prediction: 'High-speed circuit with challenging corners. Weather and tire strategy will play a major role.',
        keyFactors: ['High Speed', 'Weather', 'Tire Strategy', 'Technical']
      },
      'Belgian GP': {
        name: 'Circuit de Spa-Francorchamps',
        laps: 44,
        length: 7.004,
        prediction: 'Longest circuit on the calendar with high speeds and elevation changes. Weather is always a factor.',
        keyFactors: ['High Speed', 'Elevation', 'Weather', 'Endurance']
      },
      'Hungarian GP': {
        name: 'Hungaroring',
        laps: 70,
        length: 4.381,
        prediction: 'Technical circuit with limited overtaking opportunities. Qualifying position and strategy will be crucial.',
        keyFactors: ['Technical', 'Qualifying', 'Strategy', 'Overtaking']
      },
      'Dutch GP': {
        name: 'Circuit Zandvoort',
        laps: 72,
        length: 4.259,
        prediction: 'High-speed circuit with banking. Tire degradation and weather changes can create strategic opportunities.',
        keyFactors: ['Banking', 'Weather', 'Tire Wear', 'Speed']
      },
      'Italian GP': {
        name: 'Autodromo Nazionale di Monza',
        laps: 53,
        length: 5.793,
        prediction: 'Temple of Speed with long straights and high speeds. Engine power and slipstreaming will be crucial.',
        keyFactors: ['Speed', 'Engine Power', 'Slipstreaming', 'Strategy']
      },
      'Azerbaijan GP': {
        name: 'Baku City Circuit',
        laps: 51,
        length: 6.003,
        prediction: 'Street circuit with long straights and tight corners. Safety cars and strategy will be key factors.',
        keyFactors: ['Street Circuit', 'Safety Cars', 'Strategy', 'Speed']
      },
      'Singapore GP': {
        name: 'Marina Bay Street Circuit',
        laps: 61,
        length: 5.063,
        prediction: 'Night race on a street circuit with high humidity. Tire degradation and strategy will be crucial.',
        keyFactors: ['Night Race', 'Humidity', 'Tire Wear', 'Strategy']
      },
      'United States GP': {
        name: 'Circuit of the Americas',
        laps: 56,
        length: 5.513,
        prediction: 'Technical circuit with elevation changes and multiple overtaking opportunities.',
        keyFactors: ['Elevation', 'Technical', 'Overtaking', 'Strategy']
      },
      'Mexican GP': {
        name: 'Autódromo Hermanos Rodríguez',
        laps: 71,
        length: 4.304,
        prediction: 'High altitude circuit affecting engine performance. Tire strategy and track position will be crucial.',
        keyFactors: ['Altitude', 'Engine Performance', 'Tire Strategy', 'Track Position']
      },
      'Brazilian GP': {
        name: 'Autódromo José Carlos Pace',
        laps: 71,
        length: 4.309,
        prediction: 'Technical circuit with elevation changes. Weather and tire strategy will play a major role.',
        keyFactors: ['Elevation', 'Weather', 'Tire Strategy', 'Technical']
      },
      'Las Vegas GP': {
        name: 'Las Vegas Strip Circuit',
        laps: 50,
        length: 6.201,
        prediction: 'Street circuit with long straights and tight corners. Night race conditions will add complexity.',
        keyFactors: ['Street Circuit', 'Night Race', 'Speed', 'Strategy']
      },
      'Qatar GP': {
        name: 'Lusail International Circuit',
        laps: 57,
        length: 5.419,
        prediction: 'High-speed circuit with challenging corners. Tire degradation and strategy will be key factors.',
        keyFactors: ['High Speed', 'Tire Wear', 'Strategy', 'Technical']
      },
      'Abu Dhabi GP': {
        name: 'Yas Marina Circuit',
        laps: 58,
        length: 5.281,
        prediction: 'Season finale with day-to-night transition. Strategy and tire management will be crucial.',
        keyFactors: ['Day-to-Night', 'Strategy', 'Tire Management', 'Technical']
      }
    };
    
    return circuitMap[raceName] || {
      name: 'Circuit Information',
      laps: 50,
      length: 5.0,
      prediction: 'AI-powered predictions based on historical data and current form.',
      keyFactors: ['Performance', 'Strategy', 'Conditions', 'History']
    };
  };

  const circuitInfo = getCircuitInfo(currentRace.name);



  return (
    <div className="min-h-screen text-white overflow-x-hidden pt-24 md:pt-28 relative predict-page-container">
      {/* Background only: car carousel. Removed extra overlay layers to avoid page-wide glass/tint. */}
      
      {/* F1 Car Carousel Background */}
      <div className="f1-car-background" aria-hidden="true">
        <F1CarCarousel />
      </div>
      {/* Subtle dark overlay to keep text readable while allowing background to show */}
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" aria-hidden="true"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">

        {/* Page Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-black mb-3 text-white" style={f1FontStyle}>RACE PREDICTIONS</h1>
          <div className="w-24 h-1 bg-red-500 mx-auto mb-4 rounded-full"></div>
          <p className="text-lg md:text-xl text-gray-300" style={f1FontStyleLight}>AI-powered predictions with track-specific calibration</p>
        </div>

        {/* Enhanced Race Selector with Glassmorphism */}
        {availableRaces.length > 0 && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center space-x-4 backdrop-blur-md bg-black/30 rounded-xl p-4 border border-white/20 shadow-2xl shadow-black/50">
              <span className="text-gray-300 font-medium">Select Race:</span>
              <div className="relative">
                <select
                  value={currentRace?.id || ''}
                  onChange={(e) => {
                    const selectedRace = availableRaces.find(race => race.id === e.target.value);
                    if (selectedRace) {
                      handleRaceChange(selectedRace.id);
                    }
                  }}
                  className="appearance-none pr-8 backdrop-blur-sm bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200 hover:border-white/40"
                  style={{ direction: 'ltr' }}
                >
                  {availableRaces.map((race) => (
                    <option key={race.id} value={race.id} className="bg-gray-900 text-white">
                      {race.name}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        )}



        {error && (
          <GlassWrapper className="p-8 mb-12 text-center bg-black/70 border-white/10">
            <h2 className="text-3xl mb-4 text-red-400" style={f1FontStyle}>ERROR LOADING PREDICTIONS</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="text-sm text-gray-400 mb-4">
              <p>This could be due to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Backend services not running</li>
                <li>Network connectivity issues</li>
                <li>Data service temporarily unavailable</li>
              </ul>
            </div>
            <button 
              onClick={() => loadPredictions(currentRace)}
              className="glass-card bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-xl transition-all transform hover:scale-105 hover:bg-white/5"
              style={f1FontStyle}
            >
              RETRY
            </button>
          </GlassWrapper>
        )}



        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading predictions...</p>
          </div>
        ) : prediction ? (
          <div className="space-y-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(() => {
                // Use static circuit features that don't change with race selection
                const circuitFeatures = staticCircuitFeatures?.[currentRace.name] || {
                  track: circuitInfo.name,
                  number_of_laps: circuitInfo.laps,
                  circuit_length_km: circuitInfo.length,
                  features: [
                    'DRS Zones: 2',
                    'Tire wear: Medium',
                    'Banking: None',
                    'Top speed: 320 km/h'
                  ]
                };
                
                return (
                  <TrackFeatureCard 
                    raceName={currentRace.name} 
                    circuitName={circuitFeatures.track} 
                    laps={circuitFeatures.number_of_laps} 
                    lengthKm={circuitFeatures.circuit_length_km} 
                    features={circuitFeatures.features} 
                  />
                );
              })()}
              {prediction.top3 && prediction.top3.length >= 3 ? (
                <PodiumSection 
                  drivers={prediction.top3 as any} 
                  customDrivers={customPrediction.length > 0 ? customPrediction.slice(0, 3) : undefined}
                  comparisonMode={comparisonMode}
                  title={comparisonMode === 'compare' ? 'AI vs CUSTOM PODIUM' : 'PREDICTED PODIUM'}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">Loading podium predictions...</p>
                </div>
              )}
            </div>

            {prediction.weatherUsed && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {customWeather ? (
                  <WeatherPanel customWeather={customWeather} onWeatherChange={handleWeatherChange} isUpdating={weatherUpdating} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading weather data...</p>
                  </div>
                )}
                {controlValues ? (
                  <CustomControls 
                    values={controlValues} 
                    onChange={setControlValues} 
                    onGenerate={() => generateWeatherBasedPredictions(customWeather)} 
                    isGenerating={weatherUpdating}
                    comparisonMode={comparisonMode}
                    onComparisonModeChange={setComparisonMode}
                    hasCustomPredictions={customPrediction.length > 0}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Loading controls...</p>
                  </div>
                )}
              </div>
            )}

            {/* Complete Driver Predictions - Moved below weather cards */}
            {prediction.all ? (
              <DriverList 
                drivers={comparisonMode === 'custom' && customPrediction.length > 0 ? customPrediction as any : prediction.all as any} 
                aiDrivers={prediction.all as any} 
                customDrivers={customPrediction as any} 
                enableCompareToggle={customPrediction.length > 0}
                comparisonMode={comparisonMode}
                onComparisonModeChange={setComparisonMode}
              />
            ) : (
              <GlassWrapper className="p-8 mb-12">
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading driver predictions...</p>
                </div>
              </GlassWrapper>
            )}



            <GlassWrapper className="p-8 mb-12">
              {modelStats ? (
                <ModelStatistics stats={modelStats} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading model statistics...</p>
                </div>
              )}
            </GlassWrapper>

            {/* Past Race Results Card */}
            <PastRaceResultsCard className="mb-12" />

          </div>
        ) : (
          <GlassWrapper className="p-8 text-center">
            <h2 className="text-3xl mb-4" style={f1FontStyle}>NO PREDICTIONS AVAILABLE</h2>
            <p className="text-gray-300">Unable to load predictions for this race. Please try again later.</p>
          </GlassWrapper>
        )}

        {/* Zone Features at bottom - reduced spacing */}
        <div className="mt-8">
          <ZoneFeatures />
        </div>
      </div>
    </div>
  );
};

export default PredictPage;