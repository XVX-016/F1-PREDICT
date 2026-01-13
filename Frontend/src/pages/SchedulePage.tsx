import { useState, useEffect } from 'react';
import { Calendar, Clock, Flag, Bell, Target, MapPin, Trophy, X } from 'lucide-react';
import { useRaces, Race as ApiRace } from '../hooks/useApi';
import NextRaceHero from '../components/schedule/NextRaceHero';
import RaceCard from '../components/schedule/RaceCard';
import { NextRaceHeroSkeleton, RaceCardSkeleton } from '../components/common/SkeletonLoaders';

// Removed CALENDAR import and static definition

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
  startISO?: string; // Add optional if we use it
};

interface SchedulePageProps {
  onPageChange: (page: string, raceData?: any) => void;
}

export default function SchedulePage({ onPageChange }: SchedulePageProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [selectedMonth, setSelectedMonth] = useState<'all' | string>('all');

  // Use API hook - derive year from current date
  const currentYear = new Date().getFullYear();
  const { data: apiRaces, loading: apiLoading, error: apiError } = useRaces(currentYear);

  const [races, setRaces] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRace, setSelectedRace] = useState<RaceItem | null>(null);
  const [showRaceModal, setShowRaceModal] = useState(false);
  const [raceResults, setRaceResults] = useState<any[] | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (apiLoading) {
      setLoading(true);
      return;
    }
    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    // Map API races to UI model and calculate status
    const mappedRaces: RaceItem[] = apiRaces.map((r: ApiRace) => {
      const startISO = `${r.race_date}T${r.time || '00:00'}:00Z`; // Ensure proper format
      return {
        round: r.round,
        raceName: r.name,
        circuitName: r.circuit,
        country: r.country,
        city: r.city,
        date: r.race_date,
        time: r.time ? r.time.substring(0, 5) : 'TBD', // HH:mm
        fp1: { date: r.fp1_time ? r.fp1_time.split('T')[0] : null, time: r.fp1_time ? r.fp1_time.split('T')[1].substring(0, 5) : null },
        fp2: { date: r.fp2_time ? r.fp2_time.split('T')[0] : null, time: r.fp2_time ? r.fp2_time.split('T')[1].substring(0, 5) : null },
        fp3: { date: r.fp3_time ? r.fp3_time.split('T')[0] : null, time: r.fp3_time ? r.fp3_time.split('T')[1].substring(0, 5) : null },
        sprintQualifying: { date: null, time: null }, // TODO: Add to API if needed
        sprint: { date: r.sprint_time ? r.sprint_time.split('T')[0] : null, time: r.sprint_time ? r.sprint_time.split('T')[1].substring(0, 5) : null },
        qualifying: { date: r.qualifying_time ? r.qualifying_time.split('T')[0] : null, time: r.qualifying_time ? r.qualifying_time.split('T')[1].substring(0, 5) : null },
        status: getRaceStatusUTC(startISO),
        startISO: startISO
      };
    });

    setRaces(mappedRaces);
    setLoading(false);

  }, [apiRaces, apiLoading, apiError]);

  const getRaceStatusUTC = (startISO: string) => {
    const raceDateTime = new Date(startISO);
    const now = new Date();
    const diff = raceDateTime.getTime() - now.getTime();

    // If race is more than 2 hours in the future
    if (diff > 2 * 60 * 60 * 1000) {
      return 'upcoming';
    }
    // If race is within 2 hours (including during race)
    else if (diff > -3 * 60 * 60 * 1000) {
      return 'live';
    }
    // If race is more than 3 hours in the past
    else {
      return 'completed';
    }
  };

  const getStatusColor = (status: 'upcoming' | 'live' | 'completed' | string) => {
    switch (status) {
      case 'completed': return 'bg-gray-600 text-gray-300';
      case 'live': return 'bg-red-600 text-white animate-pulse';
      case 'upcoming': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-gray-300';
    }
  };

  const getCountdown = (dateString: string) => {
    const raceDate = new Date(dateString);
    const now = new Date();
    const diff = raceDate.getTime() - now.getTime();
    if (diff < 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return 'Soon';
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Australia': '🇦🇺',
      'China': '🇨🇳',
      'Japan': '🇯🇵',
      'Bahrain': '🇧🇭',
      'Saudi Arabia': '🇸🇦',
      'USA': '🇺🇸',
      'Italy': '🇮🇹',
      'Monaco': '🇲🇨',
      'Spain': '🇪🇸',
      'Canada': '🇨🇦',
      'Austria': '🇦🇹',
      'United Kingdom': '🇬🇧',
      'Belgium': '🇧🇪',
      'Hungary': '🇭🇺',
      'Netherlands': '🇳🇱',
      'Azerbaijan': '🇦🇿',
      'Singapore': '🇸🇬',
      'Mexico': '🇲🇽',
      'Brazil': '🇧🇷',
      'Qatar': '🇶🇦',
      'UAE': '🇦🇪'
    };
    return flags[country] || '🏁';
  };

  const getDriverNationalityFlag = (driverName: string) => {
    const nationalityMap: Record<string, string> = {
      'Max Verstappen': '🇳🇱',
      'Lewis Hamilton': '🇬🇧',
      'Charles Leclerc': '🇲🇨',
      'Lando Norris': '🇬🇧',
      'Carlos Sainz': '🇪🇸',
      'George Russell': '🇬🇧',
      'Fernando Alonso': '🇪🇸',
      'Oscar Piastri': '🇦🇺',
      'Lance Stroll': '🇨🇦',
      'Pierre Gasly': '🇫🇷',
      'Esteban Ocon': '🇫🇷',
      'Alexander Albon': '🇹🇭',
      'Yuki Tsunoda': '🇯🇵',
      'Valtteri Bottas': '🇫🇮',
      'Nico Hulkenberg': '🇩🇪',
      'Daniel Ricciardo': '🇦🇺',
      'Zhou Guanyu': '🇨🇳',
      'Kevin Magnussen': '🇩🇰',
      'Logan Sargeant': '🇺🇸',
      'Jack Doohan': '🇦🇺',
      'Andrea Kimi Antonelli': '🇮🇹',
      'Kimi Antonelli': '🇮🇹'
    };
    return nationalityMap[driverName] || '🏁';
  };

  const getDriverNationality = (driverName: string) => {
    const nationalityMap: Record<string, string> = {
      'Max Verstappen': 'Netherlands',
      'Lewis Hamilton': 'United Kingdom',
      'Charles Leclerc': 'Monaco',
      'Lando Norris': 'United Kingdom',
      'Carlos Sainz': 'Spain',
      'George Russell': 'United Kingdom',
      'Fernando Alonso': 'Spain',
      'Oscar Piastri': 'Australia',
      'Lance Stroll': 'Canada',
      'Pierre Gasly': 'France',
      'Esteban Ocon': 'France',
      'Alexander Albon': 'Thailand',
      'Yuki Tsunoda': 'Japan',
      'Valtteri Bottas': 'Finland',
      'Nico Hulkenberg': 'Germany',
      'Daniel Ricciardo': 'Australia',
      'Zhou Guanyu': 'China',
      'Kevin Magnussen': 'Denmark',
      'Logan Sargeant': 'United States',
      'Jack Doohan': 'Australia',
      'Andrea Kimi Antonelli': 'Italy',
      'Kimi Antonelli': 'Italy'
    };
    return nationalityMap[driverName] || 'Unknown';
  };

  const getRaceResults = async (raceName: string) => {
    // TODO: Fetch results from backend
    /* const aliases = [
      raceName,
      raceName.replace(/\bGP\b/, 'Grand Prix')
    ];
    for (const key of aliases) {
      const found = (F1_2025_RESULTS as any)[key];
      if (found) return found;
    } */
    return null;
  };

  const openRaceDetails = async (race: RaceItem) => {
    setSelectedRace(race);
    setShowRaceModal(true);
    setRaceResults(null);

    // Get real results for completed races
    if (race.status === 'completed') {
      setLoadingResults(true);
      try {
        const results = await getRaceResults(race.raceName);
        if (results && (results as any).length > 0) {
          setRaceResults(results as any);
        }
      } catch (error) {
        console.error('Error fetching race results:', error);
      } finally {
        setLoadingResults(false);
      }
    }
  };

  const closeRaceModal = () => {
    setShowRaceModal(false);
    setSelectedRace(null);
    setRaceResults(null);
  };

  const filteredRaces = races.filter((race) => {
    if (selectedFilter !== 'all' && race.status !== selectedFilter) return false;
    if (selectedMonth !== 'all') {
      const raceMonth = new Date(race.date).getMonth();
      if (parseInt(selectedMonth) !== raceMonth) return false;
    }
    return true;
  });

  // Grouping logic
  const groupedRaces = filteredRaces.reduce((acc: Record<string, RaceItem[]>, race) => {
    const month = new Date(race.date).toLocaleString('en-US', { month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(race);
    return acc;
  }, {});

  const renderPodiumResults = () => {
    if (loadingResults) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Loading race results...</div>
        </div>
      );
    }

    if (!raceResults || raceResults.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">No results available</div>
        </div>
      );
    }

    const podium = raceResults.slice(0, 3);
    const winner = podium[0];
    const totalLaps = winner?.laps || 58;

    return (
      <div className="space-y-4">
        {/* 1st Place */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-400/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">
                1
              </div>
              <div>
                <div className="font-bold text-yellow-400">Winner</div>
                <div className="text-sm text-gray-400">{winner?.driverName || 'Unknown'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-yellow-400">{winner?.time || 'N/A'}</div>
              <div className="text-sm text-gray-400">{totalLaps} laps</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{winner?.constructorName || 'Unknown Team'}</span>
            <span>•</span>
            <span>{getDriverNationalityFlag(winner?.driverName)} {getDriverNationality(winner?.driverName)}</span>
          </div>
        </div>

        {/* 2nd Place */}
        {podium[1] && (
          <div className="bg-gradient-to-r from-gray-600/20 to-gray-400/10 border border-gray-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center font-bold text-black">
                  2
                </div>
                <div>
                  <div className="font-bold text-gray-300">Second</div>
                  <div className="text-sm text-gray-400">{podium[1].driverName || 'Unknown'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-300">{podium[1].gap || 'N/A'}</div>
                <div className="text-sm text-gray-400">{totalLaps} laps</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{podium[1].constructorName || 'Unknown Team'}</span>
              <span>•</span>
              <span>{getDriverNationalityFlag(podium[1].driverName)} {getDriverNationality(podium[1].driverName)}</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {podium[2] && (
          <div className="bg-gradient-to-r from-orange-600/20 to-orange-400/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-bold text-black">
                  3
                </div>
                <div>
                  <div className="font-bold text-orange-400">Third</div>
                  <div className="text-sm text-gray-400">{podium[2].driverName || 'Unknown'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-400">{podium[2].gap || 'N/A'}</div>
                <div className="text-sm text-gray-400">{totalLaps} laps</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{podium[2].constructorName || 'Unknown Team'}</span>
              <span>•</span>
              <span>{getDriverNationalityFlag(podium[2].driverName)} {getDriverNationality(podium[2].driverName)}</span>
            </div>
          </div>
        )}

        {/* Race Stats */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Laps:</span>
              <span className="font-semibold">{totalLaps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fastest Lap:</span>
              <span className="font-semibold">
                {raceResults.find(r => r.fastestLap)?.driverName || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pole Position:</span>
              <span className="font-semibold">
                {raceResults.find(r => r.grid === 1)?.driverName || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Safety Cars:</span>
              <span className="font-semibold">
                {raceResults.some(r => r.status?.includes('Safety Car')) ? '1' : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white pt-24">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Calendar className="w-10 h-10 text-red-500" />
            Formula 1 Race Schedule
          </h1>
          <p className="text-gray-400 text-lg">Complete Formula 1 calendar with race times and predictions</p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Flag className="w-5 h-5 text-blue-500" />
              Filter by Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Races' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'live', label: 'Live' },
                { id: 'completed', label: 'Completed' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedFilter === filter.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              Filter by Month
            </h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Months</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
          </div>
        </div>

        {/* Race Calendar */}
        {loading ? (
          <div className="space-y-8">
            <NextRaceHeroSkeleton />
            <div className="grid gap-4">
              {[1, 2, 3].map(i => <RaceCardSkeleton key={i} />)}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-lg text-red-400 mb-4">{error}</div>
            <p className="text-gray-400">Unable to load race schedule. Retrying...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Next Race Hero - Always show first upcoming race */}
            {races.find(r => r.status === 'upcoming') && (() => {
              const nextRace = races.find(r => r.status === 'upcoming')!;
              return (
                <NextRaceHero
                  race={{
                    id: nextRace.round.toString(),
                    name: nextRace.raceName,
                    circuit: nextRace.circuitName,
                    country: nextRace.country,
                    startTime: nextRace.startISO || '',
                    status: 'upcoming',
                    predictionsCloseTime: nextRace.qualifying.date ? `${nextRace.qualifying.date}T${nextRace.qualifying.time || '00:00'}:00Z` : undefined
                  }}
                  onPredict={(raceId) => onPageChange('predict', { raceId })}
                  onViewDetails={(raceId) => {
                    const race = races.find(r => r.round.toString() === raceId);
                    if (race) openRaceDetails(race);
                  }}
                />
              );
            })()}

            {/* Grouped Races List */}
            <div className="space-y-12">
              {Object.entries(groupedRaces).map(([month, monthRaces]) => (
                <div key={month} className="space-y-6">
                  <h2 className="text-2xl font-black text-white flex items-center gap-4 px-2">
                    <span className="bg-red-600 w-2 h-8 rounded-full"></span>
                    {month.toUpperCase()}
                  </h2>
                  <div className="space-y-4">
                    {monthRaces.map((race) => (
                      <RaceCard
                        key={race.round}
                        race={race}
                        getCountryFlag={getCountryFlag}
                        getStatusColor={getStatusColor}
                        getCountdown={getCountdown}
                        onViewDetails={openRaceDetails}
                        onPredict={(id, name) => onPageChange('predict', { raceId: id, raceName: name })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {filteredRaces.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">No races match your filters</h3>
            <p className="text-gray-400">Try adjusting your filter settings</p>
          </div>
        )}
      </div>

      {/* Race Details Modal */}
      {showRaceModal && selectedRace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-600/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{getCountryFlag(selectedRace.country)}</div>
                  <div>
                    <h2 className="text-3xl font-bold">{selectedRace.raceName}</h2>
                    <p className="text-gray-400">{selectedRace.circuitName}, {selectedRace.city}</p>
                  </div>
                </div>
                <button
                  onClick={closeRaceModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Race Information */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Race Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Round:</span>
                      <span className="font-semibold">{selectedRace.round}/24</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="font-semibold">
                        {new Date(selectedRace.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Race Time:</span>
                      <span className="font-semibold text-red-400">{selectedRace.time} UTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedRace.status)}`}>
                        {selectedRace.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Circuit Details */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    Circuit Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Circuit:</span>
                      <span className="font-semibold">{selectedRace.circuitName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="font-semibold">{selectedRace.city}, {selectedRace.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="font-semibold">
                        {selectedRace.circuitName.includes('Street') ? 'Street Circuit' : 'Permanent Circuit'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Podium Details - Only show for completed races */}
                {selectedRace.status === 'completed' && (
                  <div className="bg-gray-800/50 rounded-lg p-4 md:col-span-2">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Podium Results
                    </h3>
                    {renderPodiumResults()}
                  </div>
                )}

                {/* Session Schedule */}
                <div className="bg-gray-800/50 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-500" />
                    Session Schedule
                  </h3>
                  <div className="space-y-4">
                    {selectedRace.fp1.date && (
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-semibold text-blue-400">Free Practice 1</div>
                          <div className="text-sm text-gray-400">
                            {new Date(selectedRace.fp1.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{selectedRace.fp1.time}</div>
                          <div className="text-sm text-gray-400">UTC</div>
                        </div>
                      </div>
                    )}

                    {selectedRace.sprintQualifying.date ? (
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-semibold text-green-400">Sprint Qualifying</div>
                          <div className="text-sm text-gray-400">
                            {new Date(selectedRace.sprintQualifying.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{selectedRace.sprintQualifying.time}</div>
                          <div className="text-sm text-gray-400">UTC</div>
                        </div>
                      </div>
                    ) : selectedRace.fp2.date && (
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-semibold text-green-400">Free Practice 2</div>
                          <div className="text-sm text-gray-400">
                            {new Date(selectedRace.fp2.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{selectedRace.fp2.time}</div>
                          <div className="text-sm text-gray-400">UTC</div>
                        </div>
                      </div>
                    )}

                    {selectedRace.sprint.date ? (
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-semibold text-yellow-400">Sprint Race</div>
                          <div className="text-sm text-gray-400">
                            {new Date(selectedRace.sprint.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{selectedRace.sprint.time}</div>
                          <div className="text-sm text-gray-400">UTC</div>
                        </div>
                      </div>
                    ) : selectedRace.fp3.date && (
                      <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-semibold text-yellow-400">Free Practice 3</div>
                          <div className="text-sm text-gray-400">
                            {new Date(selectedRace.fp3.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{selectedRace.fp3.time}</div>
                          <div className="text-sm text-gray-400">UTC</div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="font-semibold text-purple-400">Qualifying</div>
                        <div className="text-sm text-gray-400">
                          {selectedRace.qualifying.date ? new Date(selectedRace.qualifying.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          }) : 'TBD'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{selectedRace.qualifying.time}</div>
                        <div className="text-sm text-gray-400">UTC</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                      <div>
                        <div className="font-semibold text-red-400">Race</div>
                        <div className="text-sm text-gray-400">
                          {new Date(selectedRace.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-400">{selectedRace.time}</div>
                        <div className="text-sm text-gray-400">UTC</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    closeRaceModal();
                    onPageChange('predict', { raceName: selectedRace.raceName, raceId: selectedRace.raceName.toLowerCase().replace(/\s+/g, '-') });
                  }}
                >
                  <Target className="w-5 h-5" />
                  Make Prediction
                </button>
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                  <Bell className="w-5 h-5" />
                  Set Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}