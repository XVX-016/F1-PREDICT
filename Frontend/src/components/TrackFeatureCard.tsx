import React from 'react';
import GlassWrapper from './GlassWrapper';
import CircuitFeaturesService from '../services/CircuitFeaturesService';

interface TrackFeatureCardProps {
  raceName: string;
  circuitName: string;
  laps: number;
  lengthKm: number;
  features: string[];
}

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

const toCircuitImagePath = (raceName: string): string => {
  // Match both abbreviated GP names and full Grand Prix names
  const raceNameLower = raceName.toLowerCase();
  
  // Handle Chinese GP first with explicit matching
  if (raceNameLower === 'chinese gp' || raceNameLower.includes('china') || raceNameLower.includes('shanghai') || raceNameLower.includes('chn')) {
    return '/f1_tracks/China_Shanghai_International.png';
  }
  
  // Handle abbreviated names from sample data
  if (raceNameLower.includes('bahrain') || raceNameLower.includes('bhr')) return '/f1_tracks/Bahrain_Bahrain_International.png';
  if (raceNameLower.includes('saudi') || raceNameLower.includes('jeddah') || raceNameLower.includes('sau')) return '/f1_tracks/Saudi_Arabia_Jeddah_Corniche.png';
  if (raceNameLower.includes('australia') || raceNameLower.includes('melbourne') || raceNameLower.includes('aus')) return '/f1_tracks/Australia_Albert_Park.png';
  if (raceNameLower.includes('japan') || raceNameLower.includes('suzuka') || raceNameLower.includes('jpn')) return '/f1_tracks/Japan_Suzuka.png';
  if (raceNameLower.includes('miami') || raceNameLower.includes('mia')) return '/f1_tracks/USA_Miami_International.png';
  if (raceNameLower.includes('emilia') || raceNameLower.includes('imola') || raceNameLower.includes('imo')) return '/f1_tracks/Italy_Imola_Internazionale_Enzo_Dino_Ferrari.png';
  if (raceNameLower.includes('monaco') || raceNameLower.includes('mon')) return '/f1_tracks/Monaco_Circuit_de_Monaco.png';
  if (raceNameLower.includes('canada') || raceNameLower.includes('montreal') || raceNameLower.includes('can')) return '/f1_tracks/Canada_Gilles_Villeneuve.png';
  if (raceNameLower.includes('spain') || raceNameLower.includes('barcelona') || raceNameLower.includes('spn')) return '/f1_tracks/Spain_Barcelona_Catalunya.png';
  if (raceNameLower.includes('austria') || raceNameLower.includes('red bull ring') || raceNameLower.includes('aut')) return '/f1_tracks/Austria_Red_Bull_Ring.png';
  if (raceNameLower.includes('british') || raceNameLower.includes('silverstone') || raceNameLower.includes('united kingdom') || raceNameLower.includes('great britain') || raceNameLower.includes('gbr')) return '/f1_tracks/Great_Britain_Silverstone.png';
  if (raceNameLower.includes('hungary') || raceNameLower.includes('hungaroring') || raceNameLower.includes('hun')) return '/f1_tracks/Hungary_Hungaroring.png';
  if (raceNameLower.includes('belgium') || raceNameLower.includes('spa') || raceNameLower.includes('bel')) return '/f1_tracks/Belgium_Spa_Francorchamps.png';
  if (raceNameLower.includes('netherlands') || raceNameLower.includes('dutch') || raceNameLower.includes('zandvoort') || raceNameLower.includes('nld')) return '/f1_tracks/Netherlands_Zandvoort.png';
  if ((raceNameLower.includes('italy') && raceNameLower.includes('monza')) || raceNameLower.includes('ita')) return '/f1_tracks/Italy_Monza.png';
  if (raceNameLower.includes('azerbaijan') || raceNameLower.includes('baku') || raceNameLower.includes('aze')) return '/f1_tracks/Azerbaijan_Baku.png';
  if (raceNameLower.includes('singapore') || raceNameLower.includes('sgp')) return '/f1_tracks/Singapore_Marina_Bay_Street.png';
  if (raceNameLower.includes('united states') || raceNameLower.includes('austin') || raceNameLower.includes('usa')) return '/f1_tracks/USA_Circuit_of_the_Americas.png';
  if (raceNameLower.includes('mexico') || raceNameLower.includes('mex')) return '/f1_tracks/Mexico_Hermanos_Rodriguez.png';
  if (raceNameLower.includes('são paulo') || raceNameLower.includes('brazil') || raceNameLower.includes('interlagos') || raceNameLower.includes('bra')) return '/f1_tracks/Brazil_Jose_Carlos_Pace.png';
  if (raceNameLower.includes('las vegas') || raceNameLower.includes('lve')) return '/f1_tracks/USA_Las_Vegas_Strip.png';
  if (raceNameLower.includes('qatar') || raceNameLower.includes('lusail') || raceNameLower.includes('qat')) return '/f1_tracks/Qatar_Lusail_International.png';
  if (raceNameLower.includes('abu dhabi') || raceNameLower.includes('yas') || raceNameLower.includes('uae') || raceNameLower.includes('abu')) return '/f1_tracks/UAE_Abu_Dhabi_Yas_Marina.png';
  
  // Fallback to simplified outline if specific not found
  return '/circuits/f1_2024_aus_outline.png';
};

