// React import not required with modern JSX transform
import { teams } from "../data/teams";

const TeamsPage = () => (
  <div className="min-h-screen text-white py-32">
    <h1 className="text-4xl font-bold mb-12 text-center">F1 Teams 2025</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[98vw] mx-auto px-2 md:px-6">
      {teams.map((team) => (
        <div
          key={team.name}
          className="relative rounded-xl shadow-xl flex flex-col justify-between overflow-hidden min-h-[220px] h-[220px] md:h-[240px] w-full"
          style={{ background: team.color, minWidth: '1cm' }}
        >
          {/* Top row: Team name and logo */}
          <div className="flex justify-between items-start px-8 pt-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">{team.name}</h2>
              <div className="flex gap-6 mt-1">
                {team.drivers.map(driver => (
                  <div key={driver.firstName + driver.lastName} className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-black/10">
                      <img src={driver.avatar} alt={driver.firstName + ' ' + driver.lastName} className="w-full h-full object-cover object-top" />
                    </span>
                    <span className="text-base">{driver.flag}</span>
                    <span>
                      <span className="font-light" style={{ fontFamily: 'Orbitron, sans-serif' }}>{driver.firstName} </span>
                      <span className="font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>{driver.lastName}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10">
              <img src={team.logo} alt={team.name + ' logo'} className="w-8 h-8 object-contain" />
            </div>
          </div>
          {/* Car image */}
          <div className="flex justify-start items-end flex-1 w-full pb-1 pl-8">
            <img src={team.carImage} alt={team.name + ' car'} className="w-[95%] max-w-[520px] h-auto object-contain drop-shadow-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TeamsPage; 