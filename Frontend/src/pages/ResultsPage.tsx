import { useState } from 'react';
import { getArchiveRaces, getArchiveResults, getArchiveDriverStandings, getArchiveConstructorStandings } from '../api/jolpica';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
// Content type filters (like official F1 site)
const CONTENT_FILTERS = [
  { id: 'races', label: 'Races' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'teams', label: 'Teams' },
];

// Available years (current year + archive)
const AVAILABLE_YEARS = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 2025 - i);

// Helper functions for images
const getDriverAvatar = (driverName: string) => {
  if (!driverName) return '/avatars/default.png';

  // Handle special cases for driver names
  const specialCases: { [key: string]: string } = {
    'Nico Hulkenberg': 'nicohulkenberg',
    'Nico Hülkenberg': 'nicohulkenberg',
    'Max Verstappen': 'maxverstappen',
    'Lando Norris': 'landonorris',
    'Oscar Piastri': 'oscarpiastri',
    'Charles Leclerc': 'charlesleclerc',
    'Carlos Sainz': 'carlossainz',
    'Lewis Hamilton': 'lewishamilton',
    'George Russell': 'georgerussell',
    'Fernando Alonso': 'fernandoalonso',
    'Lance Stroll': 'lancestroll',
    'Esteban Ocon': 'estebanocon',
    'Pierre Gasly': 'pierregasly',
    'Yuki Tsunoda': 'yukitsunoda',
    'Alexander Albon': 'alexanderalbon',
    'Valtteri Bottas': 'valtteribottas',
    'Zhou Guanyu': 'zhouguanyu',
    'Kevin Magnussen': 'kevinmagnussen',
    'Daniel Ricciardo': 'danielricciardo',
    'Liam Lawson': 'liamlawson'
  };

  // Check if there's a special case mapping
  if (specialCases[driverName]) {
    return `/avatars/${specialCases[driverName]}.png`;
  }

  // Default processing
  const name = driverName.toLowerCase().replace(/\s+/g, '');
  return `/avatars/${name}.png`;
};

const getTeamLogo = (teamName: string) => {
  if (!teamName) return '/team-logos/williams.webp';

  const teamMap: { [key: string]: string } = {
    'Red Bull Racing': 'redbull',
    'Red Bull Racing Honda RBPT': 'redbull',
    'Red Bull': 'redbull',
    'Red Bull Racing Honda': 'redbull',
    'Red Bull Racing RBPT': 'redbull',
    'Ferrari': 'ferrari',
    'Mercedes': 'mercedes',
    'McLaren': 'mclaren',
    'McLaren Mercedes': 'mclaren',
    'Aston Martin': 'astonmartin',
    'Aston Martin Aramco': 'astonmartin',
    'Alpine': 'alpine',
    'Alpine F1 Team': 'alpine',
    'Williams': 'williams',
    'Haas F1 Team': 'haas',
    'Kick Sauber': 'kicksauber',
    'Sauber': 'kicksauber',
    'RB': 'racingbulls',
    'RB F1 Team': 'racingbulls',
    'Racing Bulls': 'racingbulls'
  };

  // Debug logging for Red Bull team names
  if (teamName && teamName.toLowerCase().includes('red bull')) {
    console.log('Red Bull team detected for logo:', teamName);
    console.log('Mapped to logo: redbull');
  }

  const logoName = teamMap[teamName] || 'williams';
  return `/team-logos/${logoName}.webp`;
};

const getTeamColor = (teamName: string) => {
  const teamColors: { [key: string]: string } = {
    'Red Bull Racing': '#3671C6', // Red Bull Blue
    'Red Bull Racing Honda RBPT': '#3671C6', // Red Bull Blue
    'Red Bull': '#3671C6', // Red Bull Blue
    'Red Bull Racing Honda': '#3671C6', // Red Bull Blue
    'Red Bull Racing RBPT': '#3671C6', // Red Bull Blue
    'Ferrari': '#F91536', // Ferrari Red
    'Mercedes': '#6CD3BF', // Mercedes Teal
    'McLaren': '#FF8700', // McLaren Orange
    'McLaren Mercedes': '#FF8700', // McLaren Orange
    'Aston Martin': '#358C75', // Aston Martin Green
    'Aston Martin Aramco': '#358C75', // Aston Martin Green
    'Alpine': '#2293D1', // Alpine Blue
    'Alpine F1 Team': '#2293D1', // Alpine Blue
    'Williams': '#37BEDD', // Williams Blue
    'Haas F1 Team': '#B6BABD', // Haas Gray
    'Kick Sauber': '#52E252', // Sauber Green
    'Sauber': '#52E252', // Sauber Green
    'RB': '#5E8FAA', // Racing Bulls Blue
    'RB F1 Team': '#5E8FAA', // Racing Bulls Blue
    'Racing Bulls': '#5E8FAA' // Racing Bulls Blue
  };

  // Debug logging for Red Bull team names
  if (teamName && teamName.toLowerCase().includes('red bull')) {
    console.log('Red Bull team detected:', teamName);
    console.log('Applied color:', teamColors[teamName] || '#3671C6');
  }

  return teamColors[teamName] || '#6B7280'; // Default gray
};