export default function TrackFeatureCard({ raceName, circuitName, laps, lengthKm, features }: TrackFeatureCardProps) {
  const [trackData, setTrackData] = React.useState<TrackFeatures | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showImageModal, setShowImageModal] = React.useState(false);
  
  console.log(`🔍 TrackFeatureCard: Props received - raceName: ${raceName}, circuitName: ${circuitName}`);

  React.useEffect(() => {
    const loadTrackData = async () => {
      setIsLoading(true);
      console.log(`🔍 TrackFeatureCard: Loading track data for race: ${raceName}`);
      const service = CircuitFeaturesService.getInstance();
      const data = service.findByRaceName(raceName);
      console.log(`🔍 TrackFeatureCard: Track data result:`, data);
      setTrackData(data);
      setIsLoading(false);
    };

    loadTrackData();
  }, [raceName]);

  return (
    <>
      <GlassWrapper className="p-5 mb-6 text-center h-full">
        {/* Header */}
        <div className="flex items-center justify-center space-x-3 mb-5">
          <div className="p-2 bg-gray-800/20 rounded-lg border border-gray-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 className="text-2xl" style={{ fontFamily: '"Orbitron", "Formula1", "Arial Black", sans-serif' }}>
            TRACK FEATURES
          </h2>
        </div>

        {/* Track image - clickable for detailed view */}
        <div className="mb-4">
          <div className="w-full max-w-lg mx-auto bg-black rounded-lg overflow-hidden transition-transform duration-200 relative group">
            <img
              src={encodeURI(toCircuitImagePath(raceName))}
              alt={circuitName}
              className="w-full h-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
              style={{ maxHeight: '280px' }}
              onError={(e) => { 
                console.warn(`Failed to load track image for ${raceName}: ${toCircuitImagePath(raceName)}`);
                (e.target as HTMLImageElement).style.display = 'none'; 
              }}
              onClick={() => setShowImageModal(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black/50 rounded-lg px-3 py-1 text-white text-sm">
                Click to enlarge
              </div>
            </div>
          </div>
          <h3 className="text-base font-bold mt-2 text-white">{raceName}</h3>
        </div>

        {/* Notable Features - reduced size */}
        {trackData && (
          <div className="mb-4 p-2 bg-black/20 rounded-lg border border-white/10 max-w-md mx-auto">
            <div className="text-xs text-gray-400 mb-1">NOTABLE FEATURES</div>
            <div className="text-white text-xs leading-relaxed">
              {trackData.features.notable_layout}
            </div>
          </div>
        )}
        
        {/* Track features - smaller 4x4 grid layout */}
        <div className="max-w-xl mx-auto">
          {isLoading ? (
            <div className="text-sm text-gray-400 text-center">Loading track data...</div>
          ) : trackData ? (
            <div className="grid grid-cols-4 gap-2">
              {/* Row 1 */}
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">LAPS</div>
                <div className="text-base font-bold text-white">{trackData.number_of_laps}</div>
              </div>
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">LENGTH</div>
                <div className="text-base font-bold text-white">{trackData.circuit_length_km.toFixed(3)} km</div>
              </div>
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">DISTANCE</div>
                <div className="text-base font-bold text-white">{trackData.race_distance_km.toFixed(0)} km</div>
              </div>
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">FIRST GP</div>
                <div className="text-base font-bold text-white">{trackData.first_grand_prix}</div>
              </div>
              
              {/* Row 2 */}
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">CORNERS</div>
                <div className="text-base font-bold text-white">{trackData.features.corners}</div>
              </div>
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">DRS ZONES</div>
                <div className="text-base font-bold text-white">{trackData.features.drs_zones}</div>
              </div>
              
              {trackData.features.max_speed_kmh ? (
                <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">MAX SPEED</div>
                  <div className="text-sm font-bold text-white">{trackData.features.max_speed_kmh} km/h</div>
                </div>
              ) : (
                <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">TRACK TYPE</div>
                  <div className="text-sm font-bold text-white">Street Circuit</div>
                </div>
              )}
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">LAP RECORD</div>
                <div className="text-xs font-bold text-yellow-300">{trackData.lap_record.time}</div>
                <div className="text-xs text-yellow-400">
                  {trackData.lap_record.driver.split(' ')[0]} ({trackData.lap_record.year})
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">LAPS</div>
                <div className="text-base font-bold text-white">{laps}</div>
              </div>
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">LENGTH</div>
                <div className="text-base font-bold text-white">{lengthKm.toFixed(3)} km</div>
              </div>
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">FEATURES</div>
                <div className="text-xs text-white">
                  {features.slice(0, 2).map((f, index) => (
                    <div key={index} className="mb-1">• {f}</div>
                  ))}
                </div>
              </div>
              
              <div className="text-center p-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-xs text-gray-400 mb-1">TRACK</div>
                <div className="text-xs text-white">{circuitName}</div>
              </div>
            </div>
          )}
        </div>
      </GlassWrapper>

      {/* Image Modal for detailed view */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-lg overflow-hidden">
            <button 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200 z-10"
              onClick={() => setShowImageModal(false)}
            >
              ✕
            </button>
            <img
              src={encodeURI(toCircuitImagePath(raceName))}
              alt={`${circuitName} - Detailed View`}
              className="w-full h-auto object-contain max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
              {raceName} - {circuitName}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
