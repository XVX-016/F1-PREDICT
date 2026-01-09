
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  team: string;
  nationality: string;
  flag: string;
  number: string;
}

const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#1E2C5C",
  "Ferrari": "#DC0000",
  "Mercedes": "#00D2BE",
  "McLaren": "#FF8700",
  "Aston Martin": "#00665E",
  "Alpine": "#2293D1",
  "Williams": "#005AFF",
  "Kick Sauber": "#52E252",
  "Haas": "#B6BABD",
  "Racing Bulls": "#6692FF",
};

const drivers: Driver[] = [
  { id: "piastri", firstName: "Oscar", lastName: "Piastri", team: "McLaren", nationality: "Australia", flag: "🇦🇺", number: "81" },
  { id: "norris", firstName: "Lando", lastName: "Norris", team: "McLaren", nationality: "Great Britain", flag: "🇬🇧", number: "4" },
  { id: "leclerc", firstName: "Charles", lastName: "Leclerc", team: "Ferrari", nationality: "Monaco", flag: "🇲🇨", number: "16" },
  { id: "hamilton", firstName: "Lewis", lastName: "Hamilton", team: "Ferrari", nationality: "Great Britain", flag: "🇬🇧", number: "44" },
  { id: "russell", firstName: "George", lastName: "Russell", team: "Mercedes", nationality: "Great Britain", flag: "🇬🇧", number: "63" },
  { id: "antonelli", firstName: "Andrea Kimi", lastName: "Antonelli", team: "Mercedes", nationality: "Italy", flag: "🇮🇹", number: "21" },
  { id: "verstappen", firstName: "Max", lastName: "Verstappen", team: "Red Bull Racing", nationality: "Netherlands", flag: "🇳🇱", number: "1" },
  { id: "tsunoda", firstName: "Yuki", lastName: "Tsunoda", team: "Red Bull Racing", nationality: "Japan", flag: "🇯🇵", number: "22" },
  { id: "albon", firstName: "Alexander", lastName: "Albon", team: "Williams", nationality: "Thailand", flag: "🇹🇭", number: "23" },
  { id: "sainz", firstName: "Carlos", lastName: "Sainz", team: "Williams", nationality: "Spain", flag: "🇪🇸", number: "55" },
  { id: "hulkenberg", firstName: "Nico", lastName: "Hulkenberg", team: "Kick Sauber", nationality: "Germany", flag: "🇩🇪", number: "27" },
  { id: "bortoleto", firstName: "Gabriel", lastName: "Bortoleto", team: "Kick Sauber", nationality: "Brazil", flag: "🇧🇷", number: "10" },
  { id: "lawson", firstName: "Liam", lastName: "Lawson", team: "Racing Bulls", nationality: "New Zealand", flag: "🇳🇿", number: "40" },
  { id: "hadjar", firstName: "Isack", lastName: "Hadjar", team: "Racing Bulls", nationality: "France", flag: "🇫🇷", number: "20" },
  { id: "stroll", firstName: "Lance", lastName: "Stroll", team: "Aston Martin", nationality: "Canada", flag: "🇨🇦", number: "18" },
  { id: "alonso", firstName: "Fernando", lastName: "Alonso", team: "Aston Martin", nationality: "Spain", flag: "🇪🇸", number: "14" },
  { id: "ocon", firstName: "Esteban", lastName: "Ocon", team: "Haas", nationality: "France", flag: "🇫🇷", number: "31" },
  { id: "bearman", firstName: "Oliver", lastName: "Bearman", team: "Haas", nationality: "Great Britain", flag: "🇬🇧", number: "50" },
  { id: "gasly", firstName: "Pierre", lastName: "Gasly", team: "Alpine", nationality: "France", flag: "🇫🇷", number: "10" },
  { id: "colapinto", firstName: "Franco", lastName: "Colapinto", team: "Alpine", nationality: "Argentina", flag: "🇦🇷", number: "42" },
];

function getAvatarFilename(driver: Driver) {
  // Use firstnamelastname all lowercase, no spaces
  // Handle special cases for better avatar matching
  const firstName = driver.firstName.toLowerCase().replace(/[^a-z]/g, '');
  const lastName = driver.lastName.toLowerCase().replace(/[^a-z]/g, '');
  
  // Special cases for better avatar matching
  if (driver.firstName === "Nico" && driver.lastName === "Hulkenberg") {
    return `/avatars/nicohulkenberg.png`;
  }
  
  if (driver.firstName === "Andrea Kimi" && driver.lastName === "Antonelli") {
    return `/avatars/andreakimiantonelli.png`;
  }
  
  if (driver.firstName === "Oliver" && driver.lastName === "Bearman") {
    return `/avatars/oliverbearman.png`;
  }
  
  if (driver.firstName === "Franco" && driver.lastName === "Colapinto") {
    return `/avatars/francocolapinto.png`;
  }
  
  if (driver.firstName === "Isack" && driver.lastName === "Hadjar") {
    return `/avatars/isackhadjar.png`;
  }
  
  return `/avatars/${firstName}${lastName}.png`;
}

function DriverCard({ driver }: { driver: Driver }) {
  const bg = TEAM_COLORS[driver.team] || "#222";
  return (
    <div
      className="relative rounded-2xl shadow-lg flex flex-row items-stretch overflow-hidden min-h-[180px] h-[200px] md:h-[240px] w-full transition-all duration-200 cursor-pointer group"
      style={{ backgroundColor: bg }}
    >
      {/* Black halftone pixel pattern overlay (background) */}
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
      {/* Info */}
      <div className="flex flex-col justify-between p-8 flex-1 z-10" style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff' }}>
        <div>
          <div className="font-bold text-xl md:text-2xl mb-1">
            <span className="block leading-tight font-light">{driver.firstName}</span>
            <span className="block leading-tight font-black">{driver.lastName}</span>
          </div>
          <div className="text-base font-semibold mb-1">{driver.team}</div>
          <div className="text-base md:text-lg font-extrabold mb-2">{driver.number}</div>
        </div>
        {/* Bottom left: flag only */}
        <div className="absolute left-8 bottom-4 flex items-center gap-2 z-20">
          <span className="text-2xl md:text-3xl">{driver.flag}</span>
        </div>
      </div>
      {/* Driver image - cropped above the waist, slightly left of center, flush with bottom */}
      <div className="absolute bottom-0 left-[55%] -translate-x-1/4 h-[180px] md:h-[220px] w-[140px] md:w-[180px] overflow-hidden rounded-2xl flex items-end justify-center z-20">
        <img
          src={getAvatarFilename(driver)}
          alt={driver.firstName + ' ' + driver.lastName}
          className="w-full h-full object-cover object-top drop-shadow-xl transition-transform duration-200 group-hover:scale-105"
          onError={e => (e.currentTarget.src = '/avatars/default.png')}
        />
      </div>
    </div>
  );
}

export default function DriverPage() {
  return (
    <div className="min-h-screen bg-black text-white py-32 px-2">
      <h1 className="text-4xl font-bold mb-10 text-center">F1 Drivers 2025</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[98vw] mx-auto px-2 md:px-6">
        {drivers.map(driver => (
          <DriverCard key={driver.id} driver={driver} />
        ))}
      </div>
    </div>
  );
}