const getCountryFlag = (nationality: string) => {
  const flagMap: { [key: string]: string } = {
    'Dutch': '🇳🇱',
    'British': '🇬🇧',
    'Spanish': '🇪🇸',
    'Monaco': '🇲🇨',
    'Australian': '🇦🇺',
    'Canadian': '🇨🇦',
    'French': '🇫🇷',
    'Japanese': '🇯🇵',
    'Chinese': '🇨🇳',
    'Thai': '🇹🇭',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'American': '🇺🇸',
    'Mexican': '🇲🇽',
    'Danish': '🇩🇰',
    'Finnish': '🇫🇮',
    'Russian': '🇷🇺'
  };
  return flagMap[nationality] || '🏁';
};

const getTrackCountry = (raceName: string) => {
  const trackMap: { [key: string]: string } = {
    'Bahrain Grand Prix': 'Bahrain',
    'Saudi Arabian Grand Prix': 'Saudi Arabia',
    'Australian Grand Prix': 'Australia',
    'Japanese Grand Prix': 'Japan',
    'Chinese Grand Prix': 'China',
    'Miami Grand Prix': 'United States',
    'Emilia Romagna Grand Prix': 'Italy',
    'Monaco Grand Prix': 'Monaco',
    'Canadian Grand Prix': 'Canada',
    'Spanish Grand Prix': 'Spain',
    'Austrian Grand Prix': 'Austria',
    'British Grand Prix': 'United Kingdom',
    'Hungarian Grand Prix': 'Hungary',
    'Belgian Grand Prix': 'Belgium',
    'Dutch Grand Prix': 'Netherlands',
    'Italian Grand Prix': 'Italy',
    'Azerbaijan Grand Prix': 'Azerbaijan',
    'Singapore Grand Prix': 'Singapore',
    'United States Grand Prix': 'United States',
    'Mexico City Grand Prix': 'Mexico',
    'São Paulo Grand Prix': 'Brazil',
    'Las Vegas Grand Prix': 'United States',
    'Qatar Grand Prix': 'Qatar',
    'Abu Dhabi Grand Prix': 'UAE'
  };
  return trackMap[raceName] || raceName.replace(' Grand Prix', '');
};

export default function ResultsPage() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [activeContentFilter, setActiveContentFilter] = useState('races');
  const [error] = useState('');

  // Using TanStack Query directly here for simplicity since it interacts with jolpica
  useQuery({
    queryKey: ['archive-races', selectedYear],
    queryFn: async () => {
      const data = await getArchiveRaces(selectedYear);
      let raceArray = [];
      if (Array.isArray(data)) raceArray = data;
      else if (data?.MRData?.RaceTable?.Races) raceArray = data.MRData.RaceTable.Races;
      return raceArray;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const { data: archiveResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['archive-results', selectedYear],
    queryFn: async () => {
      // Fetch all results for the season in one go if possible, or handle cleverly
      // Ergast doesn't have a simple "all winners" endpoint without rounds
      // But we can fetch /results which returns all finishers for all races if we omit round
      const data = await getArchiveResults(selectedYear);
      let resultsArray: any[] = [];

      // Ergast /results returns multiple races each with its own Results array
      if (data?.MRData?.RaceTable?.Races) {
        resultsArray = data.MRData.RaceTable.Races.map((race: any) => ({
          ...race.Results[0], // Winner only as per UI
          raceName: race.raceName,
          date: race.date,
          round: race.round
        }));
      }
      return resultsArray;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: activeContentFilter === 'races',
  });

  const { data: driverStandings, isLoading: driversLoading } = useQuery({
    queryKey: ['archive-drivers', selectedYear],
    queryFn: async () => {
      const data = await getArchiveDriverStandings(selectedYear);
      let standingsArray = [];
      if (Array.isArray(data)) standingsArray = data;
      else if (data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) {
        standingsArray = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
      }
      return standingsArray;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: activeContentFilter === 'drivers',
  });

  const { data: teamStandings, isLoading: teamsLoading } = useQuery({
    queryKey: ['archive-teams', selectedYear],
    queryFn: async () => {
      const data = await getArchiveConstructorStandings(selectedYear);
      let standingsArray = [];
      if (Array.isArray(data)) standingsArray = data;
      else if (data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings) {
        standingsArray = data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
      }
      return standingsArray;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: activeContentFilter === 'teams',
  });

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Hero Background is handled globally in App.tsx */}

      {/* Top Red Line */}
      <div className="relative z-20 h-1 bg-red-600"></div>

      {/* F1 Archive Header */}
      <div className="relative z-20 bg-black/80 backdrop-blur-sm pt-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white">F1 RESULTS</h1>
          <p className="text-gray-400 mt-2">Historical Formula 1 data and results</p>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="relative z-20 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            {/* Year Selector */}
            <div className="relative">
              <select
                className="bg-transparent text-white border-none outline-none cursor-pointer pr-8 appearance-none font-medium"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {AVAILABLE_YEARS.map(year => (
                  <option key={year} value={year} className="bg-gray-900">
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Content Type Filters - All on the right side */}
            <div className="flex items-center space-x-8 ml-8">
              {CONTENT_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveContentFilter(filter.id)}
                  className={`text-gray-300 hover:text-white transition-colors pb-2 font-medium ${activeContentFilter === filter.id
                    ? 'text-white border-b-2 border-red-600'
                    : ''
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Race Selection and Filter Bar */}
        {activeContentFilter === 'races' && null}

        {/* Content Display */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg p-6 overflow-x-auto">
          {error ? (
            <div className="text-center py-12 text-lg text-red-400">{error}</div>
          ) : (resultsLoading || driversLoading || teamsLoading) ? (
            <div className="text-center py-12 text-lg text-gray-400">Loading...</div>
          ) : activeContentFilter === 'races' ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">{selectedYear} RACE RESULTS</h2>
              {(!archiveResults || archiveResults.length === 0) ? (
                <div className="text-center py-8 text-gray-400">No race results available for this season.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="py-3 px-4 text-left font-medium">GRAND PRIX</th>
                      <th className="py-3 px-4 text-left font-medium">DATE</th>
                      <th className="py-3 px-4 text-left font-medium">WINNER</th>
                      <th className="py-3 px-4 text-left font-medium">TEAM</th>
                      <th className="py-3 px-4 text-right font-medium">LAPS</th>
                      <th className="py-3 px-4 text-right font-medium">TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveResults.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-all">
                        <td className="py-3 px-4">
                          <span className="text-white text-base">{getTrackCountry(r.raceName) || 'Unknown'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white text-base">{r.date ? new Date(r.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                              style={{ backgroundColor: getTeamColor(r.Constructor?.name) }}
                            >
                              <img
                                src={getDriverAvatar(`${r.Driver?.givenName}${r.Driver?.familyName}`)}
                                alt={r.Driver?.familyName}
                                className="w-7 h-7 rounded-full object-cover object-top"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <span className="text-white text-base">
                              {r.Driver?.givenName} {r.Driver?.familyName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                              style={{ backgroundColor: getTeamColor(r.Constructor?.name) }}
                            >
                              <img
                                src={getTeamLogo(r.Constructor?.name)}
                                alt={r.Constructor?.name}
                                className="w-7 h-7 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <span className="text-white text-base">{r.Constructor?.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-white text-base">{r.laps}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-white text-base">{r.Time ? r.Time.time : r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : activeContentFilter === 'drivers' ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">{selectedYear} DRIVER STANDINGS</h2>
              {(!driverStandings || driverStandings.length === 0) ? (
                <div className="text-center py-8 text-gray-400">No driver standings available for this season.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="py-2 pr-4">POS.</th>
                      <th className="py-2 pr-4">DRIVER</th>
                      <th className="py-2 pr-4">NATIONALITY</th>
                      <th className="py-2 pr-4">TEAM</th>
                      <th className="py-2 pr-4">PTS.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverStandings?.map((d: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-all">
                        <td className="py-2 pr-4 font-bold">{d.position}</td>
                        <td className="py-2 pr-4 flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: getTeamColor(d.Constructors?.[0]?.name) }}
                          >
                            <img
                              src={getDriverAvatar(`${d.Driver?.givenName}${d.Driver?.familyName}`)}
                              alt={d.Driver?.familyName}
                              className="w-5 h-5 rounded-full object-cover object-top"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <span className="font-medium">{d.Driver?.givenName} {d.Driver?.familyName}</span>
                          <span className="text-lg">{getCountryFlag(d.Driver?.nationality)}</span>
                        </td>
                        <td className="py-2 pr-4">{d.Driver?.nationality}</td>
                        <td className="py-2 pr-4 flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: getTeamColor(d.Constructors?.[0]?.name) }}
                          >
                            <img
                              src={getTeamLogo(d.Constructors?.[0]?.name)}
                              alt={d.Constructors?.[0]?.name}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <span>{d.Constructors?.[0]?.name}</span>
                        </td>
                        <td className="py-2 pr-4">{d.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : activeContentFilter === 'teams' ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">{selectedYear} TEAM STANDINGS</h2>
              {(!teamStandings || teamStandings.length === 0) ? (
                <div className="text-center py-8 text-gray-400">No team standings available for this season.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="py-2 pr-4">POS.</th>
                      <th className="py-2 pr-4">TEAM</th>
                      <th className="py-2 pr-4">PTS.</th>
                      <th className="py-2 pr-4">WINS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStandings?.map((t: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-all">
                        <td className="py-2 pr-4 font-bold">{t.position}</td>
                        <td className="py-2 pr-4 flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: getTeamColor(t.Constructor?.name) }}
                          >
                            <img
                              src={getTeamLogo(t.Constructor?.name)}
                              alt={t.Constructor?.name}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <span>{t.Constructor?.name}</span>
                        </td>
                        <td className="py-2 pr-4">{t.points}</td>
                        <td className="py-2 pr-4">{t.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
} 