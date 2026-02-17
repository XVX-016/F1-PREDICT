import PageContainer from "../components/layout/PageContainer";
import { SEASON_2026_DRIVERS } from "../data/season2026";
import { resolveAssetUrl } from "../utils/assets";

export default function DriversPage() {
  return (
    <PageContainer>
      <div className="space-y-12">
        <header className="border-l-4 border-[#E10600] pl-6 py-2 mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            F1 Drivers <span className="text-[#E10600]">2026</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
          {[...SEASON_2026_DRIVERS].sort((a, b) => a.teamName.localeCompare(b.teamName)).map((driver) => (
            <div
              key={driver.id}
              className="relative group rounded-xl overflow-hidden h-[160px] sm:h-[220px] transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]"
              style={{
                backgroundColor: driver.teamColor
              }}
            >
              {/* Texture Pattern */}
              <div className="absolute inset-0 z-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '8px 8px'
              }}></div>

              <div className="absolute inset-0 z-10 flex flex-row items-stretch">
                {/* Left Content: Info */}
                <div className="flex-1 p-5 flex flex-col justify-between relative z-20">
                  {/* Top: Name & Team */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1 flex items-center gap-2">
                      {driver.teamName}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">
                      {driver.name.split(' ')[0]} <br />
                      <span className="text-white">
                        {driver.name.split(' ').slice(1).join(' ')}
                      </span>
                    </h2>
                  </div>

                  {/* Bottom: Number */}
                  <div className="pb-1">
                    <span className="text-5xl sm:text-6xl font-black text-white/20 italic font-mono select-none leading-none">
                      {driver.number}
                    </span>
                  </div>
                </div>

                {/* Right Content: Driver Image - Upper Body Crop */}
                <div className="w-[45%] sm:w-[50%] h-full relative z-20 overflow-hidden">
                  <img
                    src={resolveAssetUrl(driver.image)}
                    alt={driver.name}
                    loading="lazy"
                    className="absolute top-2 right-0 sm:right-4 h-[180%] sm:h-[220%] w-auto max-w-none object-contain object-top transform transition-transform duration-500 group-hover:scale-[1.03] origin-top drop-shadow-2xl opacity-90 group-hover:opacity-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x400/111/444?text=' + driver.name;
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}