// no react import needed for TSX with React 17+
import { Flag, Ruler } from 'lucide-react';

interface CircuitDetailsProps {
  raceName: string;
  circuitName: string;
  laps: number;
  length: number;
  prediction: string;
  keyFactors: string[];
  className?: string;
}

export default function CircuitDetails({ 
  raceName, 
  circuitName, 
  laps, 
  length, 
  prediction, 
  keyFactors, 
  className = '' 
}: CircuitDetailsProps) {
  // Map race names to circuit image files
  const getCircuitImage = (raceName: string): string => {
    const circuitMap: Record<string, string> = {
      'Bahrain Grand Prix': 'f1_2024_bhr_outline.png',
      'Saudi Arabian Grand Prix': 'f1_2024_sau_outline.png',
      'Australian Grand Prix': 'f1_2024_aus_outline.png',
      'Japanese Grand Prix': 'f1_2024_jap_outline.png',
      'Chinese Grand Prix': 'f1_2024_chn_outline.png',
      'Miami Grand Prix': 'f1_2024_mia_outline.png',
      'Emilia-Romagna Grand Prix': 'f1_2024_ero_outline.png',
      'Monaco Grand Prix': 'f1_2024_mco_outline.png',
      'Canadian Grand Prix': 'f1_2024_can_outline.png',
      'Spanish Grand Prix': 'f1_2024_spn_outline.png',
      'Austrian Grand Prix': 'f1_2024_aut_outline.png',
      'British Grand Prix': 'f1_2024_gbr_outline.png',
      'Hungarian Grand Prix': 'f1_2024_hun_outline.png',
      'Belgian Grand Prix': 'f1_2024_bel_outline.png',
      'Dutch Grand Prix': 'f1_2024_nld_outline.png',
      'Italian Grand Prix': 'f1_2024_ita_outline.png',
      'Azerbaijan Grand Prix': 'f1_2024_aze_outline.png',
      'Singapore Grand Prix': 'f1_2024_sgp_outline.png',
      'United States Grand Prix': 'f1_2024_usa_outline.png',
      'Mexico City Grand Prix': 'f1_2024_mex_outline.png',
      'São Paulo Grand Prix': 'f1_2024_bra_outline.png',
      'Las Vegas Grand Prix': 'f1_2024_lve_outline.png',
      'Qatar Grand Prix': 'f1_2024_qat_outline.png',
      'Abu Dhabi Grand Prix': 'f1_2024_abu_outline.png'
    };
    
    return circuitMap[raceName] || 'f1_2024_bhr_outline.png';
  };

  const circuitImage = getCircuitImage(raceName);

  // Simple overlay annotations for DRS zones, speed traps, sectors, etc.
  type Overlay = {
    type: 'drs' | 'speed' | 'sector';
    left: string; // percentage string e.g. '20%'
    top: string;  // percentage string
    width: string; // percentage string
    height?: string; // px string for line thickness
    label?: string;
  };

  const getOverlays = (raceName: string): Overlay[] => {
    const key = raceName.toLowerCase();
    // Note: positions are approximate and tuned to the base image aspect ratio used here
    if (key.includes('bahrain')) {
      return [
        { type: 'drs', left: '12%', top: '60%', width: '55%', height: '6px', label: 'DRS Detection Zone 1' },
        { type: 'drs', left: '40%', top: '28%', width: '35%', height: '6px', label: 'DRS Detection Zone 2' },
        { type: 'drs', left: '68%', top: '62%', width: '18%', height: '6px', label: 'DRS Detection Zone 3' },
        { type: 'speed', left: '30%', top: '70%', width: '18%', height: '6px', label: 'Speed Trap' }
      ];
    }
    if (key.includes('dutch') || key.includes('zandvoort') || key.includes('netherlands')) {
      return [
        { type: 'drs', left: '20%', top: '50%', width: '28%', height: '6px', label: 'DRS Zone' },
        { type: 'speed', left: '55%', top: '72%', width: '22%', height: '6px', label: 'High Speed' }
      ];
    }
    if (key.includes('australia') || key.includes('melbourne')) {
      return [
        { type: 'drs', left: '18%', top: '42%', width: '30%', height: '6px', label: 'DRS Zone' },
        { type: 'drs', left: '60%', top: '58%', width: '20%', height: '6px', label: 'DRS Zone' },
        { type: 'speed', left: '36%', top: '68%', width: '18%', height: '6px', label: 'Speed Trap' }
      ];
    }
    return [];
  };

  const overlays = getOverlays(raceName);

  return (
    <div className={`bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 ${className}`}>
      <h3 className="text-2xl font-bold text-white mb-4 text-center">Track Features</h3>
      
      {/* Circuit Map */}
      <div className="relative mb-6">
        <div className="bg-black/80 rounded-2xl p-4 relative overflow-hidden border border-white/10">
          <img 
            src={`/circuits/${circuitImage}`} 
            alt={`${circuitName} circuit layout`}
            className="w-full max-w-[600px] h-[280px] object-contain mx-auto opacity-95 select-none"
            decoding="async"
            loading="eager"
          />
          {/* Overlays for DRS / Speed zones */}
          {overlays.map((ov, i) => (
            <div key={i}
              className={`absolute ${ov.type === 'drs' ? 'bg-green-500/70' : ov.type === 'speed' ? 'bg-pink-500/70' : 'bg-blue-500/60'}`}
              style={{ left: ov.left, top: ov.top, width: ov.width, height: ov.height || '6px', borderRadius: '6px' }}
            >
              {ov.label && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap ">
                  <span className={`px-2 py-1 rounded ${ov.type === 'drs' ? 'bg-green-700/80' : ov.type === 'speed' ? 'bg-pink-700/80' : 'bg-blue-700/80'} text-white`}>{ov.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Circuit Information */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-white mb-3">{circuitName}</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-600" />
            <span className="text-white font-semibold">{laps} Laps</span>
          </div>
          <div className="flex items-center space-x-2">
            <Ruler className="w-5 h-5 text-red-600" />
            <span className="text-white font-semibold">{length} km</span>
          </div>
        </div>
        
        {/* Prediction Summary */}
        <div className="bg-black/60 border border-white/10 rounded-lg p-4 mb-4">
          <p className="text-gray-200 text-sm leading-relaxed">{prediction}</p>
        </div>
        
        {/* Key Factors */}
        <div>
          <h5 className="text-lg font-bold text-white mb-3">Key Factors</h5>
          <div className="flex flex-wrap gap-2">
            {keyFactors.map((factor, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full text-sm font-medium text-white bg-red-700/70 border border-red-400/30"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

