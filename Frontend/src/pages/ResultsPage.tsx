import { useState } from 'react';
import { getArchiveRaces, getArchiveResults, getArchiveDriverStandings, getArchiveConstructorStandings } from '../api/jolpica';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';

// Content type filters
const CONTENT_FILTERS = [
  { id: 'races', label: 'Races' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'teams', label: 'Teams' },
];

// Available years
const AVAILABLE_YEARS = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 2025 - i);

export default function ResultsPage() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [activeContentFilter, setActiveContentFilter] = useState('races');

  const { data: archiveRaces } = useQuery({
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
      // Fetch all results for the season.
      // We'll fetch the winners first as they are the most reliable way to get a baseline
      const data = await getArchiveResults(selectedYear);

      // Map race results to a more usable format
      const resultsMap: Record<string, any> = {};

      if (data?.MRData?.RaceTable?.Races) {
        data.MRData.RaceTable.Races.forEach((race: any) => {
          resultsMap[race.round] = {
            winner: race.Results[0],
            podium: race.Results.slice(0, 3)
          };
        });
      }
      return resultsMap;
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
    <PageContainer>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <header className="border-l-4 border-[#E10600] pl-6 py-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Results Archive</h1>
            <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-widest">Historical Telemetry & Outcomes</p>
          </header>

          {/* Season Selector */}
          <div className="flex items-center gap-4 bg-slateDark/40 p-2 rounded-sm border border-slateMid/20">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Season</span>
            <select
              className="bg-transparent text-textPrimary px-4 py-1 outline-none cursor-pointer font-mono text-sm focus:text-f1Red transition-colors"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {AVAILABLE_YEARS.map(year => (
                <option key={year} value={year} className="bg-slateDark">{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-8 border-b border-slateMid/20">
          {CONTENT_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveContentFilter(filter.id)}
              className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeContentFilter === filter.id
                ? 'text-[#E10600]'
                : 'text-textSecondary hover:text-textPrimary'
                }`}
            >
              {filter.label}
              {activeContentFilter === filter.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E10600]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {resultsLoading || driversLoading || teamsLoading ? (
          <div className="py-24 text-center">
            <p className="text-textSecondary font-mono text-xs uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
          </div>
        ) : activeContentFilter === 'races' ? (
          <div className="space-y-4">
            {(!archiveRaces || archiveRaces.length === 0) ? (
              <div className="p-12 border border-dashed border-slateMid/40 text-center text-textSecondary rounded-sm">
                No session data for {selectedYear}
              </div>
            ) : (
              <div className="border border-slateMid/40 bg-slateDark/20 overflow-hidden rounded-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slateDark/40 border-b border-slateMid/40">
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Round</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grand Prix</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Winner</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Podium</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Technical</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slateMid/20">
                    {archiveRaces.map((r: any, i: number) => {
                      const result = archiveResults?.[r.round];
                      return (
                        <tr key={i} className="hover:bg-slateDark/40 transition-colors group cursor-pointer">
                          <td className="py-5 px-6 font-mono text-xs text-slate-500">R{r.round.padStart(2, '0')}</td>
                          <td className="py-5 px-6">
                            <p className="text-sm font-bold text-textPrimary uppercase tracking-tight">{r.raceName}</p>
                            <p className="text-[10px] text-textSecondary uppercase tracking-widest">{r.date ? new Date(r.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                          </td>
                          <td className="py-5 px-6">
                            {result?.winner ? (
                              <span className="text-sm font-black text-textPrimary uppercase tracking-tighter italic">
                                {result.winner.Driver?.familyName}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600 font-mono italic">DATA_PENDING</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex gap-2">
                              {result?.podium?.map((p: any, idx: number) => (
                                <span key={idx} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs border ${idx === 0 ? 'bg-[#E10600]/10 border-[#E10600]/20 text-[#E10600]' : 'bg-slateDark/50 border-slateMid/20 text-textSecondary'
                                  }`}>
                                  {p.Driver?.code || p.Driver?.familyName.slice(0, 3).toUpperCase()}
                                </span>
                              )) || <span className="text-[10px] font-mono text-slate-600">---</span>}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <button className="text-[10px] font-bold text-slate-500 hover:text-f1Red uppercase tracking-widest transition-colors border-b border-dashed border-slate-700 hover:border-f1Red">
                              Telemetry
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeContentFilter === 'drivers' ? (
          <div className="border border-slateMid/40 bg-slateDark/20 overflow-hidden rounded-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slateDark/40 border-b border-slateMid/40">
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest">Pos</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest">Driver</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest">Team</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slateMid/20">
                {driverStandings?.map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-slateDark/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-sm font-bold text-textPrimary">{d.position}</td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-textPrimary uppercase tracking-wide">
                        {d.Driver?.givenName} {d.Driver?.familyName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-textSecondary uppercase tracking-wider">
                      {d.Constructors?.[0]?.name}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-textPrimary">{d.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeContentFilter === 'teams' ? (
          <div className="border border-slateMid/40 bg-slateDark/20 overflow-hidden rounded-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slateDark/40 border-b border-slateMid/40">
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest">Pos</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest">Constructor</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest">Wins</th>
                  <th className="py-4 px-6 text-[10px] font-semibold text-textSecondary uppercase tracking-widest text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slateMid/20">
                {teamStandings?.map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-slateDark/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-sm font-bold text-textPrimary">{t.position}</td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-textPrimary uppercase tracking-wide">
                        {t.Constructor?.name}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-textSecondary">{t.wins}</td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-textPrimary">{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
