import { useEffect, useState } from 'react';
import { getDriverStandings, getRaces, getResults } from '../api/jolpica';
import { Trophy, Flag, Clock, MapPin } from 'lucide-react';

// Helper functions for images
const getDriverAvatar = (driverName: string) => {
  const name = driverName.toLowerCase().replace(/\s+/g, '');
  return `/avatars/${name}.png`;
};

const getTeamLogo = (teamName: string) => {
  const teamMap: { [key: string]: string } = {
    'Red Bull Racing': 'redbull',
    'Ferrari': 'ferrari',
    'Mercedes': 'mercedes',
    'McLaren': 'mclaren',
    'Aston Martin': 'astonmartin',
    'Alpine': 'alpine',
    'Williams': 'williams',
    'Haas F1 Team': 'haas',
    'Kick Sauber': 'kicksauber',
    'RB': 'racingbulls'
  };
  const logoName = teamMap[teamName] || 'williams';
  return `/team-logos/${logoName}.webp`;
};

const getCountryFlag = (nationality: string) => {
  const flagMap: { [key: string]: string } = {
    'Dutch': '🇳🇱', 'British': '🇬🇧', 'Spanish': '🇪🇸', 'Monaco': '🇲🇨',
    'Australian': '🇦🇺', 'Canadian': '🇨🇦', 'French': '🇫🇷', 'Japanese': '🇯🇵',
    'Chinese': '🇨🇳', 'Thai': '🇹🇭', 'German': '🇩🇪', 'Italian': '🇮🇹',
    'American': '🇺🇸', 'Mexican': '🇲🇽', 'Danish': '🇩🇰', 'Finnish': '🇫🇮',
    'Russian': '🇷🇺'
  };
  return flagMap[nationality] || '🏁';
};

const TelemetryDashboard: React.FC = () => {
  const [standings, setStandings] = useState<any>(null);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState('');

  const [nextRace, setNextRace] = useState<any>(null);
  const [nextRaceLoading, setNextRaceLoading] = useState(true);
  const [nextRaceError, setNextRaceError] = useState('');

  // Fetch driver standings
  useEffect(() => {
    setStandingsLoading(true);
    getDriverStandings()
      .then(data => {
        console.log('Driver Standings Data:', data);
        setStandings(data);
        setStandingsLoading(false);
      })
      .catch(() => {
        setStandingsError('Failed to load driver standings.');
        setStandingsLoading(false);
      });
  }, []);

  // Fetch next race info
  useEffect(() => {
    setNextRaceLoading(true);
    getRaces()
      .then(data => {
        console.log('Races Data:', data);
        const races = data?.MRData?.RaceTable?.Races || [];
        const now = new Date();
        const next = races.find((race: any) => new Date(race.date) >= now);
        setNextRace(next);
        setNextRaceLoading(false);
      })
      .catch(() => {
        setNextRaceError('Failed to load next race info.');
        setNextRaceLoading(false);
      });
  }, []);

  const driverStandings = standings?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-2 text-white">2025 DRIVER'S STANDINGS</h2>
        <p className="text-gray-400">Live Formula 1 championship standings</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Live Driver Standings - Main Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
            {standingsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading standings...</div>
            ) : standingsError ? (
              <div className="text-center py-8 text-red-400">{standingsError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="py-3 px-4">POS.</th>
                      <th className="py-3 px-4">DRIVER</th>
                      <th className="py-3 px-4">NATIONALITY</th>
                      <th className="py-3 px-4">TEAM</th>
                      <th className="py-3 px-4 text-right">PTS.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverStandings.slice(0, 10).map((driver: any, index: number) => (
                      <tr key={driver.position} className="border-b border-gray-800 hover:bg-gray-800/40 transition-all">
                        <td className="py-3 px-4 font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${driver.position}`}
                        </td>
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img 
                            src={getDriverAvatar(`${driver.Driver?.givenName}${driver.Driver?.familyName}`)} 
                            alt={driver.Driver?.familyName}
                            className="w-8 h-8 rounded-full object-cover object-top"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="font-semibold text-white">
                            {driver.Driver?.givenName} {driver.Driver?.familyName}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(driver.Driver?.nationality)}</span>
                          <span className="text-gray-300">{driver.Driver?.nationality?.substring(0, 3).toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img 
                            src={getTeamLogo(driver.Constructors?.[0]?.name)} 
                            alt={driver.Constructors?.[0]?.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="text-white">{driver.Constructors?.[0]?.name}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-lg text-white">{driver.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Next Race Info - Side Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Flag className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold text-white">Next Race</h3>
            </div>
            
            {nextRaceLoading ? (
              <div className="text-center py-8 text-gray-400">Loading next race...</div>
            ) : nextRaceError ? (
              <div className="text-center py-8 text-red-400">{nextRaceError}</div>
            ) : nextRace ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-white mb-2">{nextRace.raceName}</h4>
                  <p className="text-gray-400">{nextRace.Circuit?.circuitName}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-white font-semibold">
                        {new Date(nextRace.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-400">
                        {nextRace.time ? `${nextRace.time.substring(0, 5)} UTC` : 'Time TBA'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-white font-semibold">Round {nextRace.round}</div>
                      <div className="text-sm text-gray-400">2025 Season</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No upcoming races found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryDashboard;