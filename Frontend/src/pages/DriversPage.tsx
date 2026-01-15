import { useDrivers } from "../hooks/useApi";
import PageContainer from "../components/layout/PageContainer";

const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#3671C6",
  "Ferrari": "#F91536",
  "Mercedes": "#6CD3BF",
  "McLaren": "#FF8700",
  "Aston Martin": "#358C75",
  "Alpine": "#2293D1",
  "Williams": "#37BEDD",
  "Kick Sauber": "#52E252",
  "Haas": "#B6BABD",
  "Racing Bulls": "#5E8FAA",
};

function getAvatarFilename(driver: any) {
  const name = driver.name.toLowerCase().replace(/\s+/g, '');
  return `/avatars/${name}.png`;
}

function DriverCard({ driver }: { driver: any }) {
  const teamName = driver.constructors?.name || "Unknown";
  const bg = TEAM_COLORS[teamName] || driver.constructors?.color || "#222";

  return (
    <div
      className="relative rounded-xl shadow-lg flex flex-row items-stretch overflow-hidden min-h-[160px] h-[180px] md:h-[200px] w-full transition-all duration-200 cursor-pointer group"
      style={{ backgroundColor: bg }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(0,0,0,0.10) 7px, rgba(0,0,0,0.10) 8px),
            repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(0,0,0,0.10) 7px, rgba(0,0,0,0.10) 8px),
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.08) 10px, rgba(0,0,0,0.08) 11px)
          `,
          opacity: 0.7,
          borderRadius: "inherit"
        }}
      />
      <div className="flex flex-col justify-between p-6 flex-1 z-10" style={{ color: '#fff' }}>
        <div>
          <div className="font-bold text-lg md:text-xl mb-1">
            <span className="block leading-tight font-black uppercase tracking-tighter">{driver.name}</span>
          </div>
          <div className="text-sm font-semibold mb-1 opacity-80 uppercase tracking-widest">{teamName}</div>
          <div className="text-xl md:text-2xl font-black italic">{driver.number}</div>
        </div>
        <div className="absolute left-6 bottom-4 flex items-center gap-2 z-20">
          <span className="text-xl md:text-2xl text-white/40 font-mono">{driver.country_code}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-[60%] -translate-x-1/4 h-[160px] md:h-[180px] w-[120px] md:w-[150px] overflow-hidden rounded-xl flex items-end justify-center z-20">
        <img
          src={driver.image_url || getAvatarFilename(driver)}
          alt={driver.name}
          className="w-full h-full object-cover object-top drop-shadow-xl transition-transform duration-200 group-hover:scale-105"
          onError={e => (e.currentTarget.src = '/avatars/default.png')}
        />
      </div>
    </div>
  );
}

export default function DriversPage() {
  const { data: drivers, isLoading, error } = useDrivers();

  const driversByTeam = drivers?.reduce((acc: any, driver: any) => {
    const team = driver.constructors?.name || "Independent";
    if (!acc[team]) acc[team] = [];
    acc[team].push(driver);
    return acc;
  }, {}) || {};

  // Sort teams alphabetically for now, or by team points if available
  const sortedTeams = Object.keys(driversByTeam).sort();

  if (isLoading) return <div className="min-h-screen text-white pt-32 text-center">Loading drivers...</div>;
  if (error) return <div className="min-h-screen text-white pt-32 text-center text-red-500">Error: {(error as any)?.message || 'Failed to load drivers'}</div>;

  return (
    <PageContainer>
      <div className="space-y-12">
        <header className="border-l-4 border-[#E10600] pl-6 py-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            F1 Drivers <span className="text-white/20">2026 Archive</span>
          </h1>
          <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-widest">Team Hierarchy Overview</p>
        </header>

        <div className="space-y-16">
          {sortedTeams.map(teamName => (
            <section key={teamName} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">
                  {teamName}
                </h2>
                <div className="h-[1px] w-full bg-slate-800"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {driversByTeam[teamName].map((driver: any) => (
                  <DriverCard key={driver.id} driver={driver} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}