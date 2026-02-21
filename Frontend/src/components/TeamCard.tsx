import { resolveAssetUrl } from "../utils/assets";

const TeamCard = ({ team, focused, autoRotate: _autoRotate }: { team: any, focused: boolean, autoRotate: boolean }) => (
  <div
    className={`glass-card transition-all duration-500 p-8 m-4 min-w-[350px] max-w-[400px] relative ${focused ? "ring-4 ring-red-500 scale-105" : "opacity-70"
      }`}
  >
    <h2 className="text-2xl font-bold mb-2" style={{ color: team.accent }}>{team.name}</h2>
    <div className="flex items-center mb-4">
      {team.drivers.map((driver: any) => (
        <div key={driver.name || `${driver.firstName} ${driver.lastName}`} className="flex flex-col items-center mx-2">
          <div className="relative">
            <img src={resolveAssetUrl(driver.avatar)} alt={driver.name || `${driver.firstName} ${driver.lastName}`} loading="lazy" className="w-16 h-16 rounded-full border-2 border-white" />
            <span className="absolute -bottom-2 -right-2 bg-black rounded-full border border-white px-2 py-1 text-lg">{driver.flag}</span>
          </div>
          <div className="text-white font-bold">{driver.name || `${driver.firstName} ${driver.lastName}`}</div>
          <div className="text-gray-400 text-xs">{team.name}</div>
        </div>
      ))}
    </div>
    <div className="w-full h-64 flex items-center justify-center">
      <img
        src={resolveAssetUrl(team.carImage)}
        alt={`${team.name} Car`}
        loading="lazy"
        className="w-full max-h-full object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  </div>
);

export default TeamCard;
