import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import RaceCard from '../components/schedule/RaceCard';
import NextRaceHero from '../components/schedule/NextRaceHero';
import RaceDetailView from '../components/schedule/RaceDetailView';
import { RaceCardSkeleton } from '../components/common/SkeletonLoaders';
import PageContainer from '../components/layout/PageContainer';
import { SEASON_2026_SCHEDULE } from '../data/season2026';


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
  trackImg?: string;
  bannerImg?: string;
  circuitMap?: string;
};

interface SchedulePageProps {
}

export default function SchedulePage({ }: SchedulePageProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const { data: apiRaces, isLoading: apiLoading, error: apiError } = useRaces(selectedYear);

  /* import moved to top */

  const [races, setRaces] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRace, setSelectedRace] = useState<RaceItem | null>(null);

  useEffect(() => {
    // 1. Static Loading for 2026 (Offline/Verified Mode)
    if (selectedYear === 2026) {
      setLoading(true); // Short aesthetic delay could be added if desired, but instant is better
      setError('');

      try {
        const staticRaces: RaceItem[] = SEASON_2026_SCHEDULE.map(r => {
          const startISO = `${r.date}T${r.time.replace('Z', '')}`; // Simplified ISO construction
          return {
            round: r.round,
            raceName: r.raceName,
            circuitName: r.circuit,
            country: r.country,
            city: r.city,
            date: r.date,
            time: r.time.substring(0, 5),
            fp1: { date: null, time: null },
            fp2: { date: null, time: null },
            fp3: { date: null, time: null },
            sprintQualifying: { date: null, time: null },
            sprint: { date: null, time: null },
            qualifying: { date: null, time: null },
            status: 'upcoming', // All 2026 races are future/upcoming
            startISO: startISO,
            id: `2026-${r.round}`,
            trackImg: r.trackImg,
            bannerImg: r.bannerImg,
            circuitMap: (r as any).circuitMap
          };
        });
        setRaces(staticRaces);
        setLoading(false);
      } catch (e) {
        console.error("Failed to load static 2026 data", e);
        setError("Failed to load 2026 Season Data");
        setLoading(false);
      }
      return;
    }

    // 2. Legacy API Loading for other years (e.g. 2025)
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
  }, [apiRaces, apiLoading, apiError, selectedYear]);

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

  // Advanced Layout Logic
  const upcomingRacesFull = races.filter(r => r.status === 'upcoming' || r.status === 'live');
  const nextRace = upcomingRacesFull.length > 0 ? upcomingRacesFull[0] : null;

  const isCurrentSeason = selectedYear === 2026;

  // Only exclude the Next Race (shown in the Hero) from the grid
  const idsInFeature = new Set<string>();
  if (isCurrentSeason && nextRace) idsInFeature.add(nextRace.id);

  // Decide what to show in the grid
  const gridRaces = filteredRaces.filter(r => !idsInFeature.has(r.id));

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <header className="border-l-4 border-[#E10600] pl-6 py-2">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-4 h-4 text-[#E10600]" />
            <span className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase">Season Calendar</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            2026 <span className="text-[#E10600]">Schedule</span>
          </h1>
        </header>
      </div>

      {/* --- Featured Section (Next Race) --- */}
      {/* Only show feature section if it's the 2026 season AND we are filtered to see upcoming/all */}
      {isCurrentSeason && !loading && !error && (selectedFilter === 'all' || selectedFilter === 'upcoming') && nextRace && (
        <div className="mb-20 space-y-12">
          <NextRaceHero
            race={nextRace}
            getCountryFlag={getCountryFlag}
            onViewDetails={(r) => setSelectedRace(r)}
          />
        </div>
      )}


      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
          {isCurrentSeason ? `${selectedYear} Race Calendar` : `Archive: ${selectedYear} Season`}
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
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
      </div>

      {/* Race List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => <RaceCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="glass-card py-20 text-center border-red-500/20">
          <p className="text-red-400 font-mono text-sm uppercase tracking-widest mb-4">Calibration Error</p>
          <p className="text-gray-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gridRaces.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              getCountryFlag={getCountryFlag}
              onViewDetails={(r) => setSelectedRace(r)}
              isNext={false} // Grid items are never 'Next' if Next is in Hero
            />
          ))}
        </div>
      )}

      {gridRaces.length === 0 && !loading && !error && (
        <div className="text-center py-20 glass-card">
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">No Sessions Found in Calendar Grid</p>
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