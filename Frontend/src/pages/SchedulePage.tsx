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

  const groupedRaces = filteredRaces.reduce((acc: Record<string, RaceItem[]>, race) => {
    const month = new Date(race.date).toLocaleString('en-US', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(race);
    return acc;
  }, {});

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

      {/* Race List Container */}
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
        <div className="space-y-16">
          {Object.entries(groupedRaces).map(([month, monthRaces]) => (
            <div key={month} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-white uppercase italic tracking-wider">{month}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
              <div className="space-y-4">
                {monthRaces.map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    getCountryFlag={getCountryFlag}
                    onViewDetails={(r) => setSelectedRace(r)}
                  />
                ))}
              </div>
            </div>
          ))}
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