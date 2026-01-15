import { useConstructors } from "../hooks/useApi";
import PageContainer from "../components/layout/PageContainer";

const TeamsPage = () => {
  const { data: teams, isLoading, error } = useConstructors();

  if (isLoading) return <div className="min-h-screen text-white pt-32 text-center">Loading teams...</div>;
  if (error) return <div className="min-h-screen text-white pt-32 text-center text-red-500">Error: {(error as any)?.message || 'Failed to load teams'}</div>;

  return (
    <PageContainer>
      <header className="border-l-4 border-[#E10600] pl-6 py-2 mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">F1 Teams 2025</h1>
        <p className="text-slate-400 font-mono text-xs mt-1 uppercase tracking-widest">Constructor Presence</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams?.map((team) => (
          <div
            key={team.id}
            className="relative rounded-xl shadow-xl flex flex-col justify-between overflow-hidden min-h-[220px] h-[220px] md:h-[240px] w-full"
            style={{ background: team.color || '#333', minWidth: '1cm' }}
          >
            {/* Top row: Team name and logo */}
            <div className="flex justify-between items-start px-8 pt-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-1">{team.name}</h2>
                <div className="flex gap-6 mt-1">
                  {team.drivers?.map(driver => (
                    <div key={driver.id} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-black/10">
                        {driver.image_url ? (
                          <img src={driver.image_url} alt={driver.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <span className="text-xs">{driver.number}</span>
                        )}
                      </span>
                      <span className="text-base">{driver.country_code}</span>
                      <span>
                        <span className="font-bold uppercase text-xs" style={{ letterSpacing: '0.1em' }}>{driver.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10">
                {team.logo_url && <img src={team.logo_url} alt={team.name + ' logo'} className="w-8 h-8 object-contain" />}
              </div>
            </div>
            {/* Car image */}
            <div className="flex justify-start items-end flex-1 w-full pb-1 pl-8">
              {team.car_image_url && (
                <img src={team.car_image_url} alt={team.name + ' car'} className="w-[95%] max-w-[520px] h-auto object-contain drop-shadow-xl" />
              )}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
};

export default TeamsPage; 