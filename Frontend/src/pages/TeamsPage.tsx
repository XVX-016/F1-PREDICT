import PageContainer from "../components/layout/PageContainer";
import { SEASON_2026_TEAMS } from "../data/season2026";

const TeamsPage = () => {
  return (
    <PageContainer>
      <header className="border-l-4 border-[#E10600] pl-6 py-2 mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">F1 Teams <span className="text-[#E10600]">2026</span></h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {[...SEASON_2026_TEAMS].sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
          <div
            key={team.id}
            className="relative rounded-xl overflow-hidden min-h-[240px] transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl group flex flex-col justify-between"
            style={{
              backgroundColor: team.color
            }}
          >
            {/* Abstract Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '8px 8px'
            }}></div>

            {/* Content Layer */}
            <div className="p-6 relative z-10 w-full">
              {/* Header: Name & Drivers - Left Aligned */}
              <div className="flex flex-col items-start w-full">
                <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md text-left">
                  {team.name}
                </h2>
                {/* Drivers: Small PFP + Name */}
                <div className="flex items-center gap-4 mt-2 justify-start">
                  {team.drivers.map((driver) => (
                    <div key={driver.id} className="flex items-center gap-2 flex-row">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 bg-black/20">
                        <img
                          src={driver.image}
                          alt={driver.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-white text-xs font-bold uppercase leading-none">{driver.name.split(' ')[0]}</span>
                        <span className="text-white/80 text-[10px] font-bold uppercase leading-none">{driver.name.split(' ').slice(1).join(' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Car Image - Anchored Bottom Left - Adjusted for spacing */}
            <div className="absolute bottom-4 left-4 w-full z-10 pointer-events-none">
              <img
                src={team.carImage}
                alt={`${team.name} Car`}
                className="w-[85%] max-w-[400px] object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'; // Hide if missing
                }}
              />
            </div>

            {/* Faded overlay for readability if needed (optional) */}
          </div>
        ))}
      </div>
    </PageContainer>
  );
};

export default TeamsPage;