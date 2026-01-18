import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import RaceCard from '../components/schedule/RaceCard';
import RaceDetailView from '../components/schedule/RaceDetailView';
import { RaceCardSkeleton } from '../components/common/SkeletonLoaders';
import PageContainer from '../components/layout/PageContainer';

type RaceSession = { date: string | null; time: string | null };
type RaceItem = {
  round: number;
  raceName: string;
  circuitName: string;
  country: string;
  city: string;
  date: string;
  time: string;
  fp1: RaceSession;
  fp2: RaceSession;
  fp3: RaceSession;
  sprintQualifying: RaceSession;
  sprint: RaceSession;
  qualifying: RaceSession;
  status: 'upcoming' | 'live' | 'completed';
  startISO?: string;
  id: string;
};

interface SchedulePageProps {
}

export default function SchedulePage({ }: SchedulePageProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const { data: apiRaces, isLoading: apiLoading, error: apiError } = useRaces(selectedYear);

  const [races, setRaces] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRace, setSelectedRace] = useState<RaceItem | null>(null);

  useEffect(() => {
    if (apiLoading) {
      setLoading(true);
      return;
    }
    if (apiError) {
      setError(apiError.message);
      setLoading(false);
      return;
    }

    const mappedRaces: RaceItem[] = (apiRaces || []).map((r: ApiRace) => {
      const startISO = `${r.race_date}T${r.time || '00:00'}:00Z`;
      return {
        round: r.round,
        raceName: r.name,
        circuitName: r.circuit,
        country: r.country,
        city: r.city,
        date: r.race_date,
        time: r.time ? r.time.substring(0, 5) : 'TBD',
        fp1: { date: r.fp1_time?.split('T')[0] || null, time: r.fp1_time?.split('T')[1]?.substring(0, 5) || null },
        fp2: { date: r.fp2_time?.split('T')[0] || null, time: r.fp2_time?.split('T')[1]?.substring(0, 5) || null },
        fp3: { date: r.fp3_time?.split('T')[0] || null, time: r.fp3_time?.split('T')[1]?.substring(0, 5) || null },
        sprintQualifying: { date: null, time: null },
        sprint: { date: r.sprint_time?.split('T')[0] || null, time: r.sprint_time?.split('T')[1]?.substring(0, 5) || null },
        qualifying: { date: r.qualifying_time?.split('T')[0] || null, time: r.qualifying_time?.split('T')[1]?.substring(0, 5) || null },
        status: getRaceStatusUTC(startISO),
        startISO: startISO,
        id: r.id
      };
    });

    setRaces(mappedRaces);
    setLoading(false);
  }, [apiRaces, apiLoading, apiError]);

  const getRaceStatusUTC = (startISO: string) => {
    const raceDateTime = new Date(startISO);
    const now = new Date();
    const diff = raceDateTime.getTime() - now.getTime();
    if (diff > 2 * 60 * 60 * 1000) return 'upcoming';
    else if (diff > -3 * 60 * 60 * 1000) return 'live';
    else return 'completed';
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Australia': '🇦🇺', 'China': '🇨🇳', 'Japan': '🇯🇵', 'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦',
      'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨', 'Spain': '🇪🇸', 'Canada': '🇨🇦',
      'Austria': '🇦🇹', 'United Kingdom': '🇬🇧', 'Belgium': '🇧🇪', 'Hungary': '🇭🇺',
      'Netherlands': '🇳🇱', 'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'Mexico': '🇲🇽',
      'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪'
    };
    return flags[country] || '🏁';
  };

  const filteredRaces = races.filter((race) => {
    if (selectedFilter !== 'all' && race.status !== selectedFilter) return false;
    return true;
  });



  /* MAPPING LOGIC */
  const TRACK_IMAGE_MAP: Record<string, string> = {
    'Bahrain': 'f1_2024_bhr_outline.png',
    'Saudi Arabia': 'f1_2024_sau_outline.png',
    'Australia': 'f1_2024_aus_outline.png',
    'Japan': 'f1_2024_jap_outline.png',
    'China': 'f1_2024_chn_outline.png',
    'USA': 'f1_2024_usa_outline.png', // Miami/Austin/Vegas need specific handling if names distinct
    'Miami': 'f1_2024_mia_outline.png',
    'Las Vegas': 'f1_2024_lve_outline.png',
    'Italy': 'f1_2024_ita_outline.png', // Imola/Monza
    'Monaco': 'f1_2024_mco_outline.png',
    'Spain': 'f1_2024_spn_outline.png',
    'Canada': 'f1_2024_can_outline.png',
    'Austria': 'f1_2024_aut_outline.png',
    'United Kingdom': 'f1_2024_bel_outline.png',
    'Hungary': 'f1_2024_hun_outline.png',
    'Belgium': 'f1_2024_bel_outline.png',
    'Netherlands': 'f1_2024_nld_outline.png',
    'Azerbaijan': 'f1_2024_aze_outline.png',
    'Singapore': 'f1_2024_sgp_outline.png',
    'Mexico': 'f1_2024_mex_outline.png',
    'Brazil': 'f1_2024_bra_outline.png',
    'Qatar': 'f1_2024_qat_outline.png',
    'UAE': 'f1_2024_abu_outline.png'
  };

  const getTrackImage = (race: RaceItem) => {
    // Specific overrides for USA/Italy multiple tracks
    if (race.city?.includes('Miami')) return '/circuits/f1_2024_mia_outline.png';
    if (race.city?.includes('Las Vegas')) return '/circuits/f1_2024_lve_outline.png';
    if (race.circuitName?.includes('Imola')) return '/circuits/f1_2024_ero_outline.png';

    const normalizedCountry = race.country.trim();
    const filename = TRACK_IMAGE_MAP[normalizedCountry];
    return filename ? `/circuits/${filename}` : null;
  };

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <header className="border-l-4 border-[#E10600] pl-6 py-2">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-4 h-4 text-[#E10600]" />
            <span className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase">Season Calendar</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            {selectedYear} <span className="text-[#E10600]">Schedule</span>
          </h1>
        </header>

        <div className="flex items-center bg-slateDark/40 border border-slateMid/20 rounded-xl p-1">
          {[2025, 2026].map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${selectedYear === year ? 'bg-[#E10600] text-white shadow-lg' : 'text-gray-500 hover:text-white'
                }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'upcoming', 'live', 'completed'].map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter as any)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedFilter === filter
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Race Layout Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <RaceCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="glass-card py-20 text-center border-red-500/20">
          <p className="text-red-400 font-mono text-sm uppercase tracking-widest mb-4">Calibration Error</p>
          <p className="text-gray-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Logic to split Next vs Upcoming */}
          {(() => {
            const upcomingRaces = filteredRaces.filter(r => r.status !== 'completed');
            const nextRace = upcomingRaces[0];
            const otherUpcoming = upcomingRaces.slice(1);
            const completedRaces = filteredRaces.filter(r => r.status === 'completed');

            return (
              <>
                {/* NEXT RACE HERO Section */}
                {selectedFilter !== 'completed' && nextRace && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-wider mb-6">Next</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <RaceCard
                        race={nextRace}
                        trackImage={getTrackImage(nextRace)}
                        onViewDetails={(r) => setSelectedRace(r)}
                        isHero={true}
                      />
                    </div>
                  </div>
                )}

                {/* UPCOMING GRID Section */}
                {selectedFilter !== 'completed' && otherUpcoming.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-wider mb-6">Upcoming</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-x-4 md:gap-y-6">
                      {otherUpcoming.map(race => (
                        <RaceCard
                          key={race.id}
                          race={race}
                          trackImage={getTrackImage(race)}
                          onViewDetails={(r) => setSelectedRace(r)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* COMPLETED/PAST RACES (if filter is All or Completed) */}
                {(selectedFilter === 'all' || selectedFilter === 'completed') && completedRaces.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-wider mb-6">Completed</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {completedRaces.map(race => (
                        <RaceCard
                          key={race.id}
                          race={race}
                          trackImage={getTrackImage(race)}
                          onViewDetails={(r) => setSelectedRace(r)}
                          compact={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {filteredRaces.length === 0 && !loading && !error && (
        <div className="text-center py-20 glass-card">
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">No Sessions Found for this Range</p>
        </div>
      )}

      {/* Detailed Track Intel View (Drill-down) */}
      <AnimatePresence>
        {selectedRace && (
          <RaceDetailView
            race={selectedRace}
            getCountryFlag={getCountryFlag}
            onClose={() => setSelectedRace(null)}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}