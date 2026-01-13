import { useDrivers } from "../hooks/useApi";

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
      className="relative rounded-2xl shadow-lg flex flex-row items-stretch overflow-hidden min-h-[180px] h-[200px] md:h-[240px] w-full transition-all duration-200 cursor-pointer group"
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
      <div className="flex flex-col justify-between p-8 flex-1 z-10" style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff' }}>
        <div>
          <div className="font-bold text-xl md:text-2xl mb-1">
            <span className="block leading-tight font-black">{driver.name}</span>
          </div>
          <div className="text-base font-semibold mb-1">{teamName}</div>
          <div className="text-base md:text-lg font-extrabold mb-2">{driver.number}</div>
        </div>
        <div className="absolute left-8 bottom-4 flex items-center gap-2 z-20">
          <span className="text-2xl md:text-3xl text-white/60">{driver.country_code}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-[55%] -translate-x-1/4 h-[180px] md:h-[220px] w-[140px] md:w-[180px] overflow-hidden rounded-2xl flex items-end justify-center z-20">
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

export default function DriverPage() {
  const { data: drivers, isLoading, error } = useDrivers();

  if (isLoading) return <div className="min-h-screen text-white pt-32 text-center">Loading drivers...</div>;
  if (error) return <div className="min-h-screen text-white pt-32 text-center text-red-500">Error: {(error as any)?.message || 'Failed to load drivers'}</div>;

  return (
    <div className="min-h-screen bg-black text-white py-32 px-2">
      <h1 className="text-4xl font-bold mb-10 text-center">F1 Drivers 2026</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[98vw] mx-auto px-2 md:px-6">
        {drivers?.map(driver => (
          <DriverCard key={driver.id} driver={driver} />
        ))}
      </div>
    </div>
  );
